"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Bell,
  BrainCircuit,
  Settings,
} from "lucide-react";

const items = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Properties",
    icon: Building2,
  },
  {
    label: "Tenants",
    icon: Users,
  },
  {
    label: "Payments",
    icon: CreditCard,
  },
  {
    label: "Reminders",
    icon: Bell,
  },
  {
    label: "AI Insights",
    icon: BrainCircuit,
  },
  {
    label: "Settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside
      className="
      w-72
      min-h-screen
      border-r
      border-slate-800
      bg-[#08111d]
      p-6
      "
    >
      <h1
        className="
        text-3xl
        font-black
        text-sky-400
        mb-10
      "
      >
        RentFlow
      </h1>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href="#"
              className="
              flex
              items-center
              gap-3
              p-3
              rounded-xl
              hover:bg-slate-800
              transition
              "
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}