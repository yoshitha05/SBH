"use client";

// app/admin/tenants/page.tsx
//
// STAGE 2 of Supabase migration for Tenants: co-tenants are now fully
// wired in — the Active tenants table shows real occupant counts, and
// both the Add and Edit modals read/write the real co_tenants table.
//
// STILL DEFERRED:
//   - paymentStatus / googleFormStatus: not yet columns in Supabase,
//     approximated from `status`/`approved` for display purposes only.

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Users, CheckCircle, Clock, Download, Search, ShieldCheck, UserX,
  ExternalLink, Plus, Pencil, X, Save, Eye, EyeOff, UserPlus, Loader2, AlertTriangle,
} from "lucide-react";

const GOOGLE_FORM_URL = "https://forms.gle/your-google-form-link";
const BUILDINGS = ["Ohm", "NN Elite", "RVB", "Renuka", "Pearls", "Sree Harsha"];

const payStyle: Record<string, { bg: string; text: string }> = {
  Paid:               { bg: "#E1F5EE", text: "#085041" },
  Partial:            { bg: "#FAEEDA", text: "#633806" },
  Overdue:            { bg: "#FCEBEB", text: "#791F1F" },
  Unpaid:             { bg: "#FCEBEB", text: "#791F1F" },
  "Pending approval":{ bg: "#E6F1FB", text: "#0C447C" },
};

type CoTenant = {
  id: number | string;
  name: string; age: string; phone: string; email: string; aadhar: string;
  isNew?: boolean;
};

let _newCoId = 1;
function blankCoTenant(): CoTenant {
  return { id: `new${_newCoId++}`, name: "", age: "", phone: "", email: "", aadhar: "", isNew: true };
}

type SupabaseTenant = {
  id: number;
  name: string;
  phone: string;
  email: string;
  building: string;
  flat_no: string;
  rent: number;
  status: string;
  risk: string;
  approved: boolean;
  access_enabled: boolean;
  age: number | null;
  aadhar: string | null;
  move_in_date: string | null;
  lease_end: string | null;
  paymentStatus?: string;
  googleFormStatus?: string;
  coTenants?: CoTenant[];
};

const EMPTY_FORM = {
  name: "", building: BUILDINGS[0], flatNo: "", rent: 0, phone: "", email: "",
  age: "", aadhar: "",
};

function maskAadhar(aadhar?: string | null) {
  if (!aadhar) return "—";
  const digits = aadhar.replace(/\s/g, "");
  if (digits.length < 4) return "••••";
  return `•••• •••• ${digits.slice(-4)}`;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<SupabaseTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [revealedAadhar, setRevealedAadhar] = useState<Set<number>>(new Set());

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState(EMPTY_FORM);
  const [newCoTenants, setNewCoTenants] = useState<CoTenant[]>([]);
  const [addError, setAddError] = useState("");

  const [editingTenant, setEditingTenant] = useState<SupabaseTenant | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editFormStatus, setEditFormStatus] = useState("Paid");
  const [editCoTenants, setEditCoTenants] = useState<CoTenant[]>([]);
  const [editOriginalCoTenants, setEditOriginalCoTenants] = useState<CoTenant[]>([]);
  const [editError, setEditError] = useState("");

  async function loadTenants() {
    setLoading(true);
    setLoadError("");

    const { data: tenantRows, error } = await supabase
      .from("tenants")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }

    const { data: coTenantRows } = await supabase.from("co_tenants").select("*");
    const coTenantsByTenant = new Map<number, CoTenant[]>();
    (coTenantRows ?? []).forEach((c) => {
      const list = coTenantsByTenant.get(c.tenant_id) ?? [];
      list.push({
        id: c.id, name: c.name ?? "", age: c.age ? String(c.age) : "",
        phone: c.phone ?? "", email: c.email ?? "", aadhar: c.aadhar ?? "",
      });
      coTenantsByTenant.set(c.tenant_id, list);
    });

    setTenants(
      (tenantRows ?? []).map((t) => ({
        ...t,
        paymentStatus: t.status === "occupied" ? "Paid" : "Pending approval",
        googleFormStatus: t.approved ? "Synced" : "Waiting for owner approval",
        coTenants: coTenantsByTenant.get(t.id) ?? [],
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const activeTenants = tenants.filter((t) => t.approved && t.access_enabled);
  const newTenantsList = tenants.filter((t) => !t.approved);

  const filteredActive = activeTenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.building.toLowerCase().includes(search.toLowerCase()) ||
    t.flat_no.toLowerCase().includes(search.toLowerCase())
  );
  const filteredNew = newTenantsList.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.building.toLowerCase().includes(search.toLowerCase())
  );

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Tenant Directory", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString("en-IN")} · ${activeTenants.length} active tenants`, 14, 22);

    const body: any[] = [];
    activeTenants.forEach((t) => {
      const occupants = 1 + (t.coTenants?.length ?? 0);
      body.push([
        t.name,
        `${t.building} · ${t.flat_no}`,
        t.age ?? "—",
        t.phone,
        t.aadhar ? `•••• •••• ${t.aadhar.replace(/\s/g, "").slice(-4)}` : "—",
        String(occupants),
        `₹${t.rent.toLocaleString("en-IN")}`,
        t.paymentStatus,
      ]);
      (t.coTenants ?? []).forEach((co) => {
        body.push([
          `   ↳ ${co.name || "(unnamed)"}`,
          "", co.age || "—", co.phone || "—",
          co.aadhar ? `•••• •••• ${co.aadhar.replace(/\s/g, "").slice(-4)}` : "—",
          "", "", "",
        ]);
      });
    });

    autoTable(doc, {
      startY: 28,
      head: [["Tenant", "Building / Flat", "Age", "Phone", "Aadhar", "Occ.", "Rent", "Status"]],
      body,
      headStyles: { fillColor: [55, 65, 81] },
      styles: { fontSize: 8 },
      didParseCell: (data) => {
        if (typeof data.cell.raw === "string" && data.cell.raw.startsWith("   ↳")) {
          data.cell.styles.fontStyle = "italic";
          data.cell.styles.textColor = [107, 114, 128];
        }
      },
    });

    doc.save(`Tenant_Directory_${new Date().toISOString().split("T")[0]}.pdf`);
  }

  function toggleAadhar(id: number) {
    setRevealedAadhar((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function openAddModal() {
    setNewTenant(EMPTY_FORM);
    setNewCoTenants([]);
    setAddError("");
    setShowAddModal(true);
  }
  function addNewCoTenant() {
    setNewCoTenants((prev) => [...prev, blankCoTenant()]);
  }
  function updateNewCoTenant(id: number | string, field: keyof Omit<CoTenant, "id" | "isNew">, val: string) {
    setNewCoTenants((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeNewCoTenant(id: number | string) {
    setNewCoTenants((prev) => prev.filter((c) => c.id !== id));
  }
  async function submitNewTenant() {
    if (!newTenant.name.trim() || !newTenant.flatNo.trim()) {
      setAddError("Please enter at least a name and flat number.");
      return;
    }
    setAddError("");

    const { data: inserted, error } = await supabase
      .from("tenants")
      .insert({
        name: newTenant.name.trim(),
        building: newTenant.building,
        flat_no: newTenant.flatNo.trim(),
        rent: newTenant.rent,
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
      setAddError(error.message);
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
        setAddError(`Tenant added, but co-tenants failed to save: ${coError.message}`);
        await loadTenants();
        return;
      }
    }

    setShowAddModal(false);
    await loadTenants();
  }

  function openEditModal(t: SupabaseTenant) {
    setEditingTenant(t);
    setEditForm({
      name: t.name, building: t.building, flatNo: t.flat_no, rent: t.rent,
      phone: t.phone, email: t.email ?? "",
      age: t.age ? String(t.age) : "", aadhar: t.aadhar ?? "",
    });
    setEditFormStatus(t.paymentStatus ?? "Paid");
    const existing = t.coTenants ? t.coTenants.map((c) => ({ ...c })) : [];
    setEditCoTenants(existing);
    setEditOriginalCoTenants(existing);
    setEditError("");
  }
  function addEditCoTenant() {
    setEditCoTenants((prev) => [...prev, blankCoTenant()]);
  }
  function updateEditCoTenant(id: number | string, field: keyof Omit<CoTenant, "id" | "isNew">, val: string) {
    setEditCoTenants((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeEditCoTenant(id: number | string) {
    setEditCoTenants((prev) => prev.filter((c) => c.id !== id));
  }
  async function submitEdit() {
    if (!editingTenant) return;
    setEditError("");

    const { error } = await supabase
      .from("tenants")
      .update({
        name: editForm.name,
        building: editForm.building,
        flat_no: editForm.flatNo,
        rent: Number(editForm.rent),
        phone: editForm.phone,
        email: editForm.email,
        age: editForm.age ? Number(editForm.age) : null,
        aadhar: editForm.aadhar.trim() || null,
      })
      .eq("id", editingTenant.id);

    if (error) {
      setEditError(error.message);
      return;
    }

    const originalIds = new Set(editOriginalCoTenants.map((c) => c.id));
    const editedIds = new Set(editCoTenants.filter((c) => !c.isNew).map((c) => c.id));
    const deletedIds = [...originalIds].filter((id) => !editedIds.has(id));

    for (const delId of deletedIds) {
      const { error: delErr } = await supabase.from("co_tenants").delete().eq("id", delId);
      if (delErr) { setEditError(`Couldn't update co-tenants: ${delErr.message}`); return; }
    }

    for (const co of editCoTenants) {
      const payload = {
        tenant_id: editingTenant.id,
        name: co.name,
        age: co.age ? Number(co.age) : null,
        phone: co.phone,
        email: co.email,
        aadhar: co.aadhar.trim() || null,
      };
      if (co.isNew) {
        const { error: insErr } = await supabase.from("co_tenants").insert(payload);
        if (insErr) { setEditError(`Couldn't save co-tenants: ${insErr.message}`); return; }
      } else {
        const { error: updErr } = await supabase.from("co_tenants").update(payload).eq("id", co.id);
        if (updErr) { setEditError(`Couldn't save co-tenants: ${updErr.message}`); return; }
      }
    }

    setEditingTenant(null);
    await loadTenants();
  }

  function CoTenantCard({ co, onUpdate, onRemove }: {
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

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading tenants from database...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load tenants from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Tenants</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {activeTenants.length} active · {newTenantsList.length} pending approval
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddModal}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
            style={{ background: "#111827", color: "#fff", border: "none", cursor: "pointer" }}>
            <Plus size={14} /> Add tenant
          </button>
          <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
            style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", textDecoration: "none" }}>
            <ExternalLink size={14} /> Google Form
          </a>
          <button onClick={downloadPDF}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
            style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", cursor: "pointer" }}>
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Users size={13} /> Total tenants</div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{tenants.length}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><CheckCircle size={13} /> Active</div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{activeTenants.length}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Clock size={13} /> Pending approval</div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{newTenantsList.length}</div>
        </div>
      </div>

      <div className="relative mb-5 w-full md:w-80">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
        <input type="text" placeholder="Search name, building, flat..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg"
          style={{ border: "1px solid #E5E7EB", outline: "none", color: "#111827", background: "#fff" }} />
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={15} style={{ color: "#374151" }} />
          <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Active tenants</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
            {filteredActive.length}
          </span>
        </div>
        <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "auto" }}>
          <div className="grid text-xs font-semibold uppercase tracking-wide px-3 py-2 min-w-[920px]"
            style={{ gridTemplateColumns: "1.2fr 0.5fr 0.6fr 1.1fr 0.6fr 1.2fr 0.7fr 0.9fr 40px", background: "#F9FAFB", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>
            <div>Tenant</div><div>Flat</div><div>Age</div><div>Contact</div><div>Occ.</div><div>Aadhar</div><div>Rent</div><div>Status</div><div></div>
          </div>
          {filteredActive.length === 0 ? (
            <div className="text-center py-8" style={{ color: "#9CA3AF" }}>
              <p className="text-sm">No active tenants found</p>
            </div>
          ) : filteredActive.map((t, i) => {
            const ps = payStyle[t.paymentStatus ?? "Paid"] ?? { bg: "#F3F4F6", text: "#374151" };
            const revealed = revealedAadhar.has(t.id);
            const occupants = 1 + (t.coTenants?.length ?? 0);
            return (
              <div key={t.id} className="grid px-3 py-2.5 items-center text-sm min-w-[920px]"
                style={{ gridTemplateColumns: "1.2fr 0.5fr 0.6fr 1.1fr 0.6fr 1.2fr 0.7fr 0.9fr 40px", borderTop: i===0?"none":"1px solid #F3F4F6", background: "#fff" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#111827" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{t.building}</p>
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{t.flat_no}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{t.age ?? "—"}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>
                  <div>{t.phone}</div>
                  <div className="truncate" style={{ color: "#9CA3AF" }}>{t.email ?? ""}</div>
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>
                  {occupants}
                  {t.coTenants && t.coTenants.length > 0 && (
                    <span className="ml-1" style={{ color: "#9CA3AF" }} title={t.coTenants.map(c => c.name).join(", ")}>
                      (+{t.coTenants.length})
                    </span>
                  )}
                </div>
                <div className="text-xs flex items-center gap-1.5" style={{ color: "#6B7280" }}>
                  <span className="font-mono">{revealed ? (t.aadhar || "—") : maskAadhar(t.aadhar)}</span>
                  {t.aadhar && (
                    <button onClick={() => toggleAadhar(t.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}>
                      {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  )}
                </div>
                <div className="text-xs font-medium" style={{ color: "#111827" }}>₹{t.rent.toLocaleString("en-IN")}</div>
                <div>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: ps.bg, color: ps.text }}>
                    {t.paymentStatus}
                  </span>
                </div>
                <button onClick={() => openEditModal(t)}
                  className="w-7 h-7 rounded flex items-center justify-center"
                  style={{ background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background="#F3F4F6"; e.currentTarget.style.color="#374151"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9CA3AF"; }}>
                  <Pencil size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={15} style={{ color: "#6B7280" }} />
          <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>New tenants (Google Form)</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
            {filteredNew.length} pending
          </span>
        </div>

        {filteredNew.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "1px solid #E5E7EB", color: "#9CA3AF" }}>
            <ShieldCheck size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending approvals</p>
            <p className="text-xs mt-1">New tenants from Google Form appear here</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {filteredNew.map((t) => (
              <div key={t.id} className="rounded-xl p-4" style={{ border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                      style={{ background: "#F3F4F6", color: "#374151" }}>
                      {t.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#111827" }}>{t.name}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{t.building} · Flat {t.flat_no}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}>
                    ⏳ Pending
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-xs">
                  <div><span style={{ color: "#9CA3AF" }}>Email: </span><span style={{ color: "#111827" }}>{t.email}</span></div>
                  <div><span style={{ color: "#9CA3AF" }}>Phone: </span><span style={{ color: "#111827" }}>{t.phone}</span></div>
                  <div><span style={{ color: "#9CA3AF" }}>Move-in: </span><span style={{ color: "#111827" }}>{t.move_in_date ?? "—"}</span></div>
                  <div className="col-span-2"><span style={{ color: "#9CA3AF" }}>Status: </span><span style={{ color: "#111827" }}>{t.googleFormStatus}</span></div>
                </div>
                <div className="flex gap-2">
                  <Link href="/admin/approvals"
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "#F3F4F6", color: "#111827", border: "1px solid #E5E7EB", textDecoration: "none" }}>
                    <CheckCircle size={11} /> Approve
                  </Link>
                  <Link href="/admin/approvals"
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
                    style={{ background: "#fff", color: "#6B7280", border: "1px solid #E5E7EB", textDecoration: "none" }}>
                    <UserX size={11} /> Deny
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 p-3 rounded-lg text-xs" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151", lineHeight: 1.7 }}>
          <p className="font-medium mb-1" style={{ color: "#111827" }}>How new tenants appear here</p>
          <p>When a new tenant fills the Google Form, their details appear above. Review and approve to grant them login access — or use "Add tenant" to add someone directly.</p>
          <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 mt-1.5 font-medium"
            style={{ color: "#111827", textDecoration: "none" }}>
            <ExternalLink size={11} /> Open Google Form ↗
          </a>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ background: "rgba(17,24,39,0.5)" }}>
          <div className="rounded-xl p-6 w-full max-w-lg my-8" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>Add tenant</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
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
                  <select value={newTenant.building} onChange={(e) => setNewTenant({ ...newTenant, building: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1px solid #E5E7EB", color: "#111827" }}>
                    {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
                  </select>
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
                  <input type="number" value={newTenant.rent} onChange={(e) => setNewTenant({ ...newTenant, rent: +e.target.value || 0 })}
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
              <CoTenantCard key={co.id} co={co}
                onUpdate={(f, v) => updateNewCoTenant(co.id, f, v)}
                onRemove={() => removeNewCoTenant(co.id)} />
            ))}
            <button onClick={addNewCoTenant}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium mb-4"
              style={{ background: "#F3F4F6", color: "#111827", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <UserPlus size={12} /> Add another tenant
            </button>

            {addError && <p className="text-xs mb-3" style={{ color: "#A32D2D" }}>{addError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitNewTenant}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#111827", color: "#fff", border: "none", cursor: "pointer" }}>
                Add tenant
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTenant && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ background: "rgba(17,24,39,0.5)" }}>
          <div className="rounded-xl p-6 w-full max-w-lg my-8" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>Edit tenant</h2>
              <button onClick={() => setEditingTenant(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={18} />
              </button>
            </div>

            <p className="text-xs font-medium mb-2" style={{ color: "#6B7280" }}>Primary tenant</p>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Full name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Age</label>
                  <input type="number" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Building</label>
                  <select value={editForm.building} onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1px solid #E5E7EB", color: "#111827" }}>
                    {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Flat no.</label>
                  <input value={editForm.flatNo} onChange={(e) => setEditForm({ ...editForm, flatNo: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Phone</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Email</label>
                  <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Aadhar number</label>
                  <input value={editForm.aadhar} onChange={(e) => setEditForm({ ...editForm, aadhar: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg font-mono" placeholder="XXXX XXXX XXXX"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Rent (₹)</label>
                  <input type="number" value={editForm.rent} onChange={(e) => setEditForm({ ...editForm, rent: +e.target.value || 0 })}
                    className="w-full px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Payment status</label>
                <select value={editFormStatus} onChange={(e) => setEditFormStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1px solid #E5E7EB", color: "#111827" }}>
                  <option>Paid</option><option>Partial</option><option>Unpaid</option><option>Overdue</option>
                </select>
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                  Note: payment status isn't saved to the database yet — this comes with the payment_history migration.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
                Other occupants in this flat {editCoTenants.length > 0 && `(${1 + editCoTenants.length} total)`}
              </p>
            </div>
            {editCoTenants.map((co) => (
              <CoTenantCard key={co.id} co={co}
                onUpdate={(f, v) => updateEditCoTenant(co.id, f, v)}
                onRemove={() => removeEditCoTenant(co.id)} />
            ))}
            <button onClick={addEditCoTenant}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium mb-4"
              style={{ background: "#F3F4F6", color: "#111827", border: "1px solid #E5E7EB", cursor: "pointer" }}>
              <UserPlus size={12} /> Add another tenant
            </button>

            {editError && <p className="text-xs mb-3" style={{ color: "#A32D2D" }}>{editError}</p>}

            <div className="flex gap-3">
              <button onClick={() => setEditingTenant(null)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitEdit}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#111827", color: "#fff", border: "none", cursor: "pointer" }}>
                <Save size={14} /> Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
