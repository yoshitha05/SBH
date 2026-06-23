import { tenants } from "@/data/tenants";
import { CheckCircle, AlertTriangle, Calendar, Bell } from "lucide-react";
import Link from "next/link";

const tenant = tenants.find((t) => t.id === "T001")!;

export default function TenantRemindersPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Reminders</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Payment alerts and upcoming due dates
        </p>
      </div>

      <div className="space-y-4">
        {tenant.paymentStatus === "Paid" ? (
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: "#E1F5EE", border: "1.5px solid #9FE1CB" }}>
            <CheckCircle size={18} style={{ color: "#0F6E56", flexShrink: 0, marginTop: 1 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "#085041" }}>
                June 2026 rent confirmed ✓
              </p>
              <p className="text-xs mt-1" style={{ color: "#0F6E56" }}>
                ₹{tenant.monthlyPaid.toLocaleString("en-IN")} received. Receipt available in Receipts tab.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: "#FCEBEB", border: "2px solid #E24B4A" }}>
            <AlertTriangle size={18} style={{ color: "#A32D2D", flexShrink: 0, marginTop: 1 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "#791F1F" }}>Rent overdue</p>
              <p className="text-xs mt-1" style={{ color: "#A32D2D" }}>
                ₹{(tenant.monthlyDue - tenant.monthlyPaid).toLocaleString("en-IN")} outstanding. Please pay immediately.
              </p>
              <Link href="/tenant/pay"
                className="inline-flex mt-2 text-xs px-3 py-1.5 rounded-lg font-semibold"
                style={{ background: "#1B4FBB", color: "#fff", textDecoration: "none" }}>
                Pay now →
              </Link>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: "#FAEEDA", border: "2px solid #F0C040" }}>
          <Calendar size={18} style={{ color: "#854F0B", flexShrink: 0, marginTop: 1 }} />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#633806" }}>
              July 2026 rent due in 16 days
            </p>
            <p className="text-xs mt-1" style={{ color: "#854F0B" }}>
              ₹{tenant.monthlyDue.toLocaleString("en-IN")} due on July 1, 2026. Pay early to maintain your on-time score.
            </p>
            <Link href="/tenant/pay"
              className="inline-flex mt-2 text-xs px-3 py-1.5 rounded-lg font-semibold"
              style={{ background: "#F0C040", color: "#1339A0", textDecoration: "none" }}>
              Pay early →
            </Link>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl"
          style={{ background: "#E8F0FE", border: "1.5px solid rgba(27,79,187,0.2)" }}>
          <Bell size={18} style={{ color: "#1B4FBB", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#1B4FBB" }}>
              Lease renewal in {Math.ceil((new Date(tenant.leaseEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
            </p>
            <p className="text-xs mt-1" style={{ color: "#378ADD" }}>
              Your lease ends on {tenant.leaseEnd}. Contact your owner to discuss renewal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}