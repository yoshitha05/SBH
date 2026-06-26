"use client";

// app/admin/access-requests/page.tsx
//
// Admin-only page to review pending access requests from
// /request-access, and approve them by generating a real invite code.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ShieldCheck, Building2, Clock, Copy, Check, XCircle, Loader2, AlertTriangle } from "lucide-react";

type InviteRow = {
  id: number;
  email: string;
  role: string;
  code: string;
  status: string;
  used_at: string | null;
};

function generateCode() {
  // Short, readable code — e.g. SBH-7K2P9Q
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `SBH-${code}`;
}

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<InviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  async function loadRequests() {
    setLoading(true);
    setLoadError("");
    const { data, error } = await supabase
      .from("invite_codes")
      .select("*")
      .order("id", { ascending: false });

    if (error) setLoadError(error.message);
    else setRequests(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function approve(req: InviteRow) {
    const code = generateCode();
    const { error } = await supabase
      .from("invite_codes")
      .update({ code, status: "approved" })
      .eq("id", req.id);

    if (error) {
      alert(`Couldn't approve: ${error.message}`);
      return;
    }
    setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, code, status: "approved" } : r));
  }

  async function deny(req: InviteRow) {
    if (!confirm(`Deny ${req.email}'s request?`)) return;
    const { error } = await supabase
      .from("invite_codes")
      .update({ status: "denied" })
      .eq("id", req.id);

    if (error) {
      alert(`Couldn't deny: ${error.message}`);
      return;
    }
    setRequests((prev) => prev.map((r) => r.id === req.id ? { ...r, status: "denied" } : r));
  }

  function copyCode(req: InviteRow) {
    navigator.clipboard.writeText(req.code);
    setCopiedId(req.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const pending = requests.filter((r) => r.status === "pending");
  const approved = requests.filter((r) => r.status === "approved");
  const other = requests.filter((r) => r.status !== "pending" && r.status !== "approved");

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading access requests...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load access requests</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Access requests</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Review requests and generate invite codes for new Admin/Owner accounts
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl p-8 text-center mb-6" style={{ border: "1px solid #E5E7EB", color: "#9CA3AF" }}>
          <Clock size={24} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No pending requests</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {pending.map((req) => (
            <div key={req.id} className="rounded-xl p-4 flex items-center justify-between gap-3"
              style={{ border: "2px solid #F0C040", background: "#FFFBF0" }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "#E8F0FE" }}>
                  {req.role === "admin" ? <ShieldCheck size={16} style={{ color: "#1B4FBB" }} /> : <Building2 size={16} style={{ color: "#1B4FBB" }} />}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>{req.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>Requesting: {req.role.charAt(0).toUpperCase() + req.role.slice(1)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approve(req)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium"
                  style={{ background: "#E1F5EE", color: "#085041", border: "1px solid #9FE1CB", cursor: "pointer" }}>
                  <Check size={12} /> Approve
                </button>
                <button onClick={() => deny(req)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium"
                  style={{ background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1", cursor: "pointer" }}>
                  <XCircle size={12} /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>Approved — share these codes</h2>
          <div className="space-y-2 mb-6">
            {approved.map((req) => (
              <div key={req.id} className="rounded-xl p-4 flex items-center justify-between gap-3"
                style={{ border: req.used_at ? "1px solid #E5E7EB" : "1.5px solid #9FE1CB", background: req.used_at ? "#F9FAFB" : "#E1F5EE" }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: "#111827" }}>{req.email}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                    {req.role.charAt(0).toUpperCase() + req.role.slice(1)} · {req.used_at ? "Used — account created" : "Not yet used"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm px-3 py-1.5 rounded-lg" style={{ background: "#fff", border: "1px solid #E5E7EB", color: "#111827" }}>
                    {req.code}
                  </span>
                  {!req.used_at && (
                    <button onClick={() => copyCode(req)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                      {copiedId === req.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {other.length > 0 && (
        <>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "#9CA3AF" }}>Denied</h2>
          <div className="space-y-2">
            {other.map((req) => (
              <div key={req.id} className="rounded-xl p-3 flex items-center justify-between"
                style={{ border: "1px solid #E5E7EB", background: "#F9FAFB", opacity: 0.6 }}>
                <p className="text-xs" style={{ color: "#6B7280" }}>{req.email} — {req.role}</p>
                <span className="text-xs" style={{ color: "#9CA3AF" }}>Denied</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
