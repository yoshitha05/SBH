"use client";

import Link from "next/link";
import { useState } from "react";
import { properties, getTotalFlats, getTotalOccupied, getTotalCollection } from "@/data/properties";
import { tenants } from "@/data/tenants";
import { collections } from "@/data/collections";
import {
  Wallet, TrendingUp, Users, ArrowRight,
  CheckCircle, AlertTriangle, Brain,
  CreditCard, Bell, ShieldCheck, FileText,
  Building2, LogOut, X,
} from "lucide-react";

const thisMonth      = collections.filter((c) => c.month === "Jun 2026");
const totalRent      = thisMonth.reduce((s, c) => s + c.amount, 0);
const collected      = thisMonth.filter((c) => c.status === "paid").reduce((s, c) => s + c.amount, 0);
const outstanding    = thisMonth.filter((c) => c.status !== "paid").reduce((s, c) => s + c.amount, 0);
const overdueTenants = tenants.filter((t) => t.paymentStatus === "Overdue");
const pendingTenants = tenants.filter((t) => !t.approved);
const activeTenants  = tenants.filter((t) => t.approved && t.accessEnabled);
const collectionPct  = totalRent > 0 ? Math.round((collected / totalRent) * 100) : 0;

const recentActivity = [
  ...thisMonth
    .filter((c) => c.paidOn)
    .sort((a, b) => (b.paidOn ?? "").localeCompare(a.paidOn ?? ""))
    .slice(0, 4)
    .map((c) => ({
      type: "payment" as const,
      label: `${c.tenantName} paid ₹${c.amount.toLocaleString("en-IN")}`,
      sub: `${c.building} · Flat ${c.flatNo} · ${c.paidOn}`,
      color: "#1D9E75",
    })),
  ...overdueTenants.slice(0, 2).map((t) => ({
    type: "alert" as const,
    label: `${t.name} — rent overdue`,
    sub: `${t.building} · Flat ${t.flatNo} · ₹${t.monthlyDue.toLocaleString("en-IN")} due`,
    color: "#E24B4A",
  })),
].slice(0, 5);

const aiRecommendations = [
  {
    title: `Send final notice to ${overdueTenants[0]?.name ?? "overdue tenant"}`,
    desc: `${overdueTenants[0]?.building ?? ""} · Flat ${overdueTenants[0]?.flatNo ?? ""} — 12 days overdue, 78% non-payment risk.`,
    action: "/owner/reminders", actionLabel: "Send reminder",
    bg: "#FCEBEB", border: "#F7C1C1", titleColor: "#791F1F",
  },
  {
    title: `${pendingTenants.length} tenant${pendingTenants.length !== 1 ? "s" : ""} awaiting approval`,
    desc: "New tenants submitted via Google Form. Approve to grant login access.",
    action: "/owner/approvals", actionLabel: "Review approvals",
    bg: "#FAEEDA", border: "#FAC775", titleColor: "#633806",
  },
  {
    title: "Schedule July pre-reminders",
    desc: "AI suggests sending pre-reminders on June 25 based on tenant response patterns.",
    action: "/owner/reminders", actionLabel: "Schedule",
    bg: "#E8F0FE", border: "rgba(27,79,187,0.2)", titleColor: "#1B4FBB",
  },
];

const ownerDetails = {
  initials: "SR", name: "Suresh Reddy", role: "Owner",
  email: "owner@leaseiq.com", phone: "+91 98765 00000",
  buildings: properties.map((p) => p.name).join(", "),
  totalFlats: getTotalFlats(), joined: "January 2024",
};

