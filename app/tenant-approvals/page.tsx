"use client";

// app/tenant-approvals/page.tsx
// Single source of truth — both /admin/approvals and /owner/approvals re-export this
//
// Converted to Supabase: reads/writes the real tenants table. "Denied"
// doesn't have a dedicated status in the schema, so it's represented the
// same way as "vacated" — approved=false/true with access_enabled=false
// — distinguished here by whether they were ever approved at all.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import {
  ShieldCheck, UserX, Eye, CheckCircle,
  XCircle, Clock, Users, AlertTriangle, Loader2,
} from "lucide-react";

type ApprovalStatus = "pending" | "approved" | "denied" | "vacated";

type TenantRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  building: string;
  flat_no: string;
  move_in_date: string | null;
  id_proof: string | null;
  emergency_contact: string | null;
  access_enabled: boolean;
  approved: boolean;
  status: string;
};

function deriveStatus(t: TenantRow): ApprovalStatus {
  if (!t.approved) return "pending";
  if (t.access_enabled) return "approved";
  // Approved at some point but access disabled now: vacated (status
  // "vacated" set explicitly) vs denied (never had real tenancy).
  return t.status === "vacated" ? "vacated" : "denied";
}

export default function TenantApprovalsPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState<"pending" | "active" | "vacated">("pending");

  async function loadTenants() {
    setLoading(true);
    setLoadError("");
    const { data, error } = await supabase.from("tenants").select("*").order("name");
    if (error) {
      setLoadError(error.message);
    } else {
      setTenants(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadTenants();
  }, []);

  const withStatus = tenants.map((t) => ({ ...t, derivedStatus: deriveStatus(t) }));
  const pending = withStatus.filter((t) => t.derivedStatus === "pending");
  const active = withStatus.filter((t) => t.derivedStatus === "approved");
  const vacated = withStatus.filter((t) => t.derivedStatus === "vacated" || t.derivedStatus === "denied");

  async function approve(t: TenantRow) {
    const { error } = await supabase
      .from("tenants")
      .update({ approved: true, access_enabled: true })
      .eq("id", t.id);
    if (error) {
      alert(`Couldn't approve: ${error.message}`);
      return;
    }
    setTenants((prev) => prev.map((row) => row.id === t.id ? { ...row, approved: true, access_enabled: true } : row));
  }

  async function deny(t: TenantRow) {
    if (!confirm(`Deny ${t.name}'s access request?`)) return;
    // Denied = never approved, access stays off. We mark approved=true
    // (so they leave the "pending" bucket) but access_enabled=false and
    // status left as-is (not "vacated"), so deriveStatus reads it as denied.
    const { error } = await supabase
      .from("tenants")
      .update({ approved: true, access_enabled: false })
      .eq("id", t.id);
    if (error) {
      alert(`Couldn't deny: ${error.message}`);
      return;
    }
    setTenants((prev) => prev.map((row) => row.id === t.id ? { ...row, approved: true, access_enabled: false } : row));
  }

  async function vacate(t: TenantRow) {
    if (!confirm(`Vacate ${t.name}? This disables login immediately. This does not delete their record.`)) return;
    const { error } = await supabase
      .from("tenants")
      .update({ access_enabled: false, status: "vacated" })
      .eq("id", t.id);
    if (error) {
      alert(`Couldn't vacate: ${error.message}`);
      return;
    }
    setTenants((prev) => prev.map((row) => row.id === t.id ? { ...row, access_enabled: false, status: "vacated" } : row));
  }

  async function reEnable(t: TenantRow) {
    const { error } = await supabase
      .from("tenants")
      .update({ approved: true, access_enabled: true, status: "occupied" })
      .eq("id", t.id);
    if (error) {
      alert(`Couldn't re-enable: ${error.message}`);
      return;
    }
    setTenants((prev) => prev.map((row) => row.id === t.id ? { ...row, approved: true, access_enabled: true, status: "occupied" } : row));
  }

  const displayed = tab === "pending" ? pending : tab === "active" ? active : vacated;

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading tenants from database...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load tenants from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
          Approvals
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Approve new tenants, manage login access, and process vacating
        </p>
      </div>

      {/* Metric tab cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            id: "pending" as const, icon: Clock, label: "Pending approval",
            count: pending.length, val: "#854F0B", sub: "Awaiting review",
            activeBg: "#FAEEDA", activeBorder: "2px solid #F0C040",
          },
          {
            id: "active" as const, icon: CheckCircle, label: "Active tenants",
            count: active.length, val: "#0F6E56", sub: "Login enabled",
            activeBg: "#E1F5EE", activeBorder: "2px solid #1D9E75",
          },
          {
            id: "vacated" as const, icon: UserX, label: "Vacated / Denied",
            count: vacated.length, val: "#A32D2D", sub: "Access disabled",
            activeBg: "#FCEBEB", activeBorder: "2px solid #E24B4A",
          },
        ].map(({ id, icon: Icon, label, count, val, sub, activeBg, activeBorder }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="rounded-lg p-3 text-left transition"
            style={{
              background: tab === id ? activeBg : "#F5F7FB",
              border: tab === id ? activeBorder : "1.5px solid rgba(27,79,187,0.18)",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
              <Icon size={13} /> {label}
            </div>
            <div className="text-xl font-semibold" style={{ color: val }}>{count}</div>
            <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{sub}</div>
          </button>
        ))}
      </div>

      {/* Pending banner */}
      {pending.length > 0 && tab === "pending" && (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg mb-4 text-sm"
          style={{ background: "#FAEEDA", border: "1.5px solid #FAC775" }}
        >
          <AlertTriangle size={14} style={{ color: "#854F0B", flexShrink: 0 }} />
          <span style={{ color: "#633806" }}>
            <strong>
              {pending.length} tenant{pending.length > 1 ? "s" : ""}
            </strong>{" "}
            awaiting approval.
          </span>
        </div>
      )}

      {/* Tenant cards */}
      <div className="space-y-4">
        {displayed.length === 0 ? (
          <div
            className="text-center py-12 rounded-xl"
            style={{ border: "1.5px solid rgba(27,79,187,0.18)", color: "#9CA3AF" }}
          >
            <Users size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">
              {tab === "pending"
                ? "No pending approvals"
                : tab === "active"
                ? "No active tenants"
                : "No vacated tenants"}
            </p>
          </div>
        ) : (
          displayed.map((tenant) => (
            <div
              key={tenant.id}
              className="rounded-xl p-5"
              style={{
                border:
                  tenant.derivedStatus === "pending"
                    ? "2px solid #F0C040"
                    : tenant.derivedStatus === "approved"
                    ? "1.5px solid rgba(27,79,187,0.18)"
                    : "1.5px solid #F7C1C1",
                background:
                  tenant.derivedStatus === "pending"
                    ? "#FFFBF0"
                    : tenant.derivedStatus === "vacated" || tenant.derivedStatus === "denied"
                    ? "#FFF8F8"
                    : "#fff",
              }}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">

                {/* Left: info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: "#E8F0FE", color: "#1B4FBB" }}
                    >
                      {tenant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <Link
                        href={`/admin/tenant/${tenant.id}`}
                        className="text-sm font-semibold hover:underline"
                        style={{ color: "#1B4FBB" }}
                      >
                        {tenant.name}
                      </Link>
                      <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                        {tenant.building} · Flat {tenant.flat_no} · {tenant.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2">
                    {[
                      { label: "Phone", value: tenant.phone || "—" },
                      { label: "Move-in date", value: tenant.move_in_date ?? "—" },
                      { label: "ID proof", value: tenant.id_proof ?? "—" },
                      { label: "Emergency contact", value: tenant.emergency_contact ?? "—" },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className={label === "Emergency contact" ? "col-span-2 md:col-span-1" : ""}
                      >
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{label}</p>
                        <p className="text-xs font-medium truncate" style={{ color: "#111827" }}>
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex flex-col gap-2 flex-shrink-0 min-w-[144px]">
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium text-center"
                    style={
                      tenant.derivedStatus === "approved"
                        ? { background: "#E1F5EE", color: "#085041", border: "1px solid #9FE1CB" }
                        : tenant.derivedStatus === "pending"
                        ? { background: "#FAEEDA", color: "#633806", border: "1.5px solid #FAC775" }
                        : tenant.derivedStatus === "denied"
                        ? { background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1" }
                        : { background: "#F1EFE8", color: "#5F5E5A", border: "1px solid #D3D1C7" }
                    }
                  >
                    {tenant.derivedStatus === "approved"
                      ? "✓ Active"
                      : tenant.derivedStatus === "pending"
                      ? "⏳ Pending"
                      : tenant.derivedStatus === "denied"
                      ? "✗ Denied"
                      : "Vacated"}
                  </span>

                  {tenant.derivedStatus === "pending" && (
                    <>
                      <button
                        onClick={() => approve(tenant)}
                        className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium w-full"
                        style={{ background: "#E1F5EE", color: "#085041", border: "1px solid #9FE1CB", cursor: "pointer" }}
                      >
                        <CheckCircle size={12} /> Approve login
                      </button>
                      <button
                        onClick={() => deny(tenant)}
                        className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium w-full"
                        style={{ background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1", cursor: "pointer" }}
                      >
                        <XCircle size={12} /> Deny
                      </button>
                    </>
                  )}

                  {tenant.derivedStatus === "approved" && (
                    <>
                      <Link
                        href={`/admin/tenant/${tenant.id}`}
                        className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium w-full"
                        style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", textDecoration: "none" }}
                      >
                        <Eye size={12} /> View profile
                      </Link>
                      <button
                        onClick={() => vacate(tenant)}
                        className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium w-full"
                        style={{ background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1", cursor: "pointer" }}
                      >
                        <UserX size={12} /> Vacate tenant
                      </button>
                    </>
                  )}

                  {(tenant.derivedStatus === "vacated" || tenant.derivedStatus === "denied") && (
                    <>
                      <div
                        className="text-xs text-center px-2 py-1 rounded-lg"
                        style={{ background: "#F1EFE8", color: "#9CA3AF", border: "1px solid #D3D1C7" }}
                      >
                        Access disabled
                      </div>
                      <button
                        onClick={() => reEnable(tenant)}
                        className="flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium w-full"
                        style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", cursor: "pointer" }}
                      >
                        <ShieldCheck size={12} /> Re-enable
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
