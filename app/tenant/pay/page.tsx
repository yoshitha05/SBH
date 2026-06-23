"use client";

// app/tenant/pay/page.tsx  ← CORRECT path

import { useState } from "react";
import { tenants } from "@/data/tenants";
import { QrCode, CheckCircle } from "lucide-react";

const tenant = tenants.find((t) => t.id === "T001")!;

export default function TenantPayPage() {
  const [paid, setPaid] = useState(false);
  const [method, setMethod] = useState("UPI");

  if (paid) return (
    <div className="p-6 max-w-md mx-auto text-center">
      <div className="rounded-2xl p-8" style={{ background: "#E1F5EE", border: "2px solid #1D9E75" }}>
        <CheckCircle size={48} style={{ color: "#0F6E56", margin: "0 auto 16px" }} />
        <h2 className="text-xl font-semibold mb-2" style={{ color: "#085041" }}>Payment confirmed!</h2>
        <p className="text-sm mb-1" style={{ color: "#0F6E56" }}>
          ₹{tenant.monthlyDue.toLocaleString("en-IN")} received
        </p>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>Receipt will be available in the Receipts tab</p>
        <button onClick={() => setPaid(false)}
          className="mt-4 text-xs px-4 py-2 rounded-lg"
          style={{ background: "#1B4FBB", color: "#fff", border: "none" }}>
          Make another payment
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Pay rent</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Flat {tenant.flatNo} · {tenant.building} · June 2026
        </p>
      </div>

      {/* Method selector */}
      <div className="flex gap-2 mb-5">
        {["UPI", "NEFT", "Card"].map((m) => (
          <button key={m} onClick={() => setMethod(m)}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition"
            style={{
              background: method === m ? "#1B4FBB" : "#F5F7FB",
              color: method === m ? "#fff" : "#6B7280",
              border: method === m ? "none" : "1.5px solid rgba(27,79,187,0.18)",
            }}>
            {m}
          </button>
        ))}
      </div>

      {method === "UPI" && (
        <div className="rounded-xl p-5 text-center mb-5"
          style={{ background: "#fff", border: "2px solid #F0C040" }}>
          <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
            UPI ID: <span className="font-semibold" style={{ color: "#111827" }}>{tenant.upiId}</span>
          </p>
          <div className="rounded-xl flex flex-col items-center justify-center py-10 mb-3"
            style={{ border: "2px dashed rgba(27,79,187,0.2)", background: "#F5F7FB" }}>
            <QrCode size={72} style={{ color: "#1B4FBB", opacity: 0.25 }} />
            <p className="text-sm font-semibold mt-3" style={{ color: "#1B4FBB" }}>
              ₹{tenant.monthlyDue.toLocaleString("en-IN")}
            </p>
            <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
              Scan with PhonePe · GPay · Paytm
            </p>
          </div>
        </div>
      )}

      {(method === "NEFT" || method === "Card") && (
        <div className="rounded-xl p-5 mb-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Amount (₹)</label>
            <input type="number" defaultValue={tenant.monthlyDue}
              className="w-full px-3 py-2.5 text-sm rounded-lg"
              style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff", outline: "none" }} />
          </div>
          <div className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>For month</label>
            <input type="text" defaultValue="June 2026"
              className="w-full px-3 py-2.5 text-sm rounded-lg"
              style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff", outline: "none" }} />
          </div>
          {method === "Card" && (
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Card number</label>
              <input type="text" placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2.5 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff", outline: "none" }} />
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setPaid(true)}
        className="w-full py-3 rounded-lg text-sm font-semibold"
        style={{ background: "#1B4FBB", color: "#fff", border: "none" }}>
        {method === "UPI" ? "I've completed the scan →" : "Confirm payment →"}
      </button>

      <p className="text-xs text-center mt-3" style={{ color: "#9CA3AF" }}>
        Pay before the 5th of every month to avoid late fees
      </p>
    </div>
  );
}