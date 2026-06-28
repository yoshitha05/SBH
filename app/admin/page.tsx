"use client";

// app/admin/page.tsx
//
// KPI cards (Total rent, Collected, Outstanding) are now computed live
// from the tenants table's rent + payment_status fields, replacing the
// old payment_history-based numbers — consistent with the per-building
// "Monthly rent" logic. "Quick actions" card removed.

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Wallet, TrendingUp, Users, ArrowRight, CheckCircle,
  AlertTriangle, Brain, Building2, LogOut, X, Mail, Calendar, Pencil, Save, Loader2,
} from "lucide-react";

type AdminProfile = {
  name: string;
  email: string;
  role: string;
  buildings: string | null;
  member_since: string | null;
};

type TenantRow = {
  id: number;
  name: string;
  building: string;
  flat_no: string;
  rent: number;
  payment_status: string | null;
  approved: boolean;
  access_enabled: boolean;
  status: string;
};

export default function AdminDashboard() {
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ role: "", buildings: "", member_since: "" });
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [buildingCount, setBuildingCount] = useState(0);
  const [totalFlats, setTotalFlats] = useState(0);
  const [tenants, setTenants] = useState<TenantRow[]>([]);

  async function loadDashboardData() {
    setLoading(true);
    setLoadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoadError("Not signed in.");
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("name, role, buildings, member_since")
      .eq("id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        name: profileData.name ?? user.email ?? "Unknown",
        email: user.email ?? "",
        role: profileData.role ?? "admin",
        buildings: profileData.buildings,
        member_since: profileData.member_since,
      });
    }

    const { data: properties, error: propError } = await supabase
      .from("properties")
      .select("total_flats")
      .eq("owner_id", user.id);

    if (propError) {
      setLoadError(propError.message);
      setLoading(false);
      return;
    }
    setBuildingCount(properties?.length ?? 0);
    setTotalFlats((properties ?? []).reduce((s, p) => s + (p.total_flats ?? 0), 0));

    const { data: tenantData, error: tenError } = await supabase
      .from("tenants")
      .select("id, name, building, flat_no, rent, payment_status, approved, access_enabled, status")
      .eq("owner_id", user.id);

    if (tenError) {
      setLoadError(tenError.message);
      setLoading(false);
      return;
    }
    setTenants(tenantData ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const initials = profile?.name
    ? profile.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
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

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading dashboard...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load dashboard data</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  // ── KPIs now computed live from the tenants table itself ──
  const totalRent = tenants.reduce((s, t) => s + (t.rent || 0), 0);
  const collected = tenants.filter((t) => t.payment_status === "Paid").reduce((s, t) => s + (t.rent || 0), 0);
  const outstanding = tenants.filter((t) => t.payment_status !== "Paid").reduce((s, t) => s + (t.rent || 0), 0);
  const overdueCount = tenants.filter((t) => t.payment_status === "Overdue").length;
  const collectionPct = totalRent > 0 ? Math.round((collected / totalRent) * 100) : 0;

  const activeTenants = tenants.filter((t) => t.approved && t.access_enabled);
  const pendingTenants = tenants.filter((t) => !t.approved);
  const overdueTenants = tenants.filter((t) => t.payment_status === "Overdue");

  const currentMonthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const firstOverdue = overdueTenants[0];
  const aiRecs = [
    {
      title: firstOverdue ? `Send final notice to ${firstOverdue.name}` : "No overdue tenants this month",
      desc: firstOverdue ? `${firstOverdue.building} · Flat ${firstOverdue.flat_no} — marked Overdue.` : "Everything is on track.",
      action: "/admin/reminders", actionLabel: "Send reminder", bg: "#FCEBEB", border: "#F7C1C1", titleColor: "#791F1F",
    },
    {
      title: `${pendingTenants.length} tenant${pendingTenants.length !== 1 ? "s" : ""} awaiting approval`,
      desc: "New tenants submitted via Google Form. Approve to grant access.",
      action: "/admin/approvals", actionLabel: "Review approvals", bg: "#FAEEDA", border: "#FAC775", titleColor: "#633806",
    },
    {
      title: "Review this month's reminders",
      desc: "Check who's due or overdue and follow up.",
      action: "/admin/reminders", actionLabel: "Open reminders", bg: "#f4ede1", border: "rgba(214,176,109,0.35)", titleColor: "#232f4f",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#18233c" }}>Admin Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            {currentMonthLabel} · {buildingCount} building{buildingCount !== 1 ? "s" : ""} · {activeTenants.length} of {totalFlats} flats occupied
          </p>
        </div>
        <button onClick={() => setShowProfile(true)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
          style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)", color: "#18233c" }}>
          {initials}
        </button>
      </div>

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Wallet size={13} /> Total rent</div>
          <div className="text-2xl font-semibold" style={{ color: "#111827" }}>₹{(totalRent/100000).toFixed(1)}L</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{currentMonthLabel} · {buildingCount} buildings</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.88)", border: "2px solid #d6b06d" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><TrendingUp size={13} /> Collected</div>
          <div className="text-2xl font-semibold" style={{ color: "#0F6E56" }}>₹{(collected/100000).toFixed(1)}L</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{collectionPct}% collection rate</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "#fbeee2", border: "1.5px solid #e5c8a4" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><AlertTriangle size={13} /> Outstanding</div>
          <div className="text-2xl font-semibold" style={{ color: "#A32D2D" }}>₹{(outstanding/100000).toFixed(1)}L</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{overdueCount} tenants overdue</div>
        </div>
        <div className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.88)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}><Users size={13} /> Tenants</div>
          <div className="text-2xl font-semibold" style={{ color: "#111827" }}>{activeTenants.length}</div>
          <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{pendingTenants.length} pending approval</div>
        </div>
      </div>

      <div className="rounded-xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.92)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: "#111827" }}>{currentMonthLabel} rent status</span>
          <span className="text-sm font-semibold" style={{ color: "#0F6E56" }}>{collectionPct}% collected</span>
        </div>
        <div className="h-2.5 rounded-full mb-2" style={{ background: "#E5E7EB" }}>
          <div className="h-full rounded-full" style={{ width: `${collectionPct}%`, background: collectionPct >= 80 ? "#1D9E75" : collectionPct >= 50 ? "#EF9F27" : "#E24B4A" }} />
        </div>
        <div className="flex gap-6 text-xs" style={{ color: "#9CA3AF" }}>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#1D9E75" }} />Paid ₹{collected.toLocaleString("en-IN")}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#E24B4A" }} />Outstanding ₹{outstanding.toLocaleString("en-IN")}</span>
          <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#9CA3AF" }} />{totalFlats} total flats</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        <div className="lg:col-span-2 rounded-xl p-5" style={{ background: "rgba(255,255,255,0.92)", border: "2px solid #d6b06d" }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={16} style={{ color: "#232f4f" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Recommendations</h2>
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
          {activeTenants.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "#9CA3AF" }}>No active tenants yet</p>
          ) : activeTenants.slice(0, 5).map((t, i) => (
            <Link key={t.id} href={`/admin/tenants`}
              className="flex items-center gap-2.5 py-2 group"
              style={{ borderBottom: i < Math.min(activeTenants.length,5)-1 ? "1px solid rgba(35,47,79,0.07)" : "none", textDecoration: "none" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: "rgba(214,176,109,0.18)", color: "#232f4f" }}>
                {t.name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate group-hover:underline" style={{ color: "#111827" }}>{t.name}</p>
                <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{t.building} · {t.flat_no}</p>
              </div>
            </Link>
          ))}
          <Link href="/admin/tenants" className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#b8924c", textDecoration: "none" }}>
            View all tenants <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.92)", border: "1.5px solid rgba(35,47,79,0.14)" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Recent activity</h2>
          <Link href="/admin/payments" className="text-xs font-medium" style={{ color: "#b8924c" }}>All transactions →</Link>
        </div>
        {overdueTenants.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "#9CA3AF" }}>No overdue tenants right now</p>
        ) : overdueTenants.map((t, i) => (
          <div key={t.id} className="flex items-start gap-3 py-2.5"
            style={{ borderBottom: i < overdueTenants.length-1 ? "1px solid rgba(27,79,187,0.07)" : "none" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E24B4A18" }}>
              <AlertTriangle size={12} style={{ color: "#E24B4A" }} />
            </div>
            <div>
              <p className="text-xs font-medium" style={{ color: "#111827" }}>{t.name} — rent overdue</p>
              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{t.building} · Flat {t.flat_no} · ₹{t.rent.toLocaleString("en-IN")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}