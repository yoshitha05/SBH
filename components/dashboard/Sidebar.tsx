"use client";

// components/dashboard/Sidebar.tsx
// Fully monochrome — white sidebar, light gray accents, dark gray/black text.
//
// Now uses real Supabase Auth: signs out via supabase.auth.signOut()
// instead of clearing the old leaseiq_role cookie, and shows the actual
// logged-in user's name/email/role from the profiles table instead of
// hardcoded fake people.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  LayoutDashboard, Building2, Users, CreditCard,
  Bell, BrainCircuit, FileText,
  Wallet, ShieldCheck, FileSpreadsheet, ReceiptText,
  Home, QrCode, LogOut, X, Mail, Calendar,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  href: string;
  badge?: number;
};
type NavGroup = { group: string; items: NavItem[] };

const roleMenus: Record<string, NavGroup[]> = {
  admin: [
    { group: "Overview", items: [
      { label: "Dashboard",   icon: LayoutDashboard, href: "/admin" },
      { label: "Properties",  icon: Building2,       href: "/admin/properties" },
      { label: "Tenants",     icon: Users,           href: "/admin/tenants" },
    ]},
    { group: "Finance", items: [
      { label: "Payments",    icon: Wallet,          href: "/admin/payments" },
      { label: "Expenditure", icon: FileSpreadsheet, href: "/admin/expenditure" },
      { label: "Approvals",   icon: ShieldCheck,     href: "/admin/approvals", badge: 2 },
    ]},
    { group: "Intelligence", items: [
      { label: "Reminders",   icon: Bell,            href: "/admin/reminders",  badge: 3 },
      { label: "Reports",     icon: FileText,        href: "/admin/reports" },
      { label: "AI Insights", icon: BrainCircuit,    href: "/admin/forecast" },
    ]},
  ],
  owner: [
    { group: "My Portfolio", items: [
      { label: "Dashboard",   icon: LayoutDashboard, href: "/owner" },
      { label: "Properties",  icon: Building2,       href: "/owner/properties" },
      { label: "Payments",    icon: CreditCard,      href: "/owner/payments" },
      { label: "Approvals",   icon: ShieldCheck,     href: "/owner/approvals", badge: 1 },
    ]},
    { group: "Actions", items: [
      { label: "Reminders",   icon: Bell,            href: "/owner/reminders", badge: 2 },
    ]},
  ],
  tenant: [
    { group: "My Account", items: [
      { label: "My Home",     icon: Home,            href: "/tenant" },
      { label: "Payments",    icon: CreditCard,      href: "/tenant/payments" },
      { label: "Pay Rent",    icon: QrCode,          href: "/tenant/pay" },
      { label: "Reminders",   icon: Bell,            href: "/tenant/reminders" },
      { label: "Receipts",    icon: ReceiptText,     href: "/tenant/receipts" },
    ]},
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [showProfile, setShowProfile] = useState(false);

  const role: "admin" | "owner" | "tenant" =
    pathname.startsWith("/admin")  ? "admin"  :
    pathname.startsWith("/owner")  ? "owner"  :
    pathname.startsWith("/tenant") ? "tenant" :
    "admin";

  const groups = roleMenus[role];

  // Real logged-in user info, loaded from Supabase Auth + profiles —
  // replaces the old hardcoded userInfoMap fake people.
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string; initials: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle();

      const name = profile?.name ?? user.email ?? "Unknown";
      setUserInfo({
        name,
        email: user.email ?? "",
        role: profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "—",
        initials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
      });
    }
    loadUser();
  }, []);

  async function handleLogout() {
    setShowProfile(false);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function isActive(href: string) {
    if (href === "/admin" || href === "/owner" || href === "/tenant") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <>
      <aside className="w-64 min-h-screen flex flex-col flex-shrink-0"
        style={{ background: "#ffffff", borderRight: "1px solid #E5E7EB" }}>

        {/* Brand */}
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#374151" }}>
            <Home size={14} style={{ color: "#fff" }} />
          </div>
          <span className="font-semibold text-base tracking-tight" style={{ color: "#111827" }}>
            Sree Balaji Hospitalities
          </span>
        </div>

        {/* Role badge */}
        <div className="px-5 pt-4 pb-2">
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: "#F3F4F6", color: "#374151", border: "1px solid #E5E7EB" }}>
            {userInfo?.role ?? role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.group} className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: "#9CA3AF" }}>
                {group.group}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon   = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link key={item.label} href={item.href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150"
                      style={{
                        color:      active ? "#111827" : "#6B7280",
                        background: active ? "#F3F4F6" : "transparent",
                        borderLeft: active ? "3px solid #9CA3AF" : "3px solid transparent",
                        fontWeight: active ? 600 : 400,
                      }}>
                      <Icon size={16} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                          style={{ background: "#6B7280", color: "#fff" }}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-4 py-3" style={{ borderTop: "1px solid #E5E7EB" }}>
          <button onClick={() => setShowProfile(true)}
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg w-full transition"
            style={{ background: "transparent", border: "none", cursor: "pointer" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#F9FAFB"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: "#374151", color: "#fff" }}>
              {userInfo?.initials ?? "—"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium truncate" style={{ color: "#111827" }}>{userInfo?.name ?? "Loading..."}</p>
              <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{userInfo?.role ?? ""}</p>
            </div>
            <LogOut size={14} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          </button>
        </div>
      </aside>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-start"
          style={{ background: "rgba(0,0,0,0.35)" }}
          onClick={() => setShowProfile(false)}>
          <div className="rounded-2xl p-5 m-4 w-72"
            style={{ background: "#fff", border: "1px solid #E5E7EB", boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>My profile</span>
              <button onClick={() => setShowProfile(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: "1px solid #E5E7EB" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold"
                style={{ background: "#374151", color: "#fff" }}>
                {userInfo?.initials ?? "—"}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#111827" }}>{userInfo?.name ?? "Loading..."}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#F3F4F6", color: "#374151" }}>
                  {userInfo?.role ?? ""}
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-start gap-2.5">
                <Mail size={13} style={{ color: "#9CA3AF", flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>Email</p>
                  <p className="text-xs font-medium" style={{ color: "#111827" }}>{userInfo?.email ?? "—"}</p>
                </div>
              </div>
            </div>

            <button onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold"
              style={{ background: "#374151", color: "#fff", border: "none", cursor: "pointer" }}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
