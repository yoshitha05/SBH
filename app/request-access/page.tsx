"use client";

// app/request-access/page.tsx
//
// Public page — no login required. Anyone can submit a request to be
// approved for Admin or Owner access. Lands in invite_codes with
// status "pending", reviewed on the admin-only Access Requests page.

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Home, ShieldCheck, Building2 } from "lucide-react";

type Role = "admin" | "owner";

export default function RequestAccessPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("admin");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitRequest() {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase.from("invite_codes").insert({
      email: email.trim(),
      role,
      code: "", // generated later, when admin approves
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ boxShadow: "0 20px 50px rgba(35,47,79,0.18), 0 4px 12px rgba(35,47,79,0.08)" }}>

        <div className="px-6 py-4 flex items-center gap-2.5"
          style={{ background: "linear-gradient(135deg, #18233c, #232f4f)", borderBottom: "3px solid #d6b06d" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)" }}>
            <Home size={14} style={{ color: "#18233c" }} />
          </div>
          <span className="text-white font-semibold text-base">Sree Balaji Hospitalities</span>
        </div>

        <div className="p-6">
          {submitted ? (
            <>
              <h1 className="text-xl font-semibold mb-2" style={{ color: "#111827" }}>Request submitted</h1>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
                Your request has been sent for review. Once approved, you'll receive an invite code to complete signup.
              </p>
              <Link href="/login" className="text-sm font-medium" style={{ color: "#b8924c" }}>← Back to sign in</Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold mb-1" style={{ color: "#111827" }}>Request access</h1>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Submit your details for review</p>

              <div className="grid grid-cols-2 gap-2 mb-5">
                {([
                  { id: "admin" as Role, icon: ShieldCheck, label: "Admin" },
                  { id: "owner" as Role, icon: Building2, label: "Owner" },
                ]).map(({ id, icon: Icon, label }) => (
                  <button key={id} onClick={() => setRole(id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl"
                    style={{
                      border: role === id ? "2px solid #d6b06d" : "1.5px solid rgba(35,47,79,0.16)",
                      background: role === id ? "#fbf5ea" : "rgba(255,255,255,0.9)",
                      cursor: "pointer",
                    }}>
                    <Icon size={18} style={{ color: role === id ? "#232f4f" : "#9CA3AF" }} />
                    <span className="text-xs font-medium" style={{ color: "#111827" }}>{label}</span>
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Full name</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }} />
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }} />
              </div>

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg mb-3"
                  style={{ background: "#fbeee2", color: "#7a4211", border: "1px solid #e5c8a4" }}>
                  {error}
                </div>
              )}

              <button onClick={submitRequest} disabled={submitting}
                className="w-full py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  background: submitting ? "#6B7280" : "linear-gradient(135deg, #232f4f, #18233c)",
                  color: "#fff", border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                }}>
                {submitting ? "Submitting..." : "Submit request →"}
              </button>

              <p className="text-xs text-center mt-4" style={{ color: "#9CA3AF" }}>
                Already have an invite code? <Link href="/signup" style={{ color: "#b8924c" }}>Sign up</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