export default function OwnerDashboard() {
  const [showProfile, setShowProfile] = useState(false);

  function handleLogout() {
    document.cookie = "leaseiq_role=; path=/; max-age=0";
    window.location.href = "/login";
  }

  return (
    <div className="p-6 max-w-7xl mx-auto relative">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            June 2026 · {properties.length} buildings · {getTotalOccupied()} of {getTotalFlats()} flats occupied
          </p>
        </div>
        <button onClick={() => setShowProfile(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ background: "#F0C040", color: "#1339A0" }}>
          {ownerDetails.initials}
        </button>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4"
          style={{ background: "rgba(0,0,0,0.3)" }}
          onClick={() => setShowProfile(false)}>
          <div className="rounded-2xl p-5 w-72 mt-14 mr-2"
            style={{ background: "#fff", border: "2px solid #1B4FBB", boxShadow: "0 8px 32px rgba(0,0,0,0.15)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>My profile</span>
              <button onClick={() => setShowProfile(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={16} />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4 pb-4"
              style={{ borderBottom: "1px solid rgba(27,79,187,0.1)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold"
                style={{ background: "#F0C040", color: "#1339A0" }}>
                {ownerDetails.initials}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>{ownerDetails.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#E8F0FE", color: "#1B4FBB" }}>{ownerDetails.role}</span>
              </div>
            </div>
            <div className="space-y-2.5 mb-4">
              {[
                { label: "Email",        value: ownerDetails.email },
                { label: "Phone",        value: ownerDetails.phone },
                { label: "Buildings",    value: ownerDetails.buildings },
                { label: "Total flats",  value: String(ownerDetails.totalFlats) },
                { label: "Member since", value: ownerDetails.joined },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{label}</p>
                  <p className="text-xs font-medium" style={{ color: "#111827" }}>{value}</p>
                </div>
              ))}
            </div>
            <button onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium"
              style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-lg p-4" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <Wallet size={13} /> Total rent
          </div>
          <div className="text-2xl font-semibold" style={{ color: "#111827" }}>
            ₹{(totalRent / 100000).toFixed(1)}L
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>June 2026 · {properties.length} buildings</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "#F5F7FB", border: "2px solid #F0C040" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <TrendingUp size={13} /> Collected
          </div>
          <div className="text-2xl font-semibold" style={{ color: "#0F6E56" }}>
            ₹{(collected / 100000).toFixed(1)}L
          </div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{collectionPct}% collection rate</div>
        </div>
      </div>

      {/* Collection progress */}
      <div className="rounded-xl p-4 mb-6" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "#111827" }}>June 2026 collection progress</span>
          <span className="text-sm font-semibold" style={{ color: "#0F6E56" }}>{collectionPct}%</span>
        </div>
        <div className="h-2 rounded-full mb-2" style={{ background: "#E5E7EB" }}>
          <div className="h-full rounded-full" style={{ width: `${collectionPct}%`, background: collectionPct >= 80 ? "#1D9E75" : collectionPct >= 50 ? "#EF9F27" : "#E24B4A" }} />
        </div>
        <div className="flex gap-4 text-xs" style={{ color: "#9CA3AF" }}>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#1D9E75" }} />Paid ₹{collected.toLocaleString("en-IN")}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#E24B4A" }} />Outstanding ₹{outstanding.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* AI + Active tenants */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "#fff", border: "2px solid #F0C040" }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} style={{ color: "#1B4FBB" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>AI recommendations</h2>
          </div>
          <div className="space-y-3">
            {aiRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg"
                style={{ background: rec.bg, border: `1.5px solid ${rec.border}` }}>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: rec.titleColor }}>{rec.title}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{rec.desc}</p>
                </div>
                <Link href={rec.action}
                  className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex-shrink-0"
                  style={{ background: "#1B4FBB", color: "#fff", textDecoration: "none" }}>
                  {rec.actionLabel} →
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: "#1B4FBB" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Active tenants</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: "#E1F5EE", color: "#085041" }}>
              {activeTenants.length} active
            </span>
          </div>
          {activeTenants.slice(0, 5).map((t, i) => (
            <Link key={t.id} href={`/owner/tenant/${t.id}`}
              className="flex items-center gap-2.5 py-2 group"
              style={{ borderBottom: i < Math.min(activeTenants.length, 5) - 1 ? "1px solid rgba(27,79,187,0.07)" : "none", textDecoration: "none" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                style={{ background: "#E8F0FE", color: "#1B4FBB" }}>
                {t.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:underline" style={{ color: "#111827" }}>{t.name}</p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{t.building} · {t.flatNo}</p>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{
                  background: t.paymentStatus === "Paid" ? "#E1F5EE" : t.paymentStatus === "Overdue" ? "#FCEBEB" : "#FAEEDA",
                  color: t.paymentStatus === "Paid" ? "#085041" : t.paymentStatus === "Overdue" ? "#791F1F" : "#633806",
                }}>
                {t.paymentStatus}
              </span>
            </Link>
          ))}
          {activeTenants.length > 5 && (
            <Link href="/owner/tenants" className="flex items-center gap-1 mt-3 text-xs font-medium"
              style={{ color: "#1B4FBB", textDecoration: "none" }}>
              View all {activeTenants.length} <ArrowRight size={11} />
            </Link>
          )}
        </div>
      </div>

      {/* Recent activity + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Recent activity</h2>
            <Link href="/owner/payments" className="text-xs font-medium" style={{ color: "#1B4FBB" }}>All transactions →</Link>
          </div>
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5"
              style={{ borderBottom: i < recentActivity.length - 1 ? "1px solid rgba(27,79,187,0.07)" : "none" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: a.color + "18" }}>
                {a.type === "payment" ? <CheckCircle size={12} style={{ color: a.color }} /> : <AlertTriangle size={12} style={{ color: a.color }} />}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#111827" }}>{a.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{a.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-5" style={{ background: "#fff", border: "2px solid #F0C040" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: "View properties",  href: "/owner/properties", icon: Building2,   bg: "#E8F0FE", text: "#1B4FBB" },
              { label: "Review approvals", href: "/owner/approvals",  icon: ShieldCheck, bg: "#FAEEDA", text: "#633806" },
              { label: "View payments",    href: "/owner/payments",   icon: CreditCard,  bg: "#E1F5EE", text: "#085041" },
              { label: "View reminders",   href: "/owner/reminders",  icon: Bell,        bg: "#FCEBEB", text: "#791F1F" },
              { label: "Download report",  href: "/owner/payments",   icon: FileText,    bg: "#E8F0FE", text: "#1B4FBB" },
            ].map(({ label, href, icon: Icon, bg, text }) => (
              <Link key={label} href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium group"
                style={{ background: bg, color: text, textDecoration: "none" }}>
                <Icon size={13} />
                <span className="flex-1">{label}</span>
                <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}