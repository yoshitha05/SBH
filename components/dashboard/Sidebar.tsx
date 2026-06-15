"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Bell,
  BrainCircuit,
  Settings,
  FileText,
  AlertTriangle,
  Wallet,
  ShieldCheck,
  FileSpreadsheet,
  ReceiptText,
  LogIn,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  href: string;
};

const roleMenus: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/owner" },
    { label: "Properties", icon: Building2, href: "/owner/properties" },
    { label: "Tenants", icon: Users, href: "/owner/tenants" },
    { label: "Payments", icon: Wallet, href: "/collections" },
    { label: "Expenditure", icon: FileSpreadsheet, href: "/expenditure" },
    { label: "Approvals", icon: ShieldCheck, href: "/tenant-approvals" },
    { label: "Reminders", icon: Bell, href: "/reminders" },
    { label: "Reports", icon: FileText, href: "/reports" },
    { label: "Risk Board", icon: AlertTriangle, href: "/risk-board" },
    { label: "AI Insights", icon: BrainCircuit, href: "/forecast" },
  ],
  owner: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/owner" },
    { label: "Properties", icon: Building2, href: "/owner/properties" },
    { label: "Tenants", icon: Users, href: "/owner/tenants" },
    { label: "Payments", icon: CreditCard, href: "/collections" },
    { label: "Approvals", icon: ShieldCheck, href: "/tenant-approvals" },
    { label: "Reminders", icon: Bell, href: "/reminders" },
  ],
  tenant: [
    { label: "My Profile", icon: LayoutDashboard, href: "/tenant" },
    { label: "Payments", icon: CreditCard, href: "/tenant/payments" },
    { label: "Receipt", icon: ReceiptText, href: "/tenant/receipts" },
    { label: "UPI Scan", icon: Wallet, href: "/tenant/payments" },
    { label: "Login", icon: LogIn, href: "/tenant-login" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();

  const role = pathname.startsWith("/tenant")
    ? "tenant"
    : pathname.startsWith("/owner")
    ? "owner"
    : "admin";

  const items = roleMenus[role] || roleMenus["admin"];

  return (
    <aside className="w-72 min-h-screen border-r border-slate-800 bg-[#08111d] p-6 text-white">
      <h1 className="text-3xl font-black text-sky-400 mb-10">RentFlow</h1>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition"
            >
              {Icon && <Icon size={18} />}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
