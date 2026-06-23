"use client";

// app/admin/forecast/page.tsx — AI Insights
//
// Converted to real data. Two changes from the original design:
//
// 1. The plain-language summary now reads from real Supabase tables
//    (payment_history, tenants, expenditure) instead of static fake data.
//
// 2. Anomaly detection (comparing this month vs a historical average) is
//    intentionally DEFERRED — with only days of real expenditure data so
//    far, any "historical average" would just equal this month's number,
//    making every comparison show 0% and implying a check that isn't
//    really happening yet. Instead, this shows a simple per-building
//    spend breakdown for the current period, with a clear note that
//    anomaly comparison will return once a few real months of data exist.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Brain, AlertTriangle, TrendingUp, RefreshCw, Sparkles, Loader2, Building2 } from "lucide-react";

type BuildingSpend = { building: string; total: number; count: number };

export default function AdminForecastPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Just now");

  const [summaryPoints, setSummaryPoints] = useState<string[]>([]);
  const [buildingSpend, setBuildingSpend] = useState<BuildingSpend[]>([]);
  const [monthsOfData, setMonthsOfData] = useState(0);

  async function loadInsights() {
    setLoading(true);
    setLoadError("");

    try {
      const [
        { data: properties, error: propError },
        { data: payments, error: payError },
        { data: tenants, error: tenError },
        { data: expenditure, error: expError },
      ] = await Promise.all([
        supabase.from("properties").select("*"),
        supabase.from("payment_history").select("*"),
        supabase.from("tenants").select("*"),
        supabase.from("expenditure").select("*, properties(name)"),
      ]);

      if (propError) throw propError;
      if (payError) throw payError;
      if (tenError) throw tenError;
      if (expError) throw expError;

      // Collection summary — current month, found dynamically rather
      // than a hardcoded "Jun 2026" string.
      const monthCounts = new Map<string, number>();
      (payments ?? []).forEach((p) => monthCounts.set(p.month, (monthCounts.get(p.month) ?? 0) + 1));
      const currentMonth = [...monthCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const thisMonthPayments = currentMonth ? (payments ?? []).filter((p) => p.month === currentMonth) : [];
      const totalRent = thisMonthPayments.reduce((s, p) => s + p.amount, 0);
      const collected = thisMonthPayments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
      const collectionPct = totalRent > 0 ? Math.round((collected / totalRent) * 100) : 0;

      const overdueTenantIds = new Set(thisMonthPayments.filter((p) => p.status === "Late").map((p) => p.tenant_id));
      const overdueList = (tenants ?? []).filter((t) => overdueTenantIds.has(t.id));
      const pendingList = (tenants ?? []).filter((t) => !t.approved);

      const totalExpense = (expenditure ?? []).reduce((s, e) => s + e.amount, 0);

      // Distinct months present in expenditure, to know how much real
      // history actually exists.
      const expMonths = new Set((expenditure ?? []).map((e) => e.date?.slice(0, 7)));
      setMonthsOfData(expMonths.size);

      const points = [
        currentMonth
          ? `Collection rate for ${currentMonth} is ${collectionPct}% — ₹${collected.toLocaleString("en-IN")} of ₹${totalRent.toLocaleString("en-IN")} collected across ${(properties ?? []).length} buildings.`
          : `No payment records yet — add some on the Payments page to see a collection summary here.`,
        overdueList.length > 0
          ? `${overdueList.length} tenant${overdueList.length > 1 ? "s are" : " is"} currently marked Late: ${overdueList.map((t) => `${t.name} (${t.building})`).join(", ")}.`
          : `No tenants are currently marked Late — all tracked payments are on time.`,
        pendingList.length > 0
          ? `${pendingList.length} tenant${pendingList.length > 1 ? "s" : ""} ${pendingList.length > 1 ? "are" : "is"} awaiting approval.`
          : `No pending tenant approvals.`,
        `Total expenditure recorded so far is ₹${totalExpense.toLocaleString("en-IN")} across ${(expenditure ?? []).length} entries.`,
      ];
      setSummaryPoints(points);

      // Simple per-building spend breakdown for the current period —
      // see note at top of file on why this isn't an anomaly comparison yet.
      const byBuilding = new Map<string, BuildingSpend>();
      (expenditure ?? []).forEach((e: any) => {
        const name = e.properties?.name ?? "Unknown building";
        const existing = byBuilding.get(name) ?? { building: name, total: 0, count: 0 };
        existing.total += e.amount;
        existing.count += 1;
        byBuilding.set(name, existing);
      });
      setBuildingSpend([...byBuilding.values()].sort((a, b) => b.total - a.total));

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      setLoadError(err.message ?? "Something went wrong loading insights.");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadInsights();
  }, []);

  async function refresh() {
    setRefreshing(true);
    await loadInsights();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading insights from database...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load insights from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2" style={{ color: "#111827" }}>
            <Brain size={22} style={{ color: "#1B4FBB" }} /> AI Insights
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            A plain-language summary of this month — generated from your live data
          </p>
        </div>
        <button onClick={refresh}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
          style={{ background: "#F0C040", color: "#1339A0", border: "none", cursor: "pointer" }}>
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Natural language summary */}
      <div className="rounded-xl p-5 mb-6" style={{ background: "#fff", border: "2px solid #F0C040" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: "#1B4FBB" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>This month at a glance</h2>
          </div>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>Updated {lastUpdated}</span>
        </div>
        <div className="space-y-2.5">
          {summaryPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#1B4FBB" }} />
              <p className="text-sm" style={{ color: "#374151", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid rgba(27,79,187,0.1)", color: "#9CA3AF" }}>
          This summary is generated directly from your real payments, tenants, and expenditure records — not a prediction, just a plain-language readout of current data.
        </div>
      </div>

      {/* Per-building spend breakdown */}
      <div className="rounded-xl p-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={16} style={{ color: "#1B4FBB" }} />
          <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Spend by building</h2>
        </div>

        {buildingSpend.length === 0 ? (
          <div className="text-center py-10" style={{ color: "#9CA3AF" }}>
            <TrendingUp size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No expenditure recorded yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {buildingSpend.map((b) => (
              <div key={b.building} className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "#F5F7FB", border: "1px solid rgba(27,79,187,0.1)" }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{b.building}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{b.count} entr{b.count === 1 ? "y" : "ies"}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: "#1B4FBB" }}>
                  ₹{b.total.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid rgba(27,79,187,0.1)", color: "#9CA3AF" }}>
          {monthsOfData < 2
            ? `Showing current spend per building. Anomaly detection (flagging unusual spending vs historical average) will return automatically once a few more months of real expenditure data exist — right now there's only ${monthsOfData} month${monthsOfData === 1 ? "" : "s"} of data, not enough for a meaningful comparison.`
            : `Showing current spend per building across ${monthsOfData} months of real data.`}
        </div>
      </div>
    </div>
  );
}
