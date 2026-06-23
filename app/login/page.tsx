"use client";

// app/login/page.tsx
//
// Real Supabase Auth sign-in. Replaces the old hardcoded demo-credential
// check entirely. After signing in, we look up the user's role from
// `profiles` and route them to the matching dashboard.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Home, ShieldCheck, Building2, User, Eye, EyeOff, ExternalLink } from "lucide-react";

type Role = "admin" | "owner" | "tenant";

const ROLE_ROUTES: Record<Role, string> = {
  admin:  "/admin",
  owner:  "/owner",
  tenant: "/tenant",
};

const GOOGLE_FORM_URL = "https://forms.gle/your-google-form-link";

export default function LoginPage() {
  const router = useRouter();
  const [step,     setStep]     = useState<"role" | "login" | "tenant-choice">("role");
  const [role,     setRole]     = useState<Role>("admin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function selectRole(r: Role) {
    setRole(r);
    setEmail("");
    setPassword("");
    setError("");
    setStep(r === "tenant" ? "tenant-choice" : "login");
  }

  async function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    if (!data.user) {
      setError("Sign in didn't return a user — please try again.");
      setLoading(false);
      return;
    }

    // Look up this user's real role from profiles, rather than trusting
    // whichever role button they happened to click.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile?.role) {
      setError("Signed in, but no profile/role found for this account. Contact your admin.");
      setLoading(false);
      await supabase.auth.signOut();
      return;
    }

    if (profile.role !== role) {
      setError(`This account is registered as ${profile.role}, not ${role}. Signing you in to the correct dashboard...`);
    }

    // Full page reload so middleware picks up the new session immediately.
    window.location.href = ROLE_ROUTES[profile.role as Role];
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #f3f4f6 0%, #e5e7eb 100%)" }}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden brand-card"
        style={{ boxShadow: "0 20px 50px rgba(35,47,79,0.18), 0 4px 12px rgba(35,47,79,0.08)" }}>

        {/* Top bar */}
        <div className="px-6 py-4 flex items-center gap-2.5"
          style={{ background: "linear-gradient(135deg, #18233c, #232f4f)", borderBottom: "3px solid #d6b06d" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)" }}>
            <Home size={14} style={{ color: "#18233c" }} />
          </div>
          <span className="text-white font-semibold text-base">Sree Balaji Hospitalities</span>
        </div>

        <div className="p-6">

          {/* STEP 1 — Role selection */}
          {step === "role" && (
            <>
              <h1 className="text-xl font-semibold mb-1" style={{ color: "#111827" }}>Sign in</h1>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Choose your role to continue</p>
              <div className="space-y-3">
                {([
                  { id: "admin"  as Role, icon: ShieldCheck, label: "Admin",  sub: "Full access to all data & buildings" },
                  { id: "owner"  as Role, icon: Building2,   label: "Owner",  sub: "Your assigned buildings & payments"  },
                  { id: "tenant" as Role, icon: User,        label: "Tenant", sub: "My rent, payments & receipts"        },
                ]).map(({ id, icon: Icon, label, sub }) => (
                  <button key={id} onClick={() => selectRole(id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl text-left"
                    style={{ border: "1.5px solid rgba(35,47,79,0.16)", background: "rgba(255,255,255,0.9)", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#d6b06d"; e.currentTarget.style.background = "#fbf5ea"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(35,47,79,0.16)"; e.currentTarget.style.background = "rgba(255,255,255,0.9)"; }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)" }}>
                      <Icon size={18} style={{ color: "#232f4f" }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: "#111827" }}>{label}</p>
                      <p className="text-xs" style={{ color: "#9CA3AF" }}>{sub}</p>
                    </div>
                    <span style={{ color: "#b8924c", fontSize: 14 }}>→</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-center mt-5" style={{ color: "#9CA3AF" }}>
                Don't have an account? <Link href="/signup" style={{ color: "#b8924c" }}>Sign up</Link>
              </p>
            </>
          )}

          {/* STEP 2 — Tenant choice */}
          {step === "tenant-choice" && (
            <>
              <button onClick={() => setStep("role")}
                className="flex items-center gap-1 text-sm mb-5"
                style={{ color: "#b8924c", background: "none", border: "none", cursor: "pointer" }}>
                ← Back
              </button>
              <h1 className="text-xl font-semibold mb-1" style={{ color: "#111827" }}>Tenant portal</h1>
              <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Existing or new tenant?</p>
              <div className="space-y-3">
                <button onClick={() => setStep("login")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl text-left"
                  style={{ border: "1.5px solid rgba(35,47,79,0.16)", background: "rgba(255,255,255,0.9)", cursor: "pointer" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#d6b06d"; e.currentTarget.style.background = "#fbf5ea"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(35,47,79,0.16)"; e.currentTarget.style.background = "rgba(255,255,255,0.9)"; }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)" }}>
                    <User size={18} style={{ color: "#232f4f" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>Existing tenant login</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>I already have an approved account</p>
                  </div>
                  <span style={{ color: "#b8924c", fontSize: 14 }}>→</span>
                </button>

                <Link href="/signup"
                  className="w-full flex items-center gap-3 p-4 rounded-xl"
                  style={{ border: "2px solid #d6b06d", background: "#fffaf1", textDecoration: "none", display: "flex" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)" }}>
                    <User size={18} style={{ color: "#18233c" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>New tenant — sign up</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>You must already exist as a tenant on file</p>
                  </div>
                  <span style={{ color: "#b8924c", fontSize: 14 }}>↗</span>
                </Link>

                <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer"
                  className="w-full flex items-center gap-3 p-4 rounded-xl"
                  style={{ border: "1.5px solid rgba(35,47,79,0.16)", background: "rgba(255,255,255,0.9)", textDecoration: "none", display: "flex" }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)" }}>
                    <ExternalLink size={18} style={{ color: "#232f4f" }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "#111827" }}>Not yet a tenant? Fill onboarding form</p>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>Opens Google Form · owner adds you, then you can sign up</p>
                  </div>
                  <span style={{ color: "#b8924c", fontSize: 14 }}>↗</span>
                </a>
              </div>

              <div className="mt-4 p-3 rounded-lg text-xs"
                style={{ background: "rgba(35,47,79,0.05)", color: "#6B7280", lineHeight: 1.7 }}>
                <p className="font-medium mb-1" style={{ color: "#111827" }}>How it works</p>
                <p>1. Fill the Google Form, or ask your admin to add you</p>
                <p>2. Admin/owner adds you as a tenant on file</p>
                <p>3. Sign up here using that exact email</p>
                <p>4. Sign in</p>
              </div>
            </>
          )}

          {/* STEP 3 — Login form */}
          {step === "login" && (
            <>
              <button
                onClick={() => role === "tenant" ? setStep("tenant-choice") : setStep("role")}
                className="flex items-center gap-1 text-sm mb-5"
                style={{ color: "#b8924c", background: "none", border: "none", cursor: "pointer" }}>
                ← Back
              </button>

              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)" }}>
                  {role === "admin"  && <ShieldCheck size={16} style={{ color: "#232f4f" }} />}
                  {role === "owner"  && <Building2   size={16} style={{ color: "#232f4f" }} />}
                  {role === "tenant" && <User        size={16} style={{ color: "#232f4f" }} />}
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: "#111827" }}>
                    Sign in as {role.charAt(0).toUpperCase() + role.slice(1)}
                  </h2>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    {role === "admin"  ? "Full access · all buildings & data"
                    : role === "owner" ? "Restricted · your buildings only"
                    :                   "Tenant portal · my rent & payments"}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-3 py-2.5 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#d6b06d"}
                  onBlur={(e)  => e.currentTarget.style.borderColor = "rgba(35,47,79,0.18)"}
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="••••••••"
                    className="w-full px-3 py-2.5 pr-10 text-sm rounded-lg"
                    style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#d6b06d"}
                    onBlur={(e)  => e.currentTarget.style.borderColor = "rgba(35,47,79,0.18)"}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="text-xs px-3 py-2 rounded-lg mb-3"
                  style={{ background: "#fbeee2", color: "#7a4211", border: "1px solid #e5c8a4" }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold"
                style={{
                  background: loading ? "#6B7280" : "linear-gradient(135deg, #232f4f, #18233c)",
                  color: "#fff", border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                }}>
                {loading ? "Signing in..." : "Sign in →"}
              </button>

              <p className="text-xs text-center mt-4" style={{ color: "#9CA3AF" }}>
                Don't have an account? <Link href="/signup" style={{ color: "#b8924c" }}>Sign up</Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Copyright footer */}
      <p className="mt-6 text-xs" style={{ color: "#9CA3AF" }}>
        © {new Date().getFullYear()} Sree Balaji Hospitalities. All rights reserved.
      </p>
    </div>
  );
}
