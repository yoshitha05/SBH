"use client";

// app/signup/page.tsx
//
// Now requires a valid invite code (from an approved access request)
// to sign up as Admin or Owner. The code must match the exact email
// and role it was generated for, and gets marked used after signup.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Home, Eye, EyeOff } from "lucide-react";

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin",
  owner: "/admin", // owner currently lands on the same admin UI for this stage
};

export default function SignupPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    if (!inviteCode.trim() || !name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields, including your invite code.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);

    // Validate the invite code first, before creating any account.
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode.trim())
      .eq("status", "approved")
      .is("used_at", null)
      .maybeSingle();

    if (inviteError || !invite) {
      setError("Invalid or already-used invite code.");
      setLoading(false);
      return;
    }
    if (invite.email.toLowerCase() !== email.trim().toLowerCase()) {
      setError("This invite code was issued for a different email address.");
      setLoading(false);
      return;
    }

    const role = invite.role;

    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }
    if (!authData.user) {
      setError("Signup didn't return a user — please try again.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role,
      name: name.trim(),
      tenant_id: null,
    });

    if (profileError) {
      setError(`Account created, but profile setup failed: ${profileError.message}`);
      setLoading(false);
      return;
    }

    // Mark the invite code as used so it can't be reused.
    await supabase.from("invite_codes").update({ used_at: new Date().toISOString() }).eq("id", invite.id);

    if (authData.session) {
      router.push(ROLE_ROUTES[role] ?? "/admin");
    } else {
      setError("Account created! Check your email to confirm, then sign in.");
      setLoading(false);
    }
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
          <h1 className="text-xl font-semibold mb-1" style={{ color: "#111827" }}>Create account</h1>
          <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Sign up using your invite code</p>

          <div className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Invite code</label>
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
              placeholder="e.g. SBH-7K2P9Q"
              className="w-full px-3 py-2.5 text-sm rounded-lg font-mono"
              style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }} />
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg"
              style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }} />
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Must match the email your invite code was issued for"
              className="w-full px-3 py-2.5 text-sm rounded-lg"
              style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }} />
          </div>

          <div className="mb-4">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg"
                style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg mb-3"
              style={{ background: "#fbeee2", color: "#7a4211", border: "1px solid #e5c8a4" }}>
              {error}
            </div>
          )}

          <button onClick={handleSignup} disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{
              background: loading ? "#6B7280" : "linear-gradient(135deg, #232f4f, #18233c)",
              color: "#fff", border: "none",
              cursor: loading ? "not-allowed" : "pointer",
            }}>
            {loading ? "Creating account..." : "Create account →"}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: "#9CA3AF" }}>
            Don't have an invite code? <Link href="/request-access" style={{ color: "#b8924c" }}>Request access</Link>
          </p>
          <p className="text-xs text-center mt-2" style={{ color: "#9CA3AF" }}>
            Already have an account? <Link href="/login" style={{ color: "#b8924c" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
