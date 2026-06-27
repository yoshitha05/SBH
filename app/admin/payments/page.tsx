"use client";

// app/admin/payments/page.tsx
//
// Converted to Supabase: reads real payment_history rows, joined
// client-side against tenants for name/building/flat. Receipts tab now
// has a real upload button matching the same pattern used on the
// tenant detail page (Supabase Storage 'receipts' bucket, public URLs).

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { CreditCard, TrendingUp, Clock, AlertTriangle, Download, Search, Upload, Loader2, Plus, X } from "lucide-react";

const BUILDINGS = ["All buildings", "Ohm", "NN Elite", "RVB", "Renuka", "Pearls", "Sree Harsha"];

const statusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Paid:    { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB" },
  Partial: { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
  Unpaid:  { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" },
  Late:    { bg: "#FCEBEB", text: "#791F1F", border: "#E24B4A" },
};

const modeStyle: Record<string, string> = {
  UPI: "#E8F0FE", NEFT: "#E1F5EE", IMPS: "#EEEDFE", Cash: "#FAEEDA",
};

type Transaction = {
  id: number;
  month: string;
  amount: number;
  paid_on: string | null;
  status: string;
  receipt_url: string | null;
  payment_mode: string | null;
  due_date: string | null;
  tenant_id: number;
  tenantName: string;
  building: string;
  flatNo: string;
};

export default function AdminPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState("");

  const [tab, setTab] = useState<"transactions" | "receipts">("transactions");
  const [building, setBuilding] = useState("All buildings");
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [exScope, setExScope] = useState("all");

  // ── Add Payment modal — pick a tenant, fill in details, optionally
  // attach a receipt file right away, all in one step ──
  const [tenantOptions, setTenantOptions] = useState<{ id: number; name: string; building: string; flat_no: string; rent: number }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ tenant_id: "", month: "", amount: "", paid_on: "", status: "Paid", payment_mode: "UPI", due_date: "" });
  const [addReceiptFile, setAddReceiptFile] = useState<File | null>(null);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadData() {
    setLoading(true);
    setLoadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadError("Not signed in."); setLoading(false); return; }

    const { data: payments, error: payError } = await supabase
      .from("payment_history")
      .select("*")
      .eq("owner_id", user.id)
      .order("paid_on", { ascending: false });

    if (payError) {
      setLoadError(payError.message);
      setLoading(false);
      return;
    }

    const { data: tenants, error: tenError } = await supabase
      .from("tenants")
      .select("id, name, building, flat_no")
      .eq("owner_id", user.id);

    if (tenError) {
      setLoadError(tenError.message);
      setLoading(false);
      return;
    }

    const tenantMap = new Map((tenants ?? []).map((t) => [t.id, t]));
    const joined: Transaction[] = (payments ?? []).map((p) => {
      const t = tenantMap.get(p.tenant_id);
      return {
        ...p,
        tenantName: t?.name ?? "Unknown tenant",
        building: t?.building ?? "—",
        flatNo: t?.flat_no ?? "—",
      };
    });

    setTransactions(joined);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  // Tenants list for the Add Payment modal's dropdown
  useEffect(() => {
    async function loadTenantOptions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("tenants").select("id, name, building, flat_no, rent").eq("owner_id", user.id).order("name");
      if (data) setTenantOptions(data);
    }
    loadTenantOptions();
  }, []);

  function openAddModal() {
    setAddForm({ tenant_id: "", month: "", amount: "", paid_on: new Date().toISOString().split("T")[0], status: "Paid", payment_mode: "UPI", due_date: "" });
    setAddReceiptFile(null);
    setAddError("");
    setShowAddModal(true);
  }

  function selectTenantForAdd(tenantId: string) {
    const t = tenantOptions.find((opt) => String(opt.id) === tenantId);
    setAddForm((prev) => ({ ...prev, tenant_id: tenantId, amount: t?.rent !== undefined ? String(t.rent) : prev.amount }));
  }

  async function submitAddPayment() {
    if (!addForm.tenant_id || !addForm.month.trim()) {
      setAddError("Please choose a tenant and enter a month.");
      return;
    }
    setAdding(true);
    setAddError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAddError("Not signed in."); setAdding(false); return; }

    const { data: inserted, error } = await supabase
      .from("payment_history")
      .insert({
        tenant_id: Number(addForm.tenant_id),
        owner_id: user.id,
        month: addForm.month.trim(),
        amount: Number(addForm.amount) || 0,
        paid_on: addForm.paid_on || null,
        status: addForm.status,
        payment_mode: addForm.payment_mode || null,
        due_date: addForm.due_date || null,
      })
      .select()
      .single();

    if (error) {
      setAddError(error.message);
      setAdding(false);
      return;
    }

    // If a receipt file was attached, upload it right away and link it
    // to this new payment entry.
    let receiptUrl: string | null = null;
    if (addReceiptFile) {
      const fileExt = addReceiptFile.name.split(".").pop();
      const filePath = `payment-${inserted.id}-${Date.now()}.${fileExt}`;
      const { error: uploadErr } = await supabase.storage.from("receipts").upload(filePath, addReceiptFile);
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);
        receiptUrl = urlData.publicUrl;
        await supabase.from("payment_history").update({ receipt_url: receiptUrl }).eq("id", inserted.id);
      } else {
        setAddError(`Payment saved, but receipt upload failed: ${uploadErr.message}`);
      }
    }

    setAdding(false);
    setShowAddModal(false);
    await loadData();
  }

  const availableMonths = useMemo(() => {
    const set = new Set(transactions.map((t) => t.month));
    return ["all", ...Array.from(set)];
  }, [transactions]);

  const totalRent = transactions.reduce((s, t) => s + t.amount, 0);
  const collected = transactions.filter((t) => t.status === "Paid").reduce((s, t) => s + t.amount, 0);
  const pending = transactions.filter((t) => t.status === "Unpaid" || t.status === "Partial").reduce((s, t) => s + t.amount, 0);
  const overdue = transactions.filter((t) => t.status === "Late").reduce((s, t) => s + t.amount, 0);

  const filtered = useMemo(() => transactions.filter((t) => {
    const matchB = building === "All buildings" || t.building === building;
    const matchM = month === "all" || t.month === month;
    const matchS = status === "all" || t.status === status;
    const q = search.toLowerCase();
    const matchQ = search === "" ||
      t.tenantName.toLowerCase().includes(q) ||
      t.building.toLowerCase().includes(q) ||
      t.flatNo.includes(search);
    return matchB && matchM && matchS && matchQ;
  }), [transactions, building, month, status, search]);

  const receipts = filtered.filter((t) => t.receipt_url !== null);

  async function uploadReceipt(t: Transaction, file: File) {
    setUploadingFor(t.id);
    setUploadError("");

    const fileExt = file.name.split(".").pop();
    const filePath = `payment-${t.id}-${Date.now()}.${fileExt}`;

    const { error: uploadErr } = await supabase.storage.from("receipts").upload(filePath, file);
    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploadingFor(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);

    const { error: updateErr } = await supabase
      .from("payment_history")
      .update({ receipt_url: urlData.publicUrl })
      .eq("id", t.id);

    if (updateErr) {
      setUploadError(updateErr.message);
      setUploadingFor(null);
      return;
    }

    setTransactions((prev) => prev.map((row) => row.id === t.id ? { ...row, receipt_url: urlData.publicUrl } : row));
    setUploadingFor(null);
  }

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Payments Report", 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString("en-IN")} · ${exScope === "all" ? "All buildings" : exScope}`, 14, 22);

    const rows = filtered.filter((t) => exScope === "all" || t.building === exScope);
    autoTable(doc, {
      startY: 28,
      head: [["Tenant", "Building", "Flat", "Amount", "Mode", "Due date", "Status"]],
      body: rows.map((t) => [t.tenantName, t.building, t.flatNo, `₹${t.amount.toLocaleString("en-IN")}`, t.payment_mode ?? "—", t.due_date ?? "—", t.status]),
      headStyles: { fillColor: [27, 79, 187] },
      styles: { fontSize: 8 },
    });
    doc.save(`Payments_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExport(false);
  }
  function exportExcel() {
    const rows = filtered.filter((t) => exScope === "all" || t.building === exScope);
    const data = rows.map((t) => ({
      Tenant: t.tenantName, Building: t.building, Flat: t.flatNo,
      "Amount (₹)": t.amount, Mode: t.payment_mode ?? "", "Due date": t.due_date ?? "", Status: t.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `Payments_Report_${new Date().toISOString().split("T")[0]}.xlsx`);
    setShowExport(false);
  }

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading payments from database...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load payments from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Payments</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>Transactions, receipts and collection history</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openAddModal}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium"
            style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
            <Plus size={15} /> Add payment
          </button>
          <button onClick={() => setShowExport(!showExport)}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium"
            style={{ background: "#F0C040", color: "#1339A0", border: "none", cursor: "pointer" }}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Export panel */}
      {showExport && (
        <div className="rounded-xl p-5 mb-5" style={{ background: "#fff", border: "2px solid #1B4FBB" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>Download report</h2>
          <div className="mb-4">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Scope</label>
            <select value={exScope} onChange={(e) => setExScope(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg"
              style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", background: "#fff" }}>
              <option value="all">Overall — all buildings</option>
              {BUILDINGS.filter((b) => b !== "All buildings").map((b) => <option key={b} value={b}>{b} only</option>)}
            </select>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Exports whatever's currently filtered above, further limited to this scope.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportPDF} className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
              Download PDF
            </button>
            <button onClick={exportExcel} className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#1F7244", color: "#fff", border: "none", cursor: "pointer" }}>
              Download Excel
            </button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total rent", value: `₹${totalRent.toLocaleString("en-IN")}`, icon: CreditCard, style: { background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }, color: "#111827" },
          { label: "Collected", value: `₹${collected.toLocaleString("en-IN")}`, icon: TrendingUp, style: { background: "#F5F7FB", border: "2px solid #F0C040" }, color: "#0F6E56" },
          { label: "Pending", value: `₹${pending.toLocaleString("en-IN")}`, icon: Clock, style: { background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }, color: "#854F0B" },
          { label: "Overdue", value: `₹${overdue.toLocaleString("en-IN")}`, icon: AlertTriangle, style: { background: "#FCEBEB", border: "1.5px solid #F7C1C1" }, color: "#A32D2D" },
        ].map(({ label, value, icon: Icon, style, color }) => (
          <div key={label} className="rounded-lg p-3" style={style}>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Icon size={13} /> {label}</div>
            <div className="text-xl font-semibold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
        {(["transactions", "receipts"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-medium capitalize"
            style={{ borderBottom: tab===t ? "2px solid #1B4FBB" : "2px solid transparent", color: tab===t ? "#1B4FBB" : "#6B7280", background: "transparent", cursor: "pointer" }}>
            {t === "transactions" ? "Transactions" : `Receipts (${receipts.length})`}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
          <input type="text" placeholder="Search tenant, building..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs rounded-lg w-48"
            style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#111827", background: "#fff", outline: "none" }} />
        </div>
        <select value={building} onChange={(e) => setBuilding(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg"
          style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#111827", background: "#fff" }}>
          {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select value={month} onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg"
          style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#111827", background: "#fff" }}>
          {availableMonths.map((m) => <option key={m} value={m}>{m === "all" ? "All months" : m}</option>)}
        </select>
        <div className="flex gap-1.5">
          {["all", "Paid", "Partial", "Unpaid", "Late"].map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
              style={status===s ? { background: "#1B4FBB", color: "#fff", border: "none" } : { background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)" }}>
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>
          {filtered.length} records · ₹{filtered.reduce((s,t) => s+t.amount, 0).toLocaleString("en-IN")}
        </span>
      </div>

      {uploadError && <p className="text-xs mb-3" style={{ color: "#A32D2D" }}>{uploadError}</p>}

      {/* Transactions table */}
      {tab === "transactions" && (
        <div style={{ border: "1.5px solid rgba(27,79,187,0.18)", borderRadius: 10, overflow: "hidden" }}>
          <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2.5"
            style={{ gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr", background: "#F5F7FB", color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
            <div>Tenant</div><div>Building</div><div>Flat</div><div>Amount</div><div>Mode</div><div>Receipt</div><div>Due date</div><div>Status</div>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-10" style={{ color: "#9CA3AF" }}><p className="text-sm">No transactions match</p></div>
          ) : filtered.map((t, i) => {
            const ss = statusStyle[t.status] ?? statusStyle.Unpaid;
            return (
              <div key={t.id} className="grid px-4 py-3 items-center text-sm"
                style={{ gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr", borderTop: i===0?"none":"1px solid rgba(27,79,187,0.07)", background: t.status==="Late"?"#FFF8F8":"#fff", borderLeft: t.status==="Late"?"3px solid #E24B4A":t.status==="Partial"?"3px solid #F0C040":"3px solid transparent" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#111827" }}>{t.tenantName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{t.month}{t.paid_on && ` · Paid ${t.paid_on}`}</p>
                </div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{t.building}</div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{t.flatNo}</div>
                <div className="text-sm font-semibold" style={{ color: "#111827" }}>₹{t.amount.toLocaleString("en-IN")}</div>
                <div>
                  {t.payment_mode ? (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: modeStyle[t.payment_mode] ?? "#F5F7FB", color: "#111827" }}>{t.payment_mode}</span>
                  ) : <span style={{ color: "#D1D5DB", fontSize: 12 }}>—</span>}
                </div>
                <div style={{ fontSize: 12 }}>
                  {t.receipt_url ? (
                    <a href={t.receipt_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 hover:underline" style={{ color: "#0F6E56", textDecoration: "none" }}>
                      <Download size={11} /> View
                    </a>
                  ) : (
                    <label className="flex items-center gap-1 cursor-pointer" style={{ color: "#1B4FBB" }}>
                      <Upload size={11} /> {uploadingFor === t.id ? "..." : "Upload"}
                      <input type="file" className="hidden" disabled={uploadingFor === t.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadReceipt(t, file);
                        }} />
                    </label>
                  )}
                </div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{t.due_date ?? "—"}</div>
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}>
                    {t.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipts tab */}
      {tab === "receipts" && (
        <div>
          <div style={{ border: "1.5px solid rgba(27,79,187,0.18)", borderRadius: 10, overflow: "hidden" }}>
            <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2.5"
              style={{ gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 1fr 110px", background: "#F5F7FB", color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
              <div>Tenant</div><div>Building</div><div>Flat</div><div>Amount</div><div>Paid on</div><div></div>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-10" style={{ color: "#9CA3AF" }}><p className="text-sm">No transactions match this filter</p></div>
            ) : filtered.map((t, i) => (
              <div key={t.id} className="grid px-4 py-3 items-center text-sm"
                style={{ gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 1fr 110px", borderTop: i===0?"none":"1px solid rgba(27,79,187,0.07)", background: "#fff" }}>
                <div className="font-medium" style={{ color: "#111827" }}>{t.tenantName}</div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{t.building}</div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{t.flatNo}</div>
                <div className="font-semibold" style={{ color: "#0F6E56" }}>₹{t.amount.toLocaleString("en-IN")}</div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{t.paid_on ?? "—"}</div>
                <div>
                  {t.receipt_url ? (
                    <a href={t.receipt_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", textDecoration: "none" }}>
                      <Download size={11} /> View
                    </a>
                  ) : (
                    <label className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer"
                      style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)" }}>
                      <Upload size={11} /> {uploadingFor === t.id ? "Uploading..." : "Upload"}
                      <input type="file" className="hidden" disabled={uploadingFor === t.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadReceipt(t, file);
                        }} />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD PAYMENT MODAL — pick a tenant, fill in details, optionally attach a receipt ── */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ background: "rgba(17,24,39,0.5)" }}>
          <div className="rounded-xl p-6 w-full max-w-md my-8" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>Add payment</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Tenant</label>
                <select value={addForm.tenant_id} onChange={(e) => selectTenantForAdd(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827" }}>
                  <option value="">Select a tenant...</option>
                  {tenantOptions.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.building} {t.flat_no}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Month</label>
                  <input value={addForm.month} onChange={(e) => setAddForm({ ...addForm, month: e.target.value })}
                    placeholder="e.g. July 2026"
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Amount (₹)</label>
                  <input type="number" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Paid on</label>
                  <input type="date" value={addForm.paid_on} onChange={(e) => setAddForm({ ...addForm, paid_on: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Due date</label>
                  <input type="date" value={addForm.due_date} onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", outline: "none" }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Status</label>
                  <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827" }}>
                    <option>Paid</option><option>Partial</option><option>Unpaid</option><option>Late</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Payment mode</label>
                  <select value={addForm.payment_mode} onChange={(e) => setAddForm({ ...addForm, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827" }}>
                    <option>UPI</option><option>NEFT</option><option>IMPS</option><option>Cash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Receipt (optional)</label>
                <input type="file" onChange={(e) => setAddReceiptFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs"
                  style={{ color: "#6B7280" }} />
                {addReceiptFile && <p className="text-xs mt-1" style={{ color: "#0F6E56" }}>{addReceiptFile.name} selected</p>}
              </div>
            </div>

            {addError && <p className="text-xs mt-3" style={{ color: "#A32D2D" }}>{addError}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitAddPayment} disabled={adding}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: adding ? "#9CA3AF" : "#1B4FBB", color: "#fff", border: "none", cursor: adding ? "not-allowed" : "pointer" }}>
                {adding ? "Saving..." : "Add payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
