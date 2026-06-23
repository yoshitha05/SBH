// app/owner/tenant/[id]/page.tsx

import { tenants } from "@/data/tenants";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Phone, Mail, Building2, Home, CreditCard,
  ShieldCheck, Wifi, WifiOff, QrCode,
  Download, ArrowLeft, UserX, CheckCircle,
  AlertTriangle, Calendar,
} from "lucide-react";

const riskStyle: Record<string, { bg: string; text: string; border: string; label: string }> = {
  low:    { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB",  label: "Low risk" },
  medium: { bg: "#FAEEDA", text: "#633806", border: "#FAC775",  label: "Medium risk" },
  high:   { bg: "#FCEBEB", text: "#791F1F", border: "#F7C1C1",  label: "High risk" },
};

const payStatusStyle: Record<string, { bg: string; text: string; border: string }> = {
  Paid:               { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB" },
  Partial:            { bg: "#FAEEDA", text: "#633806", border: "#FAC775" },
  Overdue:            { bg: "#FCEBEB", text: "#791F1F", border: "#F7C1C1" },
  Unpaid:             { bg: "#FCEBEB", text: "#791F1F", border: "#F7C1C1" },
  "Pending approval": { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" },
};

const historyStyle: Record<string, { bg: string; text: string }> = {
  Paid:    { bg: "#E1F5EE", text: "#085041" },
  Late:    { bg: "#FAEEDA", text: "#633806" },
  Partial: { bg: "#E6F1FB", text: "#0C447C" },
  Unpaid:  { bg: "#FCEBEB", text: "#791F1F" },
};

export default async function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = tenants.find((t) => t.id === id);
  if (!tenant) notFound();

  const rs  = riskStyle[tenant.risk]             ?? riskStyle.medium;
  const pss = payStatusStyle[tenant.paymentStatus] ?? payStatusStyle["Pending approval"];
  const balance = tenant.monthlyDue - tenant.monthlyPaid;

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#6B7280" }}>
        <Link
          href="/owner/tenants"
          className="flex items-center gap-1 hover:underline"
          style={{ color: "#1B4FBB" }}
        >
          <ArrowLeft size={13} /> Tenants
        </Link>
        <span>/</span>
        <span>{tenant.name}</span>
      </div>

      {/* ── Profile header card ── */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0"
              style={{ background: "#E8F0FE", color: "#1B4FBB" }}
            >
              {tenant.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>
                {tenant.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                {tenant.building} · Flat {tenant.flatNo} · ID: {tenant.id}
              </p>
            </div>
          </div>

          {/* Status badges + action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}
            >
              {rs.label}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: pss.bg, color: pss.text, border: `1px solid ${pss.border}` }}
            >
              {tenant.paymentStatus}
            </span>
            {!tenant.approved && (
              <Link
                href={`/tenant-approvals?id=${tenant.id}`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "#E1F5EE", color: "#085041", border: "1px solid #9FE1CB" }}
              >
                <CheckCircle size={12} /> Approve
              </Link>
            )}
            {tenant.approved && tenant.accessEnabled && (
              <Link
                href={`/owner/tenant/${tenant.id}?action=vacate`}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1" }}
              >
                <UserX size={12} /> Vacate tenant
              </Link>
            )}
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5"
          style={{ borderTop: "1px solid rgba(27,79,187,0.1)" }}>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              <Phone size={12} /> Phone
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.phone}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              <Mail size={12} /> Email
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.email}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              <Building2 size={12} /> Building
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.building}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              <Home size={12} /> Flat
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.flatNo}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              <Calendar size={12} /> Move-in
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.moveInDate}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              <Calendar size={12} /> Lease end
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.leaseEnd}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              <ShieldCheck size={12} /> ID proof
            </div>
            <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.idProof}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
              {tenant.accessEnabled ? <Wifi size={12} /> : <WifiOff size={12} />} Login access
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: tenant.accessEnabled ? "#0F6E56" : "#6B7280" }}
            >
              {tenant.accessEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom grid: Payments + UPI + History + Receipts ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Monthly payment summary */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} style={{ color: "#1B4FBB" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Monthly payment</h2>
          </div>
          <div className="space-y-2.5">
            <div
              className="flex justify-between items-center py-2"
              style={{ borderBottom: "1px solid rgba(27,79,187,0.08)" }}
            >
              <span className="text-sm" style={{ color: "#6B7280" }}>Monthly due</span>
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>
                ₹{tenant.monthlyDue.toLocaleString("en-IN")}
              </span>
            </div>
            <div
              className="flex justify-between items-center py-2"
              style={{ borderBottom: "1px solid rgba(27,79,187,0.08)" }}
            >
              <span className="text-sm" style={{ color: "#6B7280" }}>Paid</span>
              <span className="text-sm font-semibold" style={{ color: "#0F6E56" }}>
                ₹{tenant.monthlyPaid.toLocaleString("en-IN")}
              </span>
            </div>
            {balance > 0 && (
              <div
                className="flex justify-between items-center py-2"
                style={{ borderBottom: "1px solid rgba(27,79,187,0.08)" }}
              >
                <span className="text-sm flex items-center gap-1" style={{ color: "#A32D2D" }}>
                  <AlertTriangle size={12} /> Balance due
                </span>
                <span className="text-sm font-semibold" style={{ color: "#A32D2D" }}>
                  ₹{balance.toLocaleString("en-IN")}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm" style={{ color: "#6B7280" }}>Status</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: pss.bg, color: pss.text, border: `1px solid ${pss.border}` }}
              >
                {tenant.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* UPI + QR */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "2px solid #F0C040" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={15} style={{ color: "#1B4FBB" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>UPI payment & scan</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
            UPI ID: <span className="font-semibold" style={{ color: "#111827" }}>{tenant.upiId}</span>
          </p>
          <div
            className="rounded-xl flex flex-col items-center justify-center py-8 mb-3"
            style={{ border: "2px dashed rgba(27,79,187,0.2)", background: "#F5F7FB" }}
          >
            <QrCode size={48} style={{ color: "#1B4FBB", opacity: 0.3 }} />
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
              QR code for ₹{tenant.monthlyDue.toLocaleString("en-IN")} payment
            </p>
          </div>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Reminder: pay before the 5th of every month to avoid late fees.
          </p>
        </div>

        {/* Payment history */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>Payment history</h2>
          {tenant.paymentHistory && tenant.paymentHistory.length > 0 ? (
            <div className="space-y-2">
              {tenant.paymentHistory.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < tenant.paymentHistory.length - 1 ? "1px solid rgba(27,79,187,0.08)" : "none" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#111827" }}>{entry.month}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                      {entry.paidOn ? `Paid on ${entry.paidOn}` : "Not yet paid"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                      {entry.amount > 0 ? `₹${entry.amount.toLocaleString("en-IN")}` : "—"}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: historyStyle[entry.status]?.bg ?? "#F1EFE8",
                        color: historyStyle[entry.status]?.text ?? "#5F5E5A",
                      }}
                    >
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>
              No payment history yet
            </p>
          )}
        </div>

        {/* Receipts */}
        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>Receipts</h2>
          {tenant.receipts && tenant.receipts.length > 0 ? (
            <div className="space-y-2">
              {tenant.receipts.map((receipt, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2"
                  style={{ borderBottom: i < tenant.receipts.length - 1 ? "1px solid rgba(27,79,187,0.08)" : "none" }}
                >
                  <span className="text-sm" style={{ color: "#111827" }}>{receipt}</span>
                  <button
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-medium transition"
                    style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)" }}
                  >
                    <Download size={11} /> PDF
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>
              No receipts yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}