"use client";

// app/reminders/page.tsx
//
// Converted to Supabase: payment status/balance for each tenant is now
// derived live from their most recent payment_history entry, instead of
// static monthlyDue/monthlyPaid/paymentStatus fields that never existed
// in the real database. Unapproved tenants still show as "Pending
// approval", matching the original design.

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Bell, AlertTriangle, Clock, CheckCircle, Calendar, Filter, Loader2 } from "lucide-react";
import Link from "next/link";

type SortType = "date" | "month";

type DerivedStatus = "Overdue" | "Partial" | "Unpaid" | "Pending approval" | "Paid";

type TenantWithStatus = {
  id: number;
  name: string;
  building: string;
  flat_no: string;
  approved: boolean;
  rent: number;
  paymentStatus: DerivedStatus;
  monthlyDue: number;
  monthlyPaid: number;
  latestMonth: string | null;
};

const urgencyOrder: Record<string, number> = {
  Overdue: 0, Partial: 1, Unpaid: 2,
  "Pending approval": 3, Paid: 4,
};

export default function RemindersPage() {
  const [tenants, setTenants] = useState<TenantWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filterType, setFilterType] = useState<SortType>("date");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>(["all"]);

  async function loadData() {
    setLoading(true);
    setLoadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadError("Not signed in."); setLoading(false); return; }

    const { data: tenantRows, error: tError } = await supabase.from("tenants").select("*").eq("owner_id", user.id);
    if (tError) {
      setLoadError(tError.message);
      setLoading(false);
      return;
    }

    const { data: paymentRows, error: pError } = await supabase
      .from("payment_history")
      .select("*")
      .eq("owner_id", user.id)
      .order("paid_on", { ascending: false });
    if (pError) {
      setLoadError(pError.message);
      setLoading(false);
      return;
    }

    // Most recent payment entry per tenant (first match wins, since
    // already sorted newest-first).
    const latestByTenant = new Map<number, typeof paymentRows[0]>();
    (paymentRows ?? []).forEach((p) => {
      if (!latestByTenant.has(p.tenant_id)) latestByTenant.set(p.tenant_id, p);
    });

    const monthSet = new Set<string>();
    (paymentRows ?? []).forEach((p) => monthSet.add(p.month));
    setAvailableMonths(["all", ...Array.from(monthSet)]);

    const withStatus: TenantWithStatus[] = (tenantRows ?? []).map((t) => {
      if (!t.approved) {
        return {
          id: t.id, name: t.name, building: t.building, flat_no: t.flat_no,
          approved: t.approved, rent: t.rent,
          paymentStatus: "Pending approval", monthlyDue: t.rent, monthlyPaid: 0, latestMonth: null,
        };
      }

      const latest = latestByTenant.get(t.id);
      if (!latest) {
        // Approved, but no payment entry at all yet — treat as Unpaid
        // for this month, so it still surfaces as something to follow up on.
        return {
          id: t.id, name: t.name, building: t.building, flat_no: t.flat_no,
          approved: t.approved, rent: t.rent,
          paymentStatus: "Unpaid", monthlyDue: t.rent, monthlyPaid: 0, latestMonth: null,
        };
      }

      const status = (latest.status as DerivedStatus) ?? "Unpaid";
      return {
        id: t.id, name: t.name, building: t.building, flat_no: t.flat_no,
        approved: t.approved, rent: t.rent,
        paymentStatus: status,
        monthlyDue: latest.amount,
        monthlyPaid: status === "Paid" ? latest.amount : 0,
        latestMonth: latest.month,
      };
    });

    setTenants(withStatus);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = [...tenants];
    if (filterType === "month" && selectedMonth !== "all") {
      list = list.filter((t) => t.latestMonth === selectedMonth);
    }
    return list.sort((a, b) =>
      (urgencyOrder[a.paymentStatus] ?? 5) - (urgencyOrder[b.paymentStatus] ?? 5)
    );
  }, [tenants, filterType, selectedMonth]);

  const overdue = filtered.filter((t) => t.paymentStatus === "Overdue").length;
  const pending = filtered.filter((t) => t.paymentStatus === "Pending approval").length;
  const paid = filtered.filter((t) => t.paymentStatus === "Paid").length;

  const alertStyle = (status: string) => {
    switch (status) {
      case "Overdue": return { bg: "#FCEBEB", border: "1.5px solid #F7C1C1", icon: AlertTriangle, iconColor: "#A32D2D" };
      case "Partial": return { bg: "#FAEEDA", border: "2px solid #F0C040", icon: Clock, iconColor: "#854F0B" };
      case "Unpaid": return { bg: "#FAEEDA", border: "1.5px solid #FAC775", icon: Clock, iconColor: "#854F0B" };
      case "Pending approval": return { bg: "#E8F0FE", border: "1.5px solid rgba(27,79,187,0.2)", icon: Bell, iconColor: "#1B4FBB" };
      case "Paid": return { bg: "#E1F5EE", border: "1.5px solid #9FE1CB", icon: CheckCircle, iconColor: "#0F6E56" };
      default: return { bg: "#F5F7FB", border: "1.5px solid #E5E7EB", icon: Bell, iconColor: "#6B7280" };
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading reminders from database...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load reminders from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Reminders</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            Monthly payment reminders — sorted by urgency, based on each tenant's most recent payment
          </p>
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium transition"
          style={{
            background: showFilter ? "#1B4FBB" : "#F5F7FB",
            color: showFilter ? "#fff" : "#6B7280",
            border: "1.5px solid rgba(27,79,187,0.18)",
          }}
        >
          <Filter size={14} /> Filter
        </button>
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="rounded-xl p-4 mb-5"
          style={{ background: "#fff", border: "2px solid #1B4FBB" }}>
          <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "#6B7280" }}>
            Filter options
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>View by</p>
              <div className="flex gap-2">
                {(["date", "month"] as SortType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize"
                    style={filterType === type
                      ? { background: "#1B4FBB", color: "#fff", border: "none" }
                      : { background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.18)" }}>
                    {type === "date" ? <Calendar size={12} /> : <Clock size={12} />}
                    {type === "date" ? "Date wise" : "Month wise"}
                  </button>
                ))}
              </div>
            </div>

            {filterType === "month" && (
              <div>
                <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>Select month</p>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg"
                  style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#111827", background: "#fff" }}
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{m === "all" ? "All months" : m}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="ml-auto text-xs px-2.5 py-1.5 rounded-lg"
              style={{ background: "#E8F0FE", color: "#1B4FBB" }}>
              Sorted {filterType === "date" ? "by date" : `by month${selectedMonth !== "all" ? ` · ${selectedMonth}` : ""}`}
            </div>
          </div>
        </div>
      )}

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-lg p-3" style={{ background: "#FCEBEB", border: "1.5px solid #F7C1C1" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Overdue</div>
          <div className="text-xl font-semibold" style={{ color: "#A32D2D" }}>{overdue}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#FAEEDA", border: "2px solid #F0C040" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Pending</div>
          <div className="text-xl font-semibold" style={{ color: "#854F0B" }}>{pending}</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: "#E1F5EE", border: "1.5px solid #9FE1CB" }}>
          <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Paid</div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>{paid}</div>
        </div>
      </div>

      {/* Reminder cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#9CA3AF" }}>
            <Bell size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tenants match this filter</p>
          </div>
        ) : filtered.map((tenant) => {
          const style = alertStyle(tenant.paymentStatus);
          const Icon = style.icon;
          const balance = tenant.monthlyDue - tenant.monthlyPaid;

          return (
            <div key={tenant.id} className="flex items-start gap-3 p-4 rounded-xl"
              style={{ background: style.bg, border: style.border }}>
              <Icon size={16} style={{ color: style.iconColor, flexShrink: 0, marginTop: 2 }} />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/admin/tenant/${tenant.id}`}
                      className="text-sm font-semibold hover:underline"
                      style={{ color: "#111827" }}>
                      {tenant.name}
                    </Link>
                    <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                      {tenant.building} · Flat {tenant.flat_no}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                    style={{
                      background: tenant.paymentStatus === "Paid" ? "#E1F5EE"
                        : tenant.paymentStatus === "Overdue" ? "#FCEBEB"
                        : "#FAEEDA",
                      color: tenant.paymentStatus === "Paid" ? "#085041"
                        : tenant.paymentStatus === "Overdue" ? "#791F1F"
                        : "#633806",
                    }}>
                    {tenant.paymentStatus}
                  </span>
                </div>

                <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
                  {tenant.paymentStatus === "Paid"
                    ? `✓ ₹${tenant.monthlyPaid.toLocaleString("en-IN")} paid — no action needed.`
                    : tenant.paymentStatus === "Overdue"
                    ? `⚠ ₹${tenant.monthlyDue.toLocaleString("en-IN")} overdue — pay immediately. Late fee applies after 5th.`
                    : tenant.paymentStatus === "Partial"
                    ? `Balance ₹${balance.toLocaleString("en-IN")} pending of ₹${tenant.monthlyDue.toLocaleString("en-IN")} due.`
                    : tenant.paymentStatus === "Pending approval"
                    ? `Awaiting approval before reminders can be sent.`
                    : `Reminder: pay ₹${tenant.monthlyDue.toLocaleString("en-IN")} before the 5th of every month.`}
                </p>

                {tenant.paymentStatus !== "Paid" && (
                  <div className="flex gap-2 mt-2">
                    <Link href={`/admin/tenant/${tenant.id}`}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: "#1B4FBB", color: "#fff", textDecoration: "none" }}>
                      View tenant →
                    </Link>
                    {!tenant.approved && (
                      <Link href="/tenant-approvals"
                        className="text-xs px-2.5 py-1 rounded-lg font-medium"
                        style={{ background: "#F0C040", color: "#1339A0", textDecoration: "none" }}>
                        Approve →
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
