"use client";

// app/collections/page.tsx

import { useState } from "react";
import { collections } from "@/data/collections";
import {
  CreditCard, TrendingUp, Clock, AlertTriangle,
  Download, Search, Filter, Receipt,
} from "lucide-react";

type StatusFilter = "all" | "paid" | "unpaid" | "overdue" | "partial";

const statusStyle: Record<string, { bg: string; text: string; border: string; label: string }> = {
  paid:    { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB",  label: "Paid" },
  partial: { bg: "#FAEEDA", text: "#633806", border: "#FAC775",  label: "Partial" },
  unpaid:  { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4",  label: "Unpaid" },
  overdue: { bg: "#FCEBEB", text: "#791F1F", border: "#F7C1C1",  label: "Overdue" },
};

const modeStyle: Record<string, string> = {
  UPI:    "#E8F0FE",
  NEFT:   "#E1F5EE",
  IMPS:   "#EEEDFE",
  Cash:   "#FAEEDA",
  Cheque: "#F1EFE8",
};

const MONTHS = ["all", "Jun 2026", "May 2026", "Apr 2026"];
const BUILDINGS = ["all", "Ohm", "NN Elite", "RVB", "Renuka", "Pearls", "Sree Harsha"];

export default function CollectionsPage() {
  const [statusFilter,   setStatusFilter]   = useState<StatusFilter>("all");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [monthFilter,    setMonthFilter]    = useState("Jun 2026");
  const [search,         setSearch]         = useState("");
  const [tab,            setTab]            = useState<"transactions" | "receipts">("transactions");
  const [showExport,     setShowExport]     = useState(false);
  const [exportScope,    setExportScope]    = useState("all");
  const [exportPeriod,   setExportPeriod]   = useState("Jun 2026");
  const [exportFormat,   setExportFormat]   = useState<"pdf" | "excel" | null>(null);

  // ── Filtered data ──
  const filtered = collections.filter((c) => {
    const matchStatus   = statusFilter === "all"   || c.status === statusFilter;
    const matchBuilding = buildingFilter === "all" || c.building === buildingFilter;
    const matchMonth    = monthFilter === "all"    || c.month === monthFilter;
    const matchSearch   =
      search === "" ||
      c.tenantName.toLowerCase().includes(search.toLowerCase()) ||
      c.building.toLowerCase().includes(search.toLowerCase()) ||
      c.flatNo.toLowerCase().includes(search.toLowerCase()) ||
      (c.receiptNo ?? "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchBuilding && matchMonth && matchSearch;
  });

  const receipts = filtered.filter((c) => c.receiptNo !== null);

  // ── Stats (always on current month) ──
  const thisMonth = collections.filter((c) => c.month === "Jun 2026");
  const totalRent = thisMonth.reduce((s, c) => s + c.amount, 0);
  const paid      = thisMonth.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
  const pending   = thisMonth.filter((c) => c.status === "unpaid" || c.status === "partial").reduce((s, c) => s + c.amount, 0);
  const overdue   = thisMonth.filter((c) => c.status === "overdue").reduce((s, c) => s + c.amount, 0);

  function doExport(fmt: "pdf" | "excel") {
    setExportFormat(fmt);
    setTimeout(() => {
      alert(`${fmt.toUpperCase()} export ready!\nScope: ${exportScope === "all" ? "All buildings" : exportScope}\nPeriod: ${exportPeriod}`);
      setExportFormat(null);
      setShowExport(false);
    }, 800);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Payments</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            Transactions, receipts and collection history
          </p>
        </div>
        <button
          onClick={() => setShowExport(!showExport)}
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-medium transition"
          style={{ background: "#F0C040", color: "#1339A0", border: "none" }}
        >
          <Download size={15} /> Export
        </button>
      </div>

      {/* ── Export panel ── */}
      {showExport && (
        <div
          className="rounded-xl p-5 mb-5"
          style={{ background: "#fff", border: "2px solid #1B4FBB" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>
            Download report
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Scope</label>
              <select
                value={exportScope}
                onChange={(e) => setExportScope(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", background: "#fff" }}
              >
                <option value="all">Overall — all buildings</option>
                {BUILDINGS.filter((b) => b !== "all").map((b) => (
                  <option key={b} value={b}>{b} only</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Period</label>
              <select
                value={exportPeriod}
                onChange={(e) => setExportPeriod(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", background: "#fff" }}
              >
                <option>Jun 2026</option>
                <option>May 2026</option>
                <option>Apr 2026</option>
                <option>Q2 2026</option>
                <option>Full year 2026</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Include</label>
              <select
                className="w-full px-3 py-2 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", background: "#fff" }}
              >
                <option>Transactions + receipts + summary</option>
                <option>Transactions only</option>
                <option>Receipts only</option>
                <option>Summary only</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => doExport("pdf")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#1B4FBB", color: "#fff", border: "none" }}
            >
              <Download size={14} />
              {exportFormat === "pdf" ? "Generating..." : "Download PDF"}
            </button>
            <button
              onClick={() => doExport("excel")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#1F7244", color: "#fff", border: "none" }}
            >
              <Download size={14} />
              {exportFormat === "excel" ? "Generating..." : "Download Excel"}
            </button>
          </div>
        </div>
      )}

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <CreditCard size={13} /> Total rent
          </div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>
            ₹{totalRent.toLocaleString("en-IN")}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Jun 2026</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "2px solid #F0C040" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <TrendingUp size={13} /> Collected
          </div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>
            ₹{paid.toLocaleString("en-IN")}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
            {totalRent > 0 ? Math.round((paid / totalRent) * 100) : 0}% collection rate
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <Clock size={13} /> Pending
          </div>
          <div className="text-xl font-semibold" style={{ color: "#854F0B" }}>
            ₹{pending.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#FCEBEB", border: "1.5px solid #F7C1C1" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <AlertTriangle size={13} /> Overdue
          </div>
          <div className="text-xl font-semibold" style={{ color: "#A32D2D" }}>
            ₹{overdue.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
        {(["transactions", "receipts"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-medium capitalize transition"
            style={{
              borderBottom: tab === t ? "2px solid #1B4FBB" : "2px solid transparent",
              color: tab === t ? "#1B4FBB" : "#6B7280",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {t === "transactions" ? "Transactions" : `Receipts (${receipts.length})`}
          </button>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-2 flex-wrap mb-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
          <input
            type="text"
            placeholder="Search tenant, building..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-2 text-xs rounded-lg w-48"
            style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#111827", background: "#fff", outline: "none" }}
          />
        </div>

        {/* Building filter */}
        <select
          value={buildingFilter}
          onChange={(e) => setBuildingFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg"
          style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#111827", background: "#fff" }}
        >
          {BUILDINGS.map((b) => (
            <option key={b} value={b}>{b === "all" ? "All buildings" : b}</option>
          ))}
        </select>

        {/* Month filter */}
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg"
          style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#111827", background: "#fff" }}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m === "all" ? "All months" : m}</option>
          ))}
        </select>

        {/* Status pills */}
        <div className="flex gap-1.5">
          {(["all", "paid", "partial", "unpaid", "overdue"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="text-xs px-2.5 py-1 rounded-full font-medium capitalize transition"
              style={
                statusFilter === s
                  ? { background: "#1B4FBB", color: "#fff", border: "none" }
                  : { background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)" }
              }
            >
              {s}
            </button>
          ))}
        </div>

        <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>
          {filtered.length} records · ₹{filtered.reduce((s, c) => s + c.amount, 0).toLocaleString("en-IN")}
        </span>
      </div>

      {/* ── TRANSACTIONS tab ── */}
      {tab === "transactions" && (
        <div style={{ border: "1.5px solid rgba(27,79,187,0.18)", borderRadius: 10, overflow: "hidden" }}>
          {/* Head */}
          <div
            className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2.5"
            style={{
              gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr",
              background: "#F5F7FB",
              color: "#6B7280",
              borderBottom: "1px solid rgba(27,79,187,0.12)",
            }}
          >
            <div>Tenant</div>
            <div>Building</div>
            <div>Flat</div>
            <div>Amount</div>
            <div>Mode</div>
            <div>Receipt</div>
            <div>Due date</div>
            <div>Status</div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-10" style={{ color: "#9CA3AF" }}>
              <CreditCard size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No transactions match your filters</p>
            </div>
          ) : (
            filtered.map((c, i) => {
              const ss = statusStyle[c.status];
              return (
                <div
                  key={c.id}
                  className="grid px-4 py-3 items-center text-sm"
                  style={{
                    gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 0.7fr 0.8fr 0.9fr 0.9fr",
                    borderTop: i === 0 ? "none" : "1px solid rgba(27,79,187,0.07)",
                    background: c.status === "overdue" ? "#FFF8F8" : "#fff",
                    borderLeft: c.status === "overdue" ? "3px solid #E24B4A"
                      : c.status === "partial" ? "3px solid #F0C040"
                      : "3px solid transparent",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#111827" }}>{c.tenantName}</p>
                    {c.paidOn && (
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>Paid {c.paidOn}</p>
                    )}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 12 }}>{c.building}</div>
                  <div style={{ color: "#6B7280", fontSize: 12 }}>{c.flatNo}</div>
                  <div className="text-sm font-semibold" style={{ color: "#111827" }}>
                    ₹{c.amount.toLocaleString("en-IN")}
                  </div>
                  <div>
                    {c.paymentMode ? (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: modeStyle[c.paymentMode] ?? "#F5F7FB", color: "#111827" }}
                      >
                        {c.paymentMode}
                      </span>
                    ) : (
                      <span style={{ color: "#D1D5DB", fontSize: 12 }}>—</span>
                    )}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 12 }}>
                    {c.receiptNo ?? <span style={{ color: "#D1D5DB" }}>—</span>}
                  </div>
                  <div style={{ color: "#6B7280", fontSize: 12 }}>{c.dueDate}</div>
                  <div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: ss.bg, color: ss.text, border: `1px solid ${ss.border}` }}
                    >
                      {ss.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── RECEIPTS tab ── */}
      {tab === "receipts" && (
        <div style={{ border: "1.5px solid rgba(27,79,187,0.18)", borderRadius: 10, overflow: "hidden" }}>
          <div
            className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2.5"
            style={{
              gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 0.9fr 1fr 80px",
              background: "#F5F7FB",
              color: "#6B7280",
              borderBottom: "1px solid rgba(27,79,187,0.12)",
            }}
          >
            <div>Tenant</div>
            <div>Building</div>
            <div>Flat</div>
            <div>Amount</div>
            <div>Receipt no.</div>
            <div>Paid on</div>
            <div></div>
          </div>

          {receipts.length === 0 ? (
            <div className="text-center py-10" style={{ color: "#9CA3AF" }}>
              <Receipt size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No receipts found</p>
            </div>
          ) : (
            receipts.map((c, i) => (
              <div
                key={c.id}
                className="grid px-4 py-3 items-center text-sm"
                style={{
                  gridTemplateColumns: "1.8fr 1fr 0.6fr 0.9fr 0.9fr 1fr 80px",
                  borderTop: i === 0 ? "none" : "1px solid rgba(27,79,187,0.07)",
                  background: "#fff",
                }}
              >
                <div className="font-medium" style={{ color: "#111827" }}>{c.tenantName}</div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{c.building}</div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{c.flatNo}</div>
                <div className="font-semibold" style={{ color: "#0F6E56" }}>
                  ₹{c.amount.toLocaleString("en-IN")}
                </div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{c.receiptNo}</div>
                <div style={{ color: "#6B7280", fontSize: 12 }}>{c.paidOn}</div>
                <div>
                  <button
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                    style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)" }}
                    onClick={() => alert(`Downloading ${c.receiptNo} for ${c.tenantName}`)}
                  >
                    <Download size={11} /> PDF
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}