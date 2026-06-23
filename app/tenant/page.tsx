"use client";

// app/admin/tenants/page.tsx
// Admin tenants page — Add/Edit a primary tenant PLUS any number of
// co-tenants sharing the same flat (each with full Name/Age/Phone/Email/Aadhar).
// "Occupants" is computed automatically: 1 (primary) + co-tenants.length.

import { useState } from "react";
import Link from "next/link";
import { tenants as initialTenants } from "@/data/tenants";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Users, CheckCircle, Clock, Download, Search, ShieldCheck, UserX,
  ExternalLink, Plus, Pencil, X, Save, Eye, EyeOff, UserPlus,
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

type CoTenant = { id: string; name: string; age: string; phone: string; email: string; aadhar: string };

type Tenant = typeof initialTenants[number] & {
  age?: number;
  aadhar?: string;
  coTenants?: CoTenant[];
};

const EMPTY_FORM = {
  name: "", building: BUILDINGS[0], flatNo: "", rent: 0, phone: "", email: "",
  age: "", aadhar: "",
};

let _newId = 900;
let _coId = 1;

function blankCoTenant(): CoTenant {
  return { id: `co${_coId++}`, name: "", age: "", phone: "", email: "", aadhar: "" };
}

function maskAadhar(aadhar?: string) {
  if (!aadhar) return "—";
  const digits = aadhar.replace(/\s/g, "");
  if (digits.length < 4) return "••••";
  return `•••• •••• ${digits.slice(-4)}`;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants as Tenant[]);
  const [search, setSearch] = useState("");
  const [revealedAadhar, setRevealedAadhar] = useState<Set<string>>(new Set());

  // Add-tenant modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState(EMPTY_FORM);
  const [newCoTenants, setNewCoTenants] = useState<CoTenant[]>([]);

  // Edit-tenant modal state
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editFormStatus, setEditFormStatus] = useState("Paid");
  const [editCoTenants, setEditCoTenants] = useState<CoTenant[]>([]);

  const activeTenants = tenants.filter((t) => t.approved && t.accessEnabled);
  const newTenantsList = tenants.filter((t) => !t.approved);

  const filteredActive = activeTenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.building.toLowerCase().includes(search.toLowerCase()) ||
    t.flatNo.toLowerCase().includes(search.toLowerCase())
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
        `${t.building} · ${t.flatNo}`,
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
        // Indented co-tenant rows: italicize and lighten for visual hierarchy
        if (typeof data.cell.raw === "string" && data.cell.raw.startsWith("   ↳")) {
          data.cell.styles.fontStyle = "italic";
          data.cell.styles.textColor = [107, 114, 128];
        }
      },
    });

    doc.save(`Tenant_Directory_${new Date().toISOString().split("T")[0]}.pdf`);
  }

  function toggleAadhar(id: string) {
    setRevealedAadhar((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // ── Add tenant ──
  function openAddModal() {
    setNewTenant(EMPTY_FORM);
    setNewCoTenants([]);
    setShowAddModal(true);
  }
  function addNewCoTenant() {
    setNewCoTenants((prev) => [...prev, blankCoTenant()]);
  }
  function updateNewCoTenant(id: string, field: keyof CoTenant, val: string) {
    setNewCoTenants((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeNewCoTenant(id: string) {
    setNewCoTenants((prev) => prev.filter((c) => c.id !== id));
  }
  function submitNewTenant() {
    if (!newTenant.name.trim() || !newTenant.flatNo.trim()) {
      alert("Please enter at least a name and flat number.");
      return;
    }
    const tenant: Tenant = {
      id: `t${_newId++}`,
      name: newTenant.name.trim(),
      building: newTenant.building,
      flatNo: newTenant.flatNo.trim(),
      rent: newTenant.rent,
      phone: newTenant.phone,
      email: newTenant.email,
      age: newTenant.age ? Number(newTenant.age) : undefined,
      aadhar: newTenant.aadhar.trim() || undefined,
      coTenants: newCoTenants,
      paymentStatus: "Pending approval",
      approved: true,
      accessEnabled: true,
      googleFormStatus: "Added manually by owner",
    } as Tenant;
    setTenants((prev) => [...prev, tenant]);
    setShowAddModal(false);
  }

  // ── Edit tenant ──
  function openEditModal(t: Tenant) {
    setEditingTenant(t);
    setEditForm({
      name: t.name, building: t.building, flatNo: t.flatNo, rent: t.rent,
      phone: t.phone, email: t.email ?? "",
      age: t.age ? String(t.age) : "", aadhar: t.aadhar ?? "",
    });
    setEditFormStatus(t.paymentStatus);
    setEditCoTenants(t.coTenants ? t.coTenants.map((c) => ({ ...c })) : []);
  }
  function addEditCoTenant() {
    setEditCoTenants((prev) => [...prev, blankCoTenant()]);
  }
  function updateEditCoTenant(id: string, field: keyof CoTenant, val: string) {
    setEditCoTenants((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeEditCoTenant(id: string) {
    setEditCoTenants((prev) => prev.filter((c) => c.id !== id));
  }
  function submitEdit() {
    if (!editingTenant) return;
    setTenants((prev) => prev.map((t) =>
      t.id === editingTenant.id
        ? {
            ...t,
            name: editForm.name, building: editForm.building, flatNo: editForm.flatNo,
            rent: Number(editForm.rent), phone: editForm.phone, email: editForm.email,
            age: editForm.age ? Number(editForm.age) : undefined,
            aadhar: editForm.aadhar.trim() || undefined,
            coTenants: editCoTenants,
            paymentStatus: editFormStatus as any,
          }
        : t
    ));
    setEditingTenant(null);
  }

  // Shared co-tenant card UI, used in both Add and Edit modals
  function CoTenantCard({ co, onUpdate, onRemove }: { co: CoTenant; onUpdate: (f: keyof CoTenant, v: string) => void; onRemove: () => void }) {
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

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
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

      {/* Metrics */}
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

      {/* Search */}
      <div className="relative mb-5 w-full md:w-80">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
        <input type="text" placeholder="Search name, building, flat..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg"
          style={{ border: "1px solid #E5E7EB", outline: "none", color: "#111827", background: "#fff" }} />
      </div>

      {/* Active tenants */}
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
            const ps = payStyle[t.paymentStatus] ?? { bg: "#F3F4F6", text: "#374151" };
            const revealed = revealedAadhar.has(t.id);
            const occupants = 1 + (t.coTenants?.length ?? 0);
            return (
              <div key={t.id} className="grid px-3 py-2.5 items-center text-sm min-w-[920px]"
                style={{ gridTemplateColumns: "1.2fr 0.5fr 0.6fr 1.1fr 0.6fr 1.2fr 0.7fr 0.9fr 40px", borderTop: i===0?"none":"1px solid #F3F4F6", background: "#fff" }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: "#111827" }}>{t.name}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{t.building}</p>
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{t.flatNo}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{t.age ?? "—"}</div>
                <div className="text-xs" style={{ color: "#6B7280" }}>
                  <div>{t.phone}</div>
                  <div className="truncate" style={{ color: "#9CA3AF" }}>{(t as any).email ?? ""}</div>
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

      {/* New tenants (pending) */}
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
                      {t.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#111827" }}>{t.name}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{t.building} · Flat {t.flatNo}</p>
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
                  <div><span style={{ color: "#9CA3AF" }}>Move-in: </span><span style={{ color: "#111827" }}>{(t as any).moveInDate ?? "—"}</span></div>
                  <div><span style={{ color: "#9CA3AF" }}>ID: </span><span style={{ color: "#111827" }}>{(t as any).idProof ?? "—"}</span></div>
                  <div className="col-span-2"><span style={{ color: "#9CA3AF" }}>Google Form: </span><span style={{ color: "#111827" }}>{t.googleFormStatus}</span></div>
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

      {/* ── ADD TENANT MODAL ── */}
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

            {/* Co-tenants section */}
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

      {/* ── EDIT TENANT MODAL ── */}
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
              </div>
            </div>

            {/* Co-tenants section */}
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