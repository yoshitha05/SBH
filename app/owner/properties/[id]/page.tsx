"use client";

// app/owner/properties/[id]/page.tsx

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { properties } from "@/data/properties";
import { tenants } from "@/data/tenants";
import Link from "next/link";
import {
  Building2, Home, Users, TrendingUp, ArrowLeft, Phone,
  CheckCircle, AlertTriangle, Pencil, Save, X, StickyNote,
  Plus, Trash2, FileSpreadsheet, Clock, Download, FileText, ChevronDown,
} from "lucide-react";

const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
  paid:    { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB" },
  overdue: { bg: "#FCEBEB", text: "#791F1F", border: "#E24B4A" },
  partial: { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
  pending: { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" },
};

type ExpRow = { id: string; date: string; item: string; amount: number };
type HistoryEntry = { flatNo: string; tenantName: string; from: string; to: string; rent: number };

// ── Simulated per-flat tenant history (in real app this would come from a DB) ──
const SAMPLE_HISTORY: HistoryEntry[] = [
  { flatNo: "101", tenantName: "Ravi Kumar",   from: "Jan 2023", to: "Present", rent: 18000 },
  { flatNo: "102", tenantName: "Meena Iyer",   from: "Mar 2022", to: "Dec 2022", rent: 16000 },
  { flatNo: "102", tenantName: "Arjun Mehta",  from: "Jan 2023", to: "Present", rent: 17500 },
  { flatNo: "201", tenantName: "Divya Rao",    from: "Jun 2021", to: "May 2024", rent: 15000 },
  { flatNo: "201", tenantName: "Sanjay Gupta", from: "Jun 2024", to: "Present", rent: 19000 },
];

let _expId = 100;

export default function OwnerBuildingPage() {
  const params = useParams();
  const id = params.id as string;

  const property =
    properties.find((p) => p.id === id) ??
    properties.find((p) => p.name.toLowerCase() === decodeURIComponent(id).toLowerCase());

  const [tab, setTab] = useState<"overview" | "edit" | "notes" | "expenditure" | "history">("overview");

  // ── Edit building info state ──
  const [editing, setEditing]   = useState(false);
  const [address, setAddress]   = useState(property?.address ?? "");
  const [totalFlats, setTotalFlats] = useState(property?.totalFlats ?? 0);
  const [saved, setSaved]       = useState("");

  // ── Building notes state ──
  const [notes, setNotes] = useState(
    `${property?.name ?? "Building"} notes:\n• Add maintenance logs, vendor contacts, or issues here.`
  );
  const [notesSaved, setNotesSaved] = useState("");

  // ── Custom expenditure state (per-building, user-defined line items) ──
  const [expRows, setExpRows] = useState<ExpRow[]>([
    { id: "x1", date: new Date().toISOString().split("T")[0], item: "Water tank refill", amount: 1200 },
    { id: "x2", date: new Date().toISOString().split("T")[0], item: "Borewell maintenance", amount: 3500 },
  ]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!property) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Building2 size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Building not found</p>
        <Link href="/owner/properties" className="text-xs mt-2 inline-block" style={{ color: "#1B4FBB" }}>
          ← Back to Properties
        </Link>
      </div>
    );
  }

  const occupied = property.flats.filter((f) => f.status !== "vacant").length;
  const vacant   = property.flats.filter((f) => f.status === "vacant").length;
  const overdue  = property.flats.filter((f) => f.status === "overdue").length;
  const buildingTenants = tenants.filter((t) => t.building === property.name);
  const buildingHistory = SAMPLE_HISTORY; // in real app, filter by property.id

  const expTotal = useMemo(() => expRows.reduce((s, r) => s + r.amount, 0), [expRows]);

  function saveInfo() {
    setSaved(`Saved at ${new Date().toLocaleTimeString()}`);
    setEditing(false);
    setTimeout(() => setSaved(""), 3000);
  }

  function saveNotes() {
    setNotesSaved(`Saved at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setNotesSaved(""), 3000);
  }

  function addExpRow() {
    const today = new Date().toISOString().split("T")[0];
    setExpRows((prev) => [{ id: `x${_expId++}`, date: today, item: "", amount: 0 }, ...prev]);
  }
  function updateExpRow(rid: string, field: keyof ExpRow, val: string | number) {
    setExpRows((prev) => prev.map((r) => r.id === rid ? { ...r, [field]: val } : r));
  }
  function deleteExpRow(rid: string) {
    if (confirm("Delete this expense entry?")) setExpRows((prev) => prev.filter((r) => r.id !== rid));
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

    const fileName = `${property?.name ?? "Building"}_Expenditure_${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setShowExportMenu(false);
  }

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${property?.name ?? "Building"} — Expenditure Report`, 14, 16);
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

    const fileName = `${property?.name ?? "Building"}_Expenditure_${new Date().toISOString().split("T")[0]}.pdf`;
    doc.save(fileName);
    setShowExportMenu(false);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-5" style={{ color: "#6B7280" }}>
        <Link href="/owner/properties" className="flex items-center gap-1 hover:underline" style={{ color: "#1B4FBB" }}>
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
          {occupied} / {property.totalFlats} occupied
        </span>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Home size={13} /> Total flats</div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{property.totalFlats}</div>
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
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>₹{property.monthlyCollection.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Overdue alert */}
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
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#E8F0FE", color: "#1B4FBB" }}>
                {buildingTenants.length} tenants
              </span>
            </div>

            <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2"
              style={{ gridTemplateColumns: "1.5fr 0.6fr 1fr 0.8fr 0.8fr 0.8fr", background: "#FAFBFF", color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.08)" }}>
              <div>Tenant</div><div>Flat</div><div>Rent</div><div>Status</div><div>Approval</div><div>Access</div>
            </div>

            {buildingTenants.length > 0 ? (
              buildingTenants.map((tenant, i) => {
                const ss = statusStyles[
                  tenant.paymentStatus?.toLowerCase() === "paid" ? "paid"
                  : tenant.paymentStatus?.toLowerCase() === "overdue" ? "overdue"
                  : tenant.paymentStatus?.toLowerCase() === "partial" ? "partial"
                  : "pending"
                ] ?? statusStyles.pending;

                return (
                  <div key={tenant.id} className="grid px-4 py-3 items-center text-sm hover:bg-blue-50 transition"
                    style={{ gridTemplateColumns: "1.5fr 0.6fr 1fr 0.8fr 0.8fr 0.8fr", borderTop: i===0?"none":"1px solid rgba(27,79,187,0.07)", background: "#fff" }}>
                    <div>
                      <Link href={`/owner/tenant/${tenant.id}`} className="text-xs font-semibold hover:underline" style={{ color: "#1B4FBB" }}>
                        {tenant.name}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: "#9CA3AF" }}>
                          <Phone size={10} className="inline mr-0.5" />{tenant.phone}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs font-medium" style={{ color: "#111827" }}>{tenant.flatNo}</div>
                    <div className="text-xs font-semibold" style={{ color: "#111827" }}>₹{tenant.rent.toLocaleString("en-IN")}/mo</div>
                    <div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>
                        {tenant.paymentStatus}
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
                        style={tenant.accessEnabled ? { background: "#E6F1FB", color: "#0C447C" } : { background: "#F1EFE8", color: "#5F5E5A" }}>
                        {tenant.accessEnabled ? "Enabled" : "Disabled"}
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

          {/* All flat numbers grid — occupied + vacant, so admin sees every flat no. at a glance */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "#111827" }}>All flats</p>
            <div className="flex flex-wrap gap-2">
              {property.flats.map((f) => (
                <span key={f.flatNo}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={
                    f.status === "vacant"
                      ? { background: "#F1EFE8", color: "#5F5E5A", border: "1px solid #D3D1C7" }
                      : f.status === "overdue"
                      ? { background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1" }
                      : { background: "#E1F5EE", color: "#085041", border: "1px solid #9FE1CB" }
                  }>
                  {f.flatNo} {f.tenantName ? `· ${f.tenantName}` : "· Vacant"}
                </span>
              ))}
            </div>
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

      {/* ── EDIT INFO TAB ── */}
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
              <input type="number" value={totalFlats} disabled={!editing} onChange={(e) => setTotalFlats(+e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: editing ? "#fff" : "#F5F7FB" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Monthly collection</label>
              <input value={`₹${property.monthlyCollection.toLocaleString("en-IN")}`} disabled
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.15)", color: "#9CA3AF", background: "#F5F7FB" }} />
            </div>
          </div>

          {saved && <p className="text-xs mt-3" style={{ color: "#0F6E56" }}>{saved}</p>}
          {!editing && (
            <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
              Click Edit to update the building's address or flat count.
            </p>
          )}
        </div>
      )}

      {/* ── NOTES TAB ── */}
      {tab === "notes" && (
        <div>
          <div style={{ border: "1.5px solid rgba(27,79,187,0.18)", borderRadius: 10, overflow: "hidden" }}>
            <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
              style={{ background: "#F5F7FB", borderBottom: "1px solid rgba(27,79,187,0.12)", color: "#111827" }}>
              <StickyNote size={14} style={{ color: "#1B4FBB" }} /> Maintenance &amp; issue notes — {property.name}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about maintenance, vendors, issues..."
              className="w-full px-4 py-3 text-sm resize-y min-h-48"
              style={{ border: "none", outline: "none", color: "#111827", lineHeight: 1.7, background: "#fff" }} />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={saveNotes}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
              style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
              <Save size={13} /> Save note
            </button>
            {notesSaved && <span className="text-xs" style={{ color: "#0F6E56" }}>{notesSaved}</span>}
          </div>
        </div>
      )}

      {/* ── EXPENDITURE TAB — custom line items for this building ── */}
      {tab === "expenditure" && (
        <div>
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
            <span>Click any cell to edit · synced only to this building</span>
            <span>Total: <span className="font-semibold" style={{ color: "#A32D2D" }}>₹{expTotal.toLocaleString("en-IN")}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}