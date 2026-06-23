"use client";

// app/admin/page.tsx
//
// The profile button/popup on this page was a SEPARATE hardcoded widget
// from components/dashboard/Sidebar.tsx — that's why fixing the sidebar
// earlier didn't fix this one. Now uses real Supabase Auth + profiles
// data, with an Edit option for Role, Buildings, and Member since.

import Link from "next/link";
import { useState, useEffect } from "react";
import { properties, getTotalFlats, getTotalOccupied, getTotalCollection, getOverdueCount } from "@/data/properties";
import { tenants } from "@/data/tenants";
import { collections } from "@/data/collections";
import { supabase } from "@/lib/supabaseClient";
import {
  Wallet, TrendingUp, Users, ArrowRight, CheckCircle,
  AlertTriangle, Brain, CreditCard, Bell, ShieldCheck,
  FileText, Building2, LogOut, X, Mail, Calendar, Pencil, Save,
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
  ...thisMonth.filter((c) => c.paidOn)
    .sort((a, b) => (b.paidOn ?? "").localeCompare(a.paidOn ?? ""))
    .slice(0, 4)
    .map((c) => ({ type: "payment" as const, label: `${c.tenantName} paid ₹${c.amount.toLocaleString("en-IN")}`, sub: `${c.building} · Flat ${c.flatNo} · ${c.paidOn}`, color: "#1D9E75" })),
  ...overdueTenants.slice(0, 2).map((t) => ({ type: "alert" as const, label: `${t.name} — rent overdue`, sub: `${t.building} · Flat ${t.flatNo} · ₹${t.monthlyDue.toLocaleString("en-IN")} due`, color: "#E24B4A" })),
].slice(0, 5);

const aiRecs = [
  { title: `Send final notice to ${overdueTenants[0]?.name ?? "overdue tenant"}`, desc: `${overdueTenants[0]?.building ?? ""} · Flat ${overdueTenants[0]?.flatNo ?? ""} — 12 days overdue, 78% non-payment risk.`, action: "/admin/reminders", actionLabel: "Send reminder", bg: "#FCEBEB", border: "#F7C1C1", titleColor: "#791F1F" },
  { title: `${pendingTenants.length} tenant${pendingTenants.length !== 1 ? "s" : ""} awaiting approval`, desc: "New tenants submitted via Google Form. Approve to grant login access.", action: "/admin/approvals", actionLabel: "Review approvals", bg: "#FAEEDA", border: "#FAC775", titleColor: "#633806" },
  { title: "Schedule July pre-reminders", desc: "AI suggests sending pre-reminders on June 25 based on tenant response patterns.", action: "/admin/reminders", actionLabel: "Schedule", bg: "#f4ede1", border: "rgba(214,176,109,0.35)", titleColor: "#232f4f" },
];

type AdminProfile = {
  name: string;
  email: string;
  role: string;
  buildings: string | null;
  member_since: string | null;
};

export default function AdminDashboard() {
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ role: "", buildings: "", member_since: "" });
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, role, buildings, member_since")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          name: data.name ?? user.email ?? "Unknown",
          email: user.email ?? "",
          role: data.role ?? "admin",
          buildings: data.buildings,
          member_since: data.member_since,
        });
      }
    }
    loadProfile();
  }, []);

  const initials = profile?.name
    ? profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "—";

  function startEdit() {
    if (!profile) return;
    setEditForm({
      role: profile.role,
      buildings: profile.buildings ?? "",
      member_since: profile.member_since ?? "",
    });
    setSaveError("");
    setEditing(true);
  }
  async function saveProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaveError("");

    const { error } = await supabase
      .from("profiles")
      .update({
        role: editForm.role,
        buildings: editForm.buildings,
        member_since: editForm.member_since || null,
      })
      .eq("id", user.id);

    if (error) {
      setSaveError(error.message);
      return;
    }

    setProfile((prev) => prev ? { ...prev, role: editForm.role, buildings: editForm.buildings, member_since: editForm.member_since } : prev);
    setEditing(false);
    setSaved(`Saved at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setSaved(""), 3000);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#18233c" }}>Admin Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            June 2026 · {properties.length} buildings · {getTotalOccupied()} of {getTotalFlats()} flats occupied
          </p>
        </div>
        <button onClick={() => setShowProfile(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)", color: "#18233c" }}>
          {initials}
        </button>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4"
          style={{ background: "rgba(0,0,0,0.3)" }} onClick={() => { setShowProfile(false); setEditing(false); }}>
          <div className="rounded-2xl p-5 w-80 mt-14 mr-2"
            style={{ background: "rgba(255,255,255,0.94)", border: "1px solid rgba(35,47,79,0.16)", boxShadow: "0 18px 40px rgba(24,35,60,0.08)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>My profile</span>
              <div className="flex items-center gap-2">
                {!editing && (
                  <button onClick={startEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#b8924c" }}>
                    <Pencil size={14} />
                  </button>
                )}
                <button onClick={() => { setShowProfile(false); setEditing(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}><X size={16} /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid rgba(35,47,79,0.1)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)", color: "#18233c" }}>{initials}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>{profile?.name ?? "Loading..."}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(214,176,109,0.16)", color: "#232f4f" }}>
                  {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : ""}
                </span>
              </div>
            </div>

            {!editing ? (
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2.5">
                  <Mail size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                  <div><p className="text-xs" style={{ color: "#9CA3AF" }}>Email</p><p className="text-xs font-medium" style={{ color: "#111827" }}>{profile?.email ?? "—"}</p></div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Building2 size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                  <div><p className="text-xs" style={{ color: "#9CA3AF" }}>Buildings</p><p className="text-xs font-medium" style={{ color: "#111827" }}>{profile?.buildings || "—"}</p></div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Calendar size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                  <div><p className="text-xs" style={{ color: "#9CA3AF" }}>Member since</p><p className="text-xs font-medium" style={{ color: "#111827" }}>{profile?.member_since ?? "—"}</p></div>
                </div>
                {saved && <p className="text-xs" style={{ color: "#0F6E56" }}>{saved}</p>}
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Role</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(35,47,79,0.2)", color: "#111827" }}>
                    <option value="admin">Admin</option>
                    <option value="owner">Owner</option>
                    <option value="tenant">Tenant</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Buildings (comma-separated)</label>
                  <input value={editForm.buildings} onChange={(e) => setEditForm({ ...editForm, buildings: e.target.value })}
                    placeholder="e.g. Ohm, NN Elite, RVB"
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(35,47,79,0.2)", color: "#111827", outline: "none" }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Member since</label>
                  <input type="date" value={editForm.member_since} onChange={(e) => setEditForm({ ...editForm, member_since: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(35,47,79,0.2)", color: "#111827", outline: "none" }} />
                </div>
                {saveError && <p className="text-xs" style={{ color: "#A32D2D" }}>{saveError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ background: "#F3F4F6", color: "#6B7280", border: "1px solid rgba(35,47,79,0.12)", cursor: "pointer" }}>
                    Cancel
                  </button>
                  <button onClick={saveProfile}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold" style={{ background: "#232f4f", color: "#fff", border: "none", cursor: "pointer" }}>
                    <Save size={12} /> Save
                  </button>
                </div>
              </div>
            )}

            {!editing && (
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "linear-gradient(135deg, #232f4f, #18233c)", color: "#fff", border: "none", cursor: "pointer" }}>
                <LogOut size={14} /> Sign out
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Wallet size={13} /> Total rent</div>
          <div className="text-2xl font-semibold" style={{ color: "#111827" }}>₹{(totalRent/100000).toFixed(1)}L</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>June 2026 · {properties.length} buildings</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.88)", border: "2px solid #d6b06d" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><TrendingUp size={13} /> Collected</div>
          <div className="text-2xl font-semibold" style={{ color: "#0F6E56" }}>₹{(collected/100000).toFixed(1)}L</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{collectionPct}% collection rate</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "#fbeee2", border: "1.5px solid #e5c8a4" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><AlertTriangle size={13} /> Outstanding</div>
          <div className="text-2xl font-semibold" style={{ color: "#A32D2D" }}>₹{(outstanding/100000).toFixed(1)}L</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{getOverdueCount()} flats overdue</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Users size={13} /> Tenants</div>
          <div className="text-2xl font-semibold" style={{ color: "#111827" }}>{activeTenants.length}</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{pendingTenants.length} pending approval</div>
        </div>
      </div>

      {/* Rent status progress */}
      <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.92)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "#111827" }}>June 2026 rent status</span>
          <span className="text-sm font-semibold" style={{ color: "#0F6E56" }}>{collectionPct}% collected</span>
        </div>
        <div className="h-2.5 rounded-full mb-2" style={{ background: "#E5E7EB" }}>
          <div className="h-full rounded-full" style={{ width: `${collectionPct}%`, background: collectionPct >= 80 ? "#1D9E75" : collectionPct >= 50 ? "#EF9F27" : "#E24B4A" }} />
        </div>
        <div className="flex gap-6 text-xs" style={{ color: "#9CA3AF" }}>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#1D9E75" }} />Paid ₹{collected.toLocaleString("en-IN")}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#E24B4A" }} />Outstanding ₹{outstanding.toLocaleString("en-IN")}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#9CA3AF" }} />{getTotalFlats()} total flats</span>
        </div>
      </div>

      {/* AI + Active tenants */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.92)", border: "2px solid #d6b06d" }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} style={{ color: "#232f4f" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>AI recommendations</h2>
          </div>
          <div className="space-y-3">
            {aiRecs.map((rec, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-lg"
                style={{ background: rec.bg, border: `1.5px solid ${rec.border}` }}>
                <div className="flex-1">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: rec.titleColor }}>{rec.title}</p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>{rec.desc}</p>
                </div>
                <Link href={rec.action} className="text-xs px-2.5 py-1.5 rounded-lg font-medium flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #232f4f, #18233c)", color: "#fff", textDecoration: "none" }}>
                  {rec.actionLabel} →
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.92)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={15} style={{ color: "#232f4f" }} />
              <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Active tenants</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f3ead8", color: "#6b4b16" }}>{activeTenants.length} active</span>
          </div>
          {activeTenants.slice(0, 5).map((t, i) => (
            <Link key={t.id} href={`/admin/tenants`}
              className="flex items-center gap-2.5 py-2 group"
              style={{ borderBottom: i < Math.min(activeTenants.length,5)-1 ? "1px solid rgba(35,47,79,0.07)" : "none", textDecoration: "none" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: "rgba(214,176,109,0.18)", color: "#232f4f" }}>
                {t.name.split(" ").map((n) => n[0]).join("").slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:underline" style={{ color: "#111827" }}>{t.name}</p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{t.building} · {t.flatNo}</p>
              </div>
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                style={{ background: t.paymentStatus==="Paid"?"#E1F5EE":t.paymentStatus==="Overdue"?"#FCEBEB":"#FAEEDA", color: t.paymentStatus==="Paid"?"#085041":t.paymentStatus==="Overdue"?"#791F1F":"#633806" }}>
                {t.paymentStatus}
              </span>
            </Link>
          ))}
          <Link href="/admin/tenants" className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#b8924c", textDecoration: "none" }}>
            View all tenants <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Recent activity + Quick actions */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.92)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Recent activity</h2>
            <Link href="/admin/payments" className="text-xs font-medium" style={{ color: "#b8924c" }}>All transactions →</Link>
          </div>
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-start gap-3 py-2.5"
              style={{ borderBottom: i < recentActivity.length-1 ? "1px solid rgba(27,79,187,0.07)" : "none" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: a.color+"18" }}>
                {a.type==="payment" ? <CheckCircle size={12} style={{ color: a.color }} /> : <AlertTriangle size={12} style={{ color: a.color }} />}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "#111827" }}>{a.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{a.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.92)", border: "2px solid #d6b06d" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "#111827" }}>Quick actions</h2>
          <div className="space-y-2">
            {[
              { label: "Properties",     href: "/admin/properties",  icon: Building2,   bg: "#E8F0FE", text: "#1B4FBB" },
              { label: "All tenants",    href: "/admin/tenants",     icon: Users,       bg: "#E1F5EE", text: "#085041" },
              { label: "Review approvals",href:"/admin/approvals",   icon: ShieldCheck, bg: "#FAEEDA", text: "#633806" },
              { label: "Payments",       href: "/admin/payments",    icon: CreditCard,  bg: "#E6F1FB", text: "#0C447C" },
              { label: "Expenditure",    href: "/admin/expenditure", icon: FileText,    bg: "#EEEDFE", text: "#26215C" },
              { label: "Reminders",      href: "/admin/reminders",   icon: Bell,        bg: "#FCEBEB", text: "#791F1F" },
            ].map(({ label, href, icon: Icon, bg, text }) => (
              <Link key={label} href={href} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium group"
                style={{ background: bg, color: text, textDecoration: "none" }}>
                <Icon size={13} /><span className="flex-1">{label}</span>
                <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
