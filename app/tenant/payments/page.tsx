"use client";

// app/tenant/payments/page.tsx  ← CORRECT path

import { useState } from "react";
import { tenants } from "@/data/tenants";
import { getCollectionsByTenant } from "@/data/collections";
import { CreditCard, QrCode, Download, AlertTriangle, CheckCircle } from "lucide-react";

const tenant = tenants.find((t) => t.id === "T001")!;
const history = getCollectionsByTenant("T001");
const balance = tenant.monthlyDue - tenant.monthlyPaid;

const statusStyle: Record<string, { bg: string; text: string }> = {
  Paid:    { bg: "#E1F5EE", text: "#085041" },
  Late:    { bg: "#FAEEDA", text: "#633806" },
  Partial: { bg: "#E6F1FB", text: "#0C447C" },
  Unpaid:  { bg: "#FCEBEB", text: "#791F1F" },
  paid:    { bg: "#E1F5EE", text: "#085041" },
  partial: { bg: "#FAEEDA", text: "#633806" },
  overdue: { bg: "#FCEBEB", text: "#791F1F" },
  unpaid:  { bg: "#E6F1FB", text: "#0C447C" },
};

export default function TenantPaymentsPage() {
  const [tab, setTab] = useState<"summary" | "history" | "upi">("summary");

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Payments</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Rent summary, payment history, UPI & scan to pay
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "2px solid #F0C040" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Monthly due</div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>
            ₹{tenant.monthlyDue.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#E1F5EE", border: "1.5px solid #9FE1CB" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Paid</div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>
            ₹{tenant.monthlyPaid.toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-lg p-3"
          style={{ background: balance > 0 ? "#FCEBEB" : "#E1F5EE", border: balance > 0 ? "1.5px solid #F7C1C1" : "1.5px solid #9FE1CB" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Balance</div>
          <div className="text-xl font-semibold" style={{ color: balance > 0 ? "#A32D2D" : "#0F6E56" }}>
            {balance > 0 ? `₹${balance.toLocaleString("en-IN")}` : "Nil ✓"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-5" style={{ borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
        {(["summary", "history", "upi"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2.5 text-sm font-medium capitalize"
            style={{
              borderBottom: tab === t ? "2px solid #1B4FBB" : "2px solid transparent",
              color: tab === t ? "#1B4FBB" : "#6B7280",
              background: "transparent",
              cursor: "pointer",
            }}>
            {t === "summary" ? "This month" : t === "history" ? "Payment history" : "UPI / Scan"}
          </button>
        ))}
      </div>

      {/* Summary tab */}
      {tab === "summary" && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-xl p-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} style={{ color: "#1B4FBB" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>June 2026 payment</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Monthly due",   value: `₹${tenant.monthlyDue.toLocaleString("en-IN")}`, color: "#111827" },
                { label: "Paid",          value: `₹${tenant.monthlyPaid.toLocaleString("en-IN")}`, color: "#0F6E56" },
                { label: "Balance",       value: balance > 0 ? `₹${balance.toLocaleString("en-IN")}` : "Nil", color: balance > 0 ? "#A32D2D" : "#0F6E56" },
                { label: "Status",        value: tenant.paymentStatus, color: "#111827" },
                { label: "UPI ID",        value: tenant.upiId, color: "#1B4FBB" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(27,79,187,0.07)" }}>
                  <span className="text-sm" style={{ color: "#6B7280" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
            {balance > 0 && (
              <button
                className="w-full mt-4 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#1B4FBB", color: "#fff", border: "none" }}
                onClick={() => setTab("upi")}
              >
                Pay now via UPI →
              </button>
            )}
          </div>

          <div className="rounded-xl p-5" style={{ background: "#fff", border: "2px solid #F0C040" }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={15} style={{ color: "#854F0B" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Reminder</h2>
            </div>
            <div className="space-y-2.5">
              <div className="rounded-lg p-3 text-xs" style={{ background: "#FAEEDA", color: "#633806", lineHeight: 1.7 }}>
                <p className="font-semibold mb-1">📅 Payment due on the 1st of every month</p>
                <p>• Pay before the 5th to avoid late fees</p>
                <p>• Late payments affect your on-time score</p>
                <p>• Contact your owner for payment issues</p>
              </div>
              {tenant.paymentStatus === "Paid" ? (
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
                  style={{ background: "#E1F5EE", color: "#085041" }}>
                  <CheckCircle size={13} />
                  <span>June 2026 paid on time ✓ Your score: <strong>{Math.round((tenant.paymentHistory?.filter(h => h.status === "Paid").length ?? 0) / Math.max(tenant.paymentHistory?.length ?? 1, 1) * 100)}%</strong></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs p-3 rounded-lg"
                  style={{ background: "#FCEBEB", color: "#791F1F" }}>
                  <AlertTriangle size={13} />
                  <span>Payment overdue — please pay immediately</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {tab === "history" && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2.5"
            style={{ gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr", background: "#F5F7FB",
              color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
            <div>Month</div><div>Amount</div><div>Paid on</div><div>Status</div>
          </div>
          {(tenant.paymentHistory ?? []).map((entry, i, arr) => (
            <div key={i}
              className="grid px-4 py-3 items-center text-sm"
              style={{ gridTemplateColumns: "1.2fr 1fr 1fr 0.8fr",
                borderTop: i === 0 ? "none" : "1px solid rgba(27,79,187,0.07)",
                background: "#fff" }}>
              <div className="font-medium" style={{ color: "#111827" }}>{entry.month}</div>
              <div style={{ color: "#111827" }}>
                {entry.amount > 0 ? `₹${entry.amount.toLocaleString("en-IN")}` : "—"}
              </div>
              <div style={{ color: "#6B7280", fontSize: 12 }}>
                {entry.paidOn ?? "—"}
              </div>
              <div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: statusStyle[entry.status]?.bg ?? "#F5F7FB",
                    color: statusStyle[entry.status]?.text ?? "#6B7280" }}>
                  {entry.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* UPI tab */}
      {tab === "upi" && (
        <div className="grid md:grid-cols-2 gap-5">
          <div className="rounded-xl p-5" style={{ background: "#fff", border: "2px solid #F0C040" }}>
            <div className="flex items-center gap-2 mb-4">
              <QrCode size={15} style={{ color: "#1B4FBB" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Scan to pay</h2>
            </div>
            <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
              UPI ID: <span className="font-semibold" style={{ color: "#111827" }}>{tenant.upiId}</span>
            </p>
            <div className="rounded-xl flex flex-col items-center justify-center py-10 mb-3"
              style={{ border: "2px dashed rgba(27,79,187,0.2)", background: "#F5F7FB" }}>
              <QrCode size={64} style={{ color: "#1B4FBB", opacity: 0.25 }} />
              <p className="text-xs mt-3 font-semibold" style={{ color: "#1B4FBB" }}>
                ₹{tenant.monthlyDue.toLocaleString("en-IN")}
              </p>
              <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>June 2026 · Flat {tenant.flatNo}</p>
            </div>
            <p className="text-xs text-center" style={{ color: "#9CA3AF" }}>
              Scan with any UPI app — PhonePe, GPay, Paytm
            </p>
          </div>

          <div className="rounded-xl p-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>Other payment methods</h2>
            <div className="space-y-3">
              <div className="mb-3">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Amount (₹)</label>
                <input type="number" defaultValue={tenant.monthlyDue}
                  className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff", outline: "none" }} />
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Payment method</label>
                <select className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff" }}>
                  <option>NEFT / IMPS</option>
                  <option>Debit card</option>
                  <option>Credit card (+1.5% fee)</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>For month</label>
                <input type="text" defaultValue="June 2026"
                  className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff", outline: "none" }} />
              </div>
              <button
                className="w-full py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#1B4FBB", color: "#fff", border: "none" }}
                onClick={() => alert("Payment initiated! You will receive a confirmation shortly.")}>
                Confirm payment →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}