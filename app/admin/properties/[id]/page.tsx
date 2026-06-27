"use client";

// app/admin/properties/[id]/page.tsx
//
// STAGE 1 of Supabase migration: the PROPERTY itself now loads from
// Supabase (the `properties` table) instead of the static data/properties.ts
// file. Tenants, notes, and expenditure are still local/static for now —
// those get migrated in later stages.

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  Building2, Home, Users, TrendingUp, ArrowLeft, Phone,
  CheckCircle, AlertTriangle, Pencil, Save, X, StickyNote,
  Plus, Trash2, FileSpreadsheet, Clock, Download, FileText, ChevronDown,
  Loader2, UserPlus,
} from "lucide-react";

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  paid:    { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB" },
  overdue: { bg: "#FCEBEB", text: "#791F1F", border: "#E24B4A" },
  partial: { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
  pending: { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" },
};

type ExpRow = { id: string; date: string; item: string; amount: number };
type HistoryEntry = { flatNo: string; tenantName: string; from: string; to: string; rent: number };

// Shape of a row coming back from the Supabase `properties` table.
// Column names are snake_case in Postgres; we map them to the same
// camelCase shape the rest of this page already expects, so nothing
// else below has to change.
type SupabaseProperty = {
  id: number;
  name: string;
  address: string;
  total_flats: number;
  monthly_collection: number;
};

// Shape of a row coming back from the Supabase `tenants` table, used for
// this building's "Flats & tenant details" list. Co-tenants aren't joined
// in yet (see note further down), so occupant count is always 1 for now.
type SupabaseTenant = {
  id: number;
  name: string;
  phone: string;
  email: string;
  building: string;
  flat_no: string;
  rent: number;
  status: string;
  approved: boolean;
  access_enabled: boolean;
};

// Co-tenant shape for the Add Tenant modal on this page (mirrors the
// Tenants list page's Add modal exactly).
type CoTenant = {
  id: number | string;
  name: string; age: string; phone: string; email: string; aadhar: string;
  isNew?: boolean;
};
let _newCoIdProp = 1;
function blankCoTenantProp(): CoTenant {
  return { id: `new${_newCoIdProp++}`, name: "", age: "", phone: "", email: "", aadhar: "", isNew: true };
}

const EMPTY_NEW_TENANT_FORM = {
  name: "", flatNo: "", rent: "", phone: "", email: "", age: "", aadhar: "",
};

const SAMPLE_HISTORY: HistoryEntry[] = [
  { flatNo: "101", tenantName: "Ravi Kumar",   from: "Jan 2023", to: "Present", rent: 18000 },
  { flatNo: "102", tenantName: "Meena Iyer",   from: "Mar 2022", to: "Dec 2022", rent: 16000 },
  { flatNo: "102", tenantName: "Arjun Mehta",  from: "Jan 2023", to: "Present", rent: 17500 },
  { flatNo: "201", tenantName: "Divya Rao",    from: "Jun 2021", to: "May 2024", rent: 15000 },
  { flatNo: "201", tenantName: "Sanjay Gupta", from: "Jun 2024", to: "Present", rent: 19000 },
];

export default function AdminBuildingPage() {
  const params = useParams();
  const id = params.id as string;

  // ── Property now comes from Supabase, not data/properties.ts ──
  const [property, setProperty] = useState<SupabaseProperty | null>(null);
  const [buildingTenants, setBuildingTenants] = useState<SupabaseTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── Add tenant modal (pre-filled with this building) ──
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenant, setNewTenant] = useState(EMPTY_NEW_TENANT_FORM);
  const [newCoTenants, setNewCoTenants] = useState<CoTenant[]>([]);
  const [addTenantError, setAddTenantError] = useState("");

  function openAddTenantModal() {
    setNewTenant(EMPTY_NEW_TENANT_FORM);
    setNewCoTenants([]);
    setAddTenantError("");
    setShowAddTenantModal(true);
  }
  function addNewCoTenant() {
    setNewCoTenants((prev) => [...prev, blankCoTenantProp()]);
  }
  function updateNewCoTenant(id: number | string, field: keyof Omit<CoTenant, "id" | "isNew">, val: string) {
    setNewCoTenants((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeNewCoTenant(id: number | string) {
    setNewCoTenants((prev) => prev.filter((c) => c.id !== id));
  }
  async function submitNewTenant() {
    if (!property) return;
    if (!newTenant.name.trim() || !newTenant.flatNo.trim()) {
      setAddTenantError("Please enter at least a name and flat number.");
      return;
    }
    setAddTenantError("");

    const { data: inserted, error } = await supabase
      .from("tenants")
      .insert({
        name: newTenant.name.trim(),
        building: property.name,
        flat_no: newTenant.flatNo.trim(),
        rent: Number(newTenant.rent) || 0,
        phone: newTenant.phone,
        email: newTenant.email,
        age: newTenant.age ? Number(newTenant.age) : null,
        aadhar: newTenant.aadhar.trim() || null,
        status: "occupied",
        risk: "low",
        approved: true,
        access_enabled: true,
      })
      .select()
      .single();

    if (error) {
      setAddTenantError(error.message);
      return;
    }

    const validCoTenants = newCoTenants.filter((c) => c.name.trim());
    if (validCoTenants.length > 0 && inserted) {
      const { error: coError } = await supabase.from("co_tenants").insert(
        validCoTenants.map((c) => ({
          tenant_id: inserted.id,
          name: c.name,
          age: c.age ? Number(c.age) : null,
          phone: c.phone,
          email: c.email,
          aadhar: c.aadhar.trim() || null,
        }))
      );
      if (coError) {
        setAddTenantError(`Tenant added, but co-tenants failed to save: ${coError.message}`);
      }
    }

    setShowAddTenantModal(false);
    // Refetch this building's tenants so the new one shows immediately
    const { data: freshTenants } = await supabase
      .from("tenants")
      .select("*")
      .eq("building", property.name)
      .order("flat_no", { ascending: true });
    if (freshTenants) setBuildingTenants(freshTenants);
  }

  // Shared co-tenant card UI for the Add Tenant modal on this page
  function CoTenantCardProp({ co, onUpdate, onRemove }: {
    co: CoTenant;
    onUpdate: (f: keyof Omit<CoTenant, "id" | "isNew">, v: string) => void;
    onRemove: () => void;
  }) {
    return (
      <div className="rounded-lg p-3 mb-2" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Additional tenant</span>
          <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
            <X size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="col-span-2">
            <input value={co.name} onChange={(e) => onUpdate("name", e.target.value)}
              placeholder="Full name" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
              style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
          </div>
          <div>
            <input type="number" value={co.age} onChange={(e) => onUpdate("age", e.target.value)}
              placeholder="Age" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
              style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input value={co.phone} onChange={(e) => onUpdate("phone", e.target.value)}
            placeholder="Phone" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
            style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
          <input value={co.email} onChange={(e) => onUpdate("email", e.target.value)}
            placeholder="Email" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
            style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
        </div>
        <input value={co.aadhar} onChange={(e) => onUpdate("aadhar", e.target.value)}
          placeholder="Aadhar number" className="w-full px-2.5 py-1.5 text-xs rounded-lg font-mono"
          style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
      </div>
    );
  }

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      setLoadError("");

      // The URL param is the building name (e.g. "ohm"), matching the
      // old behaviour where /admin/properties/ohm looked up by name.
      // We match case-insensitively against the `name` column.
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .ilike("name", decodeURIComponent(id))
        .maybeSingle();

      if (error) {
        setLoadError(error.message);
      } else {
        setProperty(data);
      }
      setLoading(false);
    }
    loadProperty();
  }, [id]);

  const [tab, setTab] = useState<"overview" | "edit" | "notes" | "expenditure" | "history">("overview");

  const [editing, setEditing]   = useState(false);
  const [address, setAddress]   = useState("");
  const [totalFlats, setTotalFlats] = useState("");
  const [monthlyCollection, setMonthlyCollection] = useState("");
  const [saved, setSaved]       = useState("");
  const [saveError, setSaveError] = useState("");

  // Keep the edit form in sync once the property finishes loading
  useEffect(() => {
    if (property) {
      setAddress(property.address);
      setTotalFlats(String(property.total_flats));
      setMonthlyCollection(String(property.monthly_collection));
    }
  }, [property]);

  // Fetch this building's tenants from Supabase once we know the building name
  useEffect(() => {
    async function loadBuildingTenants() {
      if (!property) return;
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("building", property.name)
        .order("flat_no", { ascending: true });

      if (!error && data) {
        setBuildingTenants(data);
      }
    }
    loadBuildingTenants();
  }, [property]);

  // Notes are now a real list of dated entries per building, stored in
  // the `notes` table — not one big local textarea.
  type NoteEntry = { id: number; content: string; created_at: string };
  const [notesList, setNotesList] = useState<NoteEntry[]>([]);
  const [notesError, setNotesError] = useState("");
  const [newNoteText, setNewNoteText] = useState("");

  useEffect(() => {
    async function loadNotes() {
      if (!property) return;
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("property_id", property.id)
        .order("created_at", { ascending: false });

      if (error) {
        setNotesError(error.message);
      } else if (data) {
        setNotesList(data);
      }
    }
    loadNotes();
  }, [property]);

  async function addNote() {
    if (!property || !newNoteText.trim()) return;
    setNotesError("");

    const { data, error } = await supabase
      .from("notes")
      .insert({ property_id: property.id, content: newNoteText.trim() })
      .select()
      .single();

    if (error) {
      setNotesError(error.message);
      return;
    }
    setNotesList((prev) => [data, ...prev]);
    setNewNoteText("");
  }

  // Edit an existing note in place
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteText, setEditNoteText] = useState("");

  function startEditNote(note: NoteEntry) {
    setEditingNoteId(note.id);
    setEditNoteText(note.content);
    setNotesError("");
  }
  function cancelEditNote() {
    setEditingNoteId(null);
    setEditNoteText("");
  }
  async function saveEditNote() {
    if (editingNoteId === null || !editNoteText.trim()) return;
    setNotesError("");

    const { error } = await supabase
      .from("notes")
      .update({ content: editNoteText.trim() })
      .eq("id", editingNoteId);

    if (error) {
      setNotesError(error.message);
      return;
    }
    setNotesList((prev) => prev.map((n) =>
      n.id === editingNoteId ? { ...n, content: editNoteText.trim() } : n
    ));
    setEditingNoteId(null);
    setEditNoteText("");
  }

  async function deleteNote(note: NoteEntry) {
    if (!confirm("Delete this note? This cannot be undone.")) return;
    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    if (error) {
      setNotesError(error.message);
      return;
    }
    setNotesList((prev) => prev.filter((n) => n.id !== note.id));
  }

  // Expenditure now loads from and saves to the real `expenditure` table
  const [expRows, setExpRows] = useState<ExpRow[]>([]);
  const [expError, setExpError] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    async function loadExpenditure() {
      if (!property) return;
      const { data, error } = await supabase
        .from("expenditure")
        .select("*")
        .eq("property_id", property.id)
        .order("date", { ascending: false });

      if (error) {
        setExpError(error.message);
      } else if (data) {
        setExpRows(data.map((r) => ({ id: String(r.id), date: r.date, item: r.item ?? "", amount: r.amount })));
      }
    }
    loadExpenditure();
  }, [property]);

  // expTotal must be computed here, alongside the other hooks, BEFORE any
  // early returns below — React requires the same hooks to run in the same
  // order on every render, and the loading/error/not-found returns below
  // would otherwise skip this hook on the first render but not subsequent
  // ones, which is exactly what caused "Rendered more hooks than during
  // the previous render."
  const expTotal = useMemo(() => expRows.reduce((s, r) => s + r.amount, 0), [expRows]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading building from database...</p>
      </div>
    );
  }

  // ── Error state — distinct from "not found", since this is a real
  // connection/query problem worth surfacing clearly ──
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load this building from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
        <Link href="/admin/properties" className="text-xs mt-3 inline-block" style={{ color: "#1B4FBB" }}>
          ← Back to Properties
        </Link>
      </div>
    );
  }

  // ── Not found ──
  if (!property) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Building2 size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Building not found</p>
        <Link href="/admin/properties" className="text-xs mt-2 inline-block" style={{ color: "#1B4FBB" }}>
          ← Back to Properties
        </Link>
      </div>
    );
  }

  // buildingTenants now comes from Supabase (fetched in the useEffect
  // above). Co-tenant counts and "Overdue" payment status aren't wired
  // into the tenants table yet, so occupied/overdue use what IS real
  // (status, approved) and approximate the rest for this stage.
  const occupied = buildingTenants.filter((t) => t.status === "occupied").length;
  const overdue  = 0; // payment status isn't in the tenants table yet — see payment_history migration
  const vacant   = Math.max(property.total_flats - occupied, 0);
  const buildingHistory = SAMPLE_HISTORY;

  // ── Save building info — now writes back to Supabase ──
  async function saveInfo() {
    setSaveError("");
    const { error } = await supabase
      .from("properties")
      .update({ address, total_flats: Number(totalFlats) || 0, monthly_collection: Number(monthlyCollection) || 0 })
      .eq("id", property!.id);

    if (error) {
      setSaveError(error.message);
      return;
    }

    // Reflect the change locally so the rest of the page (metric cards,
    // header) updates immediately without a full refetch.
    setProperty((prev) => prev ? { ...prev, address, total_flats: Number(totalFlats) || 0, monthly_collection: Number(monthlyCollection) || 0 } : prev);
    setSaved(`Saved at ${new Date().toLocaleTimeString()}`);
    setEditing(false);
    setTimeout(() => setSaved(""), 3000);
  }

  async function addExpRow() {
    if (!property) return;
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("expenditure")
      .insert({ property_id: property.id, date: today, item: "", amount: 0 })
      .select()
      .single();

    if (error) {
      setExpError(error.message);
      return;
    }
    setExpRows((prev) => [{ id: String(data.id), date: data.date, item: data.item ?? "", amount: data.amount }, ...prev]);
  }
  async function updateExpRow(rid: string, field: keyof ExpRow, val: string | number) {
    // Update local state immediately so typing feels responsive...
    setExpRows((prev) => prev.map((r) => r.id === rid ? { ...r, [field]: val } : r));
    // ...then persist that single field to Supabase.
    const { error } = await supabase
      .from("expenditure")
      .update({ [field]: val })
      .eq("id", Number(rid));
    if (error) setExpError(error.message);
  }
  async function deleteExpRow(rid: string) {
    if (!confirm("Delete this expense entry?")) return;
    const { error } = await supabase.from("expenditure").delete().eq("id", Number(rid));
    if (error) {
      setExpError(error.message);
      return;
    }
    setExpRows((prev) => prev.filter((r) => r.id !== rid));
  }

  function downloadExcel() {
    const rows = expRows.map((r) => ({
      Date: r.date,
      Item: r.item || "(untitled)",
      "Amount (₹)": r.amount,
    }));
    rows.push({ Date: "", Item: "TOTAL", "Amount (₹)": expTotal });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 32 }, { wch: 14 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenditure");

    if (!property) return;
    const fileName = `${property.name}_Expenditure_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportMenu(false);
  }

  function downloadPDF() {
    if (!property) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${property.name} — Expenditure Report`, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString("en-IN")}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Item", "Amount (₹)"]],
      body: expRows.map((r) => [r.date, r.item || "(untitled)", r.amount.toLocaleString("en-IN")]),
      foot: [["", "TOTAL", expTotal.toLocaleString("en-IN")]],
      headStyles: { fillColor: [27, 79, 187] },
      footStyles: { fillColor: [240, 192, 64], textColor: [19, 57, 160], fontStyle: "bold" },
      styles: { fontSize: 9 },
    });

    const fileName = `${property.name}_Expenditure_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    setShowExportMenu(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: "#6B7280" }}>
        <Link href="/admin/properties" className="flex items-center gap-1 hover:underline" style={{ color: "#1B4FBB" }}>
          <ArrowLeft size={13} /> Properties
        </Link>
        <span>/</span>
        <span>{property.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>{property.name}</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>{property.address}</p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "#F0C040", color: "#1339A0" }}>
          {occupied} / {property.total_flats} occupied
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Home size={13} /> Total flats</div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{property.total_flats}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#E1F5EE", border: "1.5px solid #9FE1CB" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><CheckCircle size={13} /> Occupied</div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>{occupied}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Home size={13} /> Vacant</div>
          <div className="text-xl font-semibold" style={{ color: "#6B7280" }}>{vacant}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "2px solid #F0C040" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><TrendingUp size={13} /> Monthly rent</div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>₹{property.monthly_collection.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {overdue > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-5 text-sm" style={{ background: "#FCEBEB", border: "1.5px solid #F7C1C1" }}>
          <AlertTriangle size={14} style={{ color: "#A32D2D" }} />
          <span style={{ color: "#791F1F" }}><strong>{overdue} flat{overdue > 1 ? "s" : ""}</strong> with overdue rent in this building.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 mb-5 overflow-x-auto" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(27,79,187,0.12)" }}>
        {([
          { id: "overview",    label: "Overview",    icon: Users },
          { id: "history",     label: "Flat history", icon: Clock },
          { id: "edit",        label: "Edit info",    icon: Pencil },
          { id: "notes",       label: "Notes",        icon: StickyNote },
          { id: "expenditure", label: "Expenditure",  icon: FileSpreadsheet },
        ] as const).map(({ id: tid, label, icon: Icon }) => (
          <button key={tid} onClick={() => setTab(tid)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap"
            style={{
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottomWidth: 2,
              borderBottomStyle: "solid",
              borderBottomColor: tab === tid ? "#1B4FBB" : "transparent",
              color: tab === tid ? "#1B4FBB" : "#6B7280",
              background: "transparent",
              cursor: "pointer",
            }}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <>
          <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1.5px solid rgba(27,79,187,0.18)" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ background: "#F5F7FB", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
              <div className="flex items-center gap-2">
                <Users size={14} style={{ color: "#1B4FBB" }} />
                <span className="text-sm font-semibold" style={{ color: "#111827" }}>Flats &amp; tenant details</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E8F0FE", color: "#1B4FBB" }}>
                  {buildingTenants.length} tenants
                </span>
                <button onClick={openAddTenantModal}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                  <Plus size={12} /> Add tenant
                </button>
              </div>
            </div>

            <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2"
              style={{ gridTemplateColumns: "1.4fr 0.5fr 0.9fr 0.6fr 0.8fr 0.8fr 0.8fr", background: "#FAFBFF", color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.08)" }}>
              <div>Tenant</div><div>Flat</div><div>Rent</div><div>Occ.</div><div>Status</div><div>Approval</div><div>Access</div>
            </div>

            {buildingTenants.length > 0 ? (
              buildingTenants.map((tenant, i) => {
                // Payment status isn't in the tenants table yet (coming
                // with payment_history migration) — approximate using
                // status for now so the column isn't blank.
                const approxPaymentStatus = tenant.status === "occupied" ? "Paid" : "Pending approval";
                const ss = statusStyles[
                  approxPaymentStatus.toLowerCase() === "paid" ? "paid" : "pending"
                ] ?? statusStyles.pending;
                // Co-tenants aren't joined in yet — occupant count is
                // always 1 for this stage.
                const occupants = 1;

                return (
                  <div key={tenant.id} className="grid px-4 py-3 items-center text-sm hover:bg-blue-50 transition"
                    style={{ gridTemplateColumns: "1.4fr 0.5fr 0.9fr 0.6fr 0.8fr 0.8fr 0.8fr", borderTop: i===0?"none":"1px solid rgba(27,79,187,0.07)", background: "#fff" }}>
                    <div>
                      <Link href={`/admin/tenant/${tenant.id}`} className="text-xs font-semibold hover:underline" style={{ color: "#1B4FBB" }}>
                        {tenant.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>
                          <Phone size={10} className="inline mr-0.5" />{tenant.phone}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-medium" style={{ color: "#111827" }}>{tenant.flat_no}</div>
                    <div className="text-xs font-semibold" style={{ color: "#111827" }}>₹{tenant.rent.toLocaleString("en-IN")}/mo</div>
                    <div className="text-xs" style={{ color: "#6B7280" }}>
                      {occupants}
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>
                        {approxPaymentStatus}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={tenant.approved ? { background: "#E1F5EE", color: "#085041" } : { background: "#FAEEDA", color: "#633806" }}>
                        {tenant.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={tenant.access_enabled ? { background: "#E6F1FB", color: "#0C447C" } : { background: "#F1EFE8", color: "#5F5E5A" }}>
                        {tenant.access_enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-10" style={{ color: "#9CA3AF" }}>
                <Users size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tenants in this building yet</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── FLAT HISTORY TAB ── */}
      {tab === "history" && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#F5F7FB", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
            <Clock size={14} style={{ color: "#1B4FBB" }} />
            <span className="text-sm font-semibold" style={{ color: "#111827" }}>Per-flat tenant &amp; rent history</span>
          </div>
          <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2"
            style={{ gridTemplateColumns: "0.6fr 1.4fr 0.9fr 0.9fr 0.8fr", background: "#FAFBFF", color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.08)" }}>
            <div>Flat</div><div>Tenant</div><div>From</div><div>To</div><div>Rent</div>
          </div>
          {buildingHistory.map((h, i) => (
            <div key={i} className="grid px-4 py-3 items-center text-sm"
              style={{ gridTemplateColumns: "0.6fr 1.4fr 0.9fr 0.9fr 0.8fr", borderTop: i===0?"none":"1px solid rgba(27,79,187,0.07)", background: h.to === "Present" ? "#F5FBF8" : "#fff" }}>
              <div className="text-xs font-medium" style={{ color: "#111827" }}>{h.flatNo}</div>
              <div className="text-xs font-medium" style={{ color: "#111827" }}>{h.tenantName}</div>
              <div className="text-xs" style={{ color: "#6B7280" }}>{h.from}</div>
              <div className="text-xs" style={{ color: h.to === "Present" ? "#0F6E56" : "#6B7280", fontWeight: h.to === "Present" ? 600 : 400 }}>{h.to}</div>
              <div className="text-xs font-semibold" style={{ color: "#111827" }}>₹{h.rent.toLocaleString("en-IN")}</div>
            </div>
          ))}
          <div className="px-4 py-2.5 text-xs" style={{ color: "#9CA3AF", background: "#FAFBFF" }}>
            Showing sample history — connect this to past tenant records as they vacate to build a real per-flat timeline.
          </div>
        </div>
      )}

      {/* ── EDIT INFO TAB — now saves to Supabase ── */}
      {tab === "edit" && (
        <div className="rounded-xl p-5" style={{ background: "#fff", border: "2px solid #1B4FBB" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Building information</h2>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", cursor: "pointer" }}>
                <Pencil size={12} /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={saveInfo}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                  <Save size={12} /> Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)", cursor: "pointer" }}>
                  <X size={12} /> Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Building name</label>
              <input value={property.name} disabled
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.15)", color: "#9CA3AF", background: "#F5F7FB" }} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Address</label>
              <input value={address} disabled={!editing} onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: editing ? "#fff" : "#F5F7FB" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Total flats</label>
              <input type="number" value={totalFlats} disabled={!editing} onChange={(e) => setTotalFlats(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: editing ? "#fff" : "#F5F7FB" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Monthly collection</label>
              <input type="number" value={monthlyCollection} disabled={!editing} onChange={(e) => setMonthlyCollection(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: editing ? "#fff" : "#F5F7FB" }} />
            </div>
          </div>

          {saved && <p className="text-xs mt-3" style={{ color: "#0F6E56" }}>{saved}</p>}
          {saveError && <p className="text-xs mt-3" style={{ color: "#A32D2D" }}>Couldn't save: {saveError}</p>}
          {!editing && !saved && (
            <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
              Click Edit to update the building's address or flat count. Changes save to the database.
            </p>
          )}
        </div>
      )}

      {/* ── NOTES TAB — now a real list of dated notes per building ── */}
      {tab === "notes" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <StickyNote size={14} style={{ color: "#1B4FBB" }} />
            <span className="text-sm font-semibold" style={{ color: "#111827" }}>Notes — {property.name}</span>
          </div>

          {/* Add a new note */}
          <div className="rounded-xl p-4 mb-4" style={{ border: "1.5px solid rgba(27,79,187,0.18)", background: "#F5F7FB" }}>
            <textarea
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Add a note about maintenance, vendors, an issue..."
              className="w-full px-3 py-2 text-sm rounded-lg resize-y min-h-20"
              style={{ border: "1.5px solid rgba(27,79,187,0.15)", outline: "none", color: "#111827", background: "#fff", lineHeight: 1.6 }} />
            <button onClick={addNote} disabled={!newNoteText.trim()}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium mt-2"
              style={{
                background: newNoteText.trim() ? "#1B4FBB" : "#D1D5DB",
                color: "#fff", border: "none",
                cursor: newNoteText.trim() ? "pointer" : "not-allowed",
              }}>
              <Plus size={14} /> Add note
            </button>
          </div>

          {notesError && <p className="text-xs mb-3" style={{ color: "#A32D2D" }}>{notesError}</p>}

          {/* List of existing notes, newest first */}
          {notesList.length === 0 ? (
            <div className="rounded-xl p-8 text-center" style={{ border: "1px solid rgba(27,79,187,0.12)", color: "#9CA3AF" }}>
              <StickyNote size={20} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes yet — add one above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notesList.map((note) => (
                <div key={note.id} className="rounded-xl p-4" style={{ border: "1px solid rgba(27,79,187,0.12)", background: "#fff" }}>
                  {editingNoteId === note.id ? (
                    <>
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-lg resize-y min-h-20"
                        style={{ border: "1.5px solid #1B4FBB", outline: "none", color: "#111827", lineHeight: 1.6 }}
                        autoFocus />
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveEditNote} disabled={!editNoteText.trim()}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{
                            background: editNoteText.trim() ? "#1B4FBB" : "#D1D5DB",
                            color: "#fff", border: "none",
                            cursor: editNoteText.trim() ? "pointer" : "not-allowed",
                          }}>
                          <Save size={11} /> Save
                        </button>
                        <button onClick={cancelEditNote}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                          style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)", cursor: "pointer" }}>
                          <X size={11} /> Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap" style={{ color: "#111827", lineHeight: 1.6 }}>{note.content}</p>
                        <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
                          {new Date(note.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => startEditNote(note)}
                          className="w-7 h-7 rounded flex items-center justify-center"
                          style={{ background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background="#F3F4F6"; e.currentTarget.style.color="#374151"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9CA3AF"; }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteNote(note)}
                          className="w-7 h-7 rounded flex items-center justify-center"
                          style={{ background: "transparent", border: "none", color: "#D1D5DB", cursor: "pointer" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background="#FCEBEB"; e.currentTarget.style.color="#A32D2D"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#D1D5DB"; }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EXPENDITURE TAB — still local for now, migrates in a later stage ── */}
      {tab === "expenditure" && (
        <div>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl mb-5"
            style={{ background: "#EFF8F1", border: "1.5px solid #B5DFC5" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#1D6F42" }}>
                <span className="font-bold text-white text-sm" style={{ fontFamily: "serif", letterSpacing: "-1px" }}>XL</span>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>Open in Microsoft Excel Online</p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Sign in with your Microsoft account to edit this data in Excel</p>
              </div>
            </div>
            <button
              onClick={() => window.open("https://www.office.com/launch/excel", "_blank", "noopener,noreferrer")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold flex-shrink-0"
              style={{ background: "#1D6F42", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="0" y="0" width="6.5" height="6.5" fill="#F25022"/>
                <rect x="7.5" y="0" width="6.5" height="6.5" fill="#7FBA00"/>
                <rect x="0" y="7.5" width="6.5" height="6.5" fill="#00A4EF"/>
                <rect x="7.5" y="7.5" width="6.5" height="6.5" fill="#FFB900"/>
              </svg>
              Sign in with Microsoft
            </button>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Custom expenditure — {property.name}</h2>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Add any building-specific cost: water tanks, borewells, lift AMC, etc.</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button onClick={() => setShowExportMenu((s) => !s)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
                  style={{ background: "#F0C040", color: "#1339A0", border: "none", cursor: "pointer" }}>
                  <Download size={14} /> Export <ChevronDown size={13} />
                </button>
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 mt-1 rounded-lg overflow-hidden z-20"
                      style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 180 }}>
                      <button onClick={downloadPDF}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left"
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#111827" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#F5F7FB"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <FileText size={14} style={{ color: "#1B4FBB" }} /> Download as PDF
                      </button>
                      <button onClick={downloadExcel}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left"
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: "#111827", borderTop: "1px solid rgba(27,79,187,0.08)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#F5F7FB"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <FileSpreadsheet size={14} style={{ color: "#1F7244" }} /> Download as Excel
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button onClick={addExpRow}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
                style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                <Plus size={14} /> Add item
              </button>
            </div>
          </div>

          <div style={{ border: "1.5px solid rgba(27,79,187,0.18)", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
            <div className="grid text-xs font-semibold uppercase tracking-wide px-3 py-2.5"
              style={{ gridTemplateColumns: "0.9fr 2fr 1fr 40px", background: "#F5F7FB", color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
              <div>Date</div><div>Item</div><div style={{ textAlign: "right" }}>Amount (₹)</div><div></div>
            </div>
            {expRows.length === 0 ? (
              <div className="text-center py-8" style={{ color: "#9CA3AF" }}>
                <FileSpreadsheet size={20} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No custom expenses yet — click "Add item"</p>
              </div>
            ) : expRows.map((row, i) => (
              <div key={row.id} className="grid px-3 py-1.5 items-center"
                style={{ gridTemplateColumns: "0.9fr 2fr 1fr 40px", borderTop: i===0?"none":"1px solid rgba(27,79,187,0.07)", background: "#fff" }}>
                <input type="date" value={row.date} onChange={(e) => updateExpRow(row.id, "date", e.target.value)}
                  className="w-full text-xs px-1.5 py-1 rounded" style={{ border: "1px solid transparent", color: "#111827", background: "transparent" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#1B4FBB"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "transparent"} />
                <input value={row.item} onChange={(e) => updateExpRow(row.id, "item", e.target.value)}
                  placeholder="e.g. Water tank refill, Borewell repair..." className="w-full text-xs px-1.5 py-1 rounded"
                  style={{ border: "1px solid transparent", color: "#111827", background: "transparent" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#1B4FBB"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "transparent"} />
                <input type="number" value={row.amount} onChange={(e) => updateExpRow(row.id, "amount", +e.target.value)}
                  className="w-full text-xs px-1.5 py-1 rounded text-right font-medium"
                  style={{ border: "1px solid transparent", color: "#111827", background: "transparent" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#1B4FBB"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "transparent"} />
                <div className="flex justify-center">
                  <button onClick={() => deleteExpRow(row.id)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: "transparent", border: "none", color: "#D1D5DB", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background="#FCEBEB"; e.currentTarget.style.color="#A32D2D"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#D1D5DB"; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs" style={{ color: "#9CA3AF" }}>
            <span>Click any cell to edit · saved to the database automatically</span>
            <span>Total: <span className="font-semibold" style={{ color: "#A32D2D" }}>₹{expTotal.toLocaleString("en-IN")}</span></span>
          </div>
          {expError && <p className="text-xs mt-2" style={{ color: "#A32D2D" }}>Couldn't save: {expError}</p>}
        </div>
      )}

      {/* ── ADD TENANT MODAL — pre-filled with this building ── */}
      {showAddTenantModal && property && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ background: "rgba(17,24,39,0.5)" }}>
          <div className="rounded-xl p-6 w-full max-w-lg my-8" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>Add tenant — {property.name}</h2>
              <button onClick={() => setShowAddTenantModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-medium mb-2" style={{ color: "#6B7280" }}>Primary tenant</p>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Full name</label>
                  <input value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" placeholder="e.g. Anjali Desai"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Age</label>
                  <input type="number" value={newTenant.age} onChange={(e) => setNewTenant({ ...newTenant, age: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" placeholder="28"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Building</label>
                  <input value={property.name} disabled
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#9CA3AF", background: "#F9FAFB" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Flat no.</label>
                  <input value={newTenant.flatNo} onChange={(e) => setNewTenant({ ...newTenant, flatNo: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" placeholder="e.g. 304"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Phone</label>
                  <input value={newTenant.phone} onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" placeholder="9876543210"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Email</label>
                  <input value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" placeholder="name@example.com"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Aadhar number</label>
                  <input value={newTenant.aadhar} onChange={(e) => setNewTenant({ ...newTenant, aadhar: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg font-mono" placeholder="XXXX XXXX XXXX"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Monthly rent (₹)</label>
                  <input type="number" value={newTenant.rent} onChange={(e) => setNewTenant({ ...newTenant, rent: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                Other occupants in this flat {newCoTenants.length > 0 && `(${1 + newCoTenants.length} total)`}
              </p>
            </div>
            {newCoTenants.map((co) => (
              <CoTenantCardProp key={co.id} co={co}
                onUpdate={(f, v) => updateNewCoTenant(co.id, f, v)}
                onRemove={() => removeNewCoTenant(co.id)} />
            ))}
            <button onClick={addNewCoTenant}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium mb-4"
              style={{ background: "#F3F4F6", color: "#111827", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <UserPlus size={12} /> Add another tenant
            </button>

            {addTenantError && <p className="text-xs mb-3" style={{ color: "#A32D2D" }}>{addTenantError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setShowAddTenantModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitNewTenant}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                Add tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
