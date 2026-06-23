"use client";

import { tenants } from "@/data/tenants";
import { getPaidReceipts, getCollectionsByTenant } from "@/data/collections";
import { Download, FileText, CheckCircle } from "lucide-react";

const tenant  = tenants.find((t) => t.id === "T001")!;
const paid    = getCollectionsByTenant("T001").filter((c) => c.receiptNo !== null);

export default function TenantReceiptsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Receipts</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Download payment receipts for your records
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "2px solid #F0C040" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Total receipts</div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>{paid.length}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#E1F5EE", border: "1.5px solid #9FE1CB" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Total paid</div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>
            ₹{paid.reduce((s, c) => s + c.amount, 0).toLocaleString("en-IN")}
          </div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Latest receipt</div>
          <div className="text-sm font-semibold" style={{ color: "#111827" }}>
            {paid[0]?.receiptNo ?? "—"}
          </div>
        </div>
      </div>

      {/* Receipts from collections data */}
      {paid.length > 0 ? (
        <div className="rounded-xl overflow-hidden mb-5"
          style={{ border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2.5"
            style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 80px", background: "#F5F7FB",
              color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
            <div>Month</div><div>Receipt no.</div><div>Amount</div><div>Paid on</div><div></div>
          </div>
          {paid.map((c, i) => (
            <div key={c.id}
              className="grid px-4 py-3 items-center text-sm"
              style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr 80px",
                borderTop: i === 0 ? "none" : "1px solid rgba(27,79,187,0.07)",
                background: "#fff" }}>
              <div className="font-medium" style={{ color: "#111827" }}>{c.month}</div>
              <div style={{ color: "#6B7280", fontSize: 12 }}>{c.receiptNo}</div>
              <div className="font-semibold" style={{ color: "#0F6E56" }}>
                ₹{c.amount.toLocaleString("en-IN")}
              </div>
              <div style={{ color: "#6B7280", fontSize: 12 }}>{c.paidOn}</div>
              <div>
                <button
                  onClick={() => alert(`Downloading ${c.receiptNo}`)}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)" }}>
                  <Download size={11} /> PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Receipts from tenant data (legacy) */}
      {tenant.receipts && tenant.receipts.length > 0 && (
        <div className="rounded-xl p-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>
            <FileText size={14} className="inline mr-1.5" style={{ color: "#1B4FBB" }} />
            Other receipts
          </h2>
          <div className="space-y-0">
            {tenant.receipts.map((receipt, i) => (
              <div key={i}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: i < tenant.receipts.length - 1 ? "1px solid rgba(27,79,187,0.07)" : "none" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} style={{ color: "#1D9E75" }} />
                  <span className="text-sm" style={{ color: "#111827" }}>{receipt}</span>
                </div>
                <button
                  onClick={() => alert(`Downloading ${receipt}`)}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium"
                  style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)" }}>
                  <Download size={11} /> PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {paid.length === 0 && (!tenant.receipts || tenant.receipts.length === 0) && (
        <div className="text-center py-12" style={{ color: "#9CA3AF" }}>
          <FileText size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No receipts yet</p>
        </div>
      )}
    </div>
  );
}