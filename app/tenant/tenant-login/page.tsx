"use client";

// app/tenant-login/page.tsx

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home, User, ExternalLink, Eye, EyeOff,
  CheckCircle, ArrowRight, Info,
} from "lucide-react";

// ── Replace this with your actual Google Form URL ──────────────────
const GOOGLE_FORM_URL = "https://forms.gle/your-google-form-link";
// ──────────────────────────────────────────────────────────────────

// Demo credentials — remove when you add real auth
const DEMO = { email: "ravi.kumar@example.com", password: "tenant123" };

export default function TenantLoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (email !== DEMO.email || password !== DEMO.password) {
      setError("Incorrect email or password. Use the demo credentials below.");
      return;
    }
    setLoading(true);
    setTimeout(() => router.push("/tenant"), 700);
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #f8f3eb 0%, #efe8dd 100%)" }}
    >
      {/* Brand bar */}
      <div className="flex items-center gap-2 mb-8">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #18233c, #232f4f)" }}
        >
          <Home size={16} style={{ color: "#e6c888" }} />
        </div>
        <span className="text-lg font-semibold" style={{ color: "#232f4f" }}>
          Sree Balaji Hospitalities
        </span>
      </div>

      <div className="w-full max-w-2xl grid md:grid-cols-2 gap-5">

        {/* ── LEFT: Existing tenant login ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(35,47,79,0.16)", background: "rgba(255,255,255,0.92)", boxShadow: "0 18px 40px rgba(24,35,60,0.08)" }}
        >
          {/* Card header */}
          <div
            className="px-5 py-4"
            style={{ background: "linear-gradient(135deg, #18233c, #232f4f)", borderBottom: "3px solid #d6b06d" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              Existing tenant
            </p>
            <h1 className="text-lg font-semibold text-white">Sign in to your portal</h1>
          </div>

          <div className="p-5">
            <p className="text-xs mb-5" style={{ color: "#6B7280", lineHeight: 1.6 }}>
              Approved tenants can sign in anytime to view payments, pay rent, and download receipts.
              Once your owner disables your access after move-out, login will no longer be available.
            </p>

            {/* Email */}
            <div className="mb-3">
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 text-sm rounded-lg"
                style={{
                  border: "1.5px solid rgba(35,47,79,0.18)",
                  outline: "none",
                  color: "#111827",
                  background: "#fff",
                }}
                onFocus={(e)  => e.currentTarget.style.borderColor = "#d6b06d"}
                onBlur={(e)   => e.currentTarget.style.borderColor = "rgba(35,47,79,0.18)"}
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
                  style={{
                    border: "1.5px solid rgba(35,47,79,0.18)",
                    outline: "none",
                    color: "#111827",
                    background: "#fff",
                  }}
                  onFocus={(e)  => e.currentTarget.style.borderColor = "#d6b06d"}
                  onBlur={(e)   => e.currentTarget.style.borderColor = "rgba(35,47,79,0.18)"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="text-xs px-3 py-2 rounded-lg mb-3"
                style={{ background: "#fbeee2", color: "#7a4211", border: "1px solid #e5c8a4" }}
              >
                {error}
              </div>
            )}

            {/* Login button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition"
              style={{
                background: loading ? "#6B7280" : "linear-gradient(135deg, #232f4f, #18233c)",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : <><User size={14} /> Sign in to portal</>}
            </button>

            {/* Demo credentials */}
            <div
              className="mt-4 p-3 rounded-lg text-xs"
              style={{ background: "rgba(35,47,79,0.05)", color: "#6B7280", lineHeight: 1.7 }}
            >
              <p className="font-medium mb-0.5" style={{ color: "#111827" }}>
                Demo credentials
              </p>
              <p>Email: <span className="font-mono" style={{ color: "#b8924c" }}>{DEMO.email}</span></p>
              <p>Password: <span className="font-mono" style={{ color: "#b8924c" }}>{DEMO.password}</span></p>
            </div>

            {/* Back link */}
            <div className="mt-4 text-center">
              <Link href="/" className="text-xs hover:underline" style={{ color: "#9CA3AF" }}>
                ← Back to role selection
              </Link>
            </div>
          </div>
        </div>

        {/* ── RIGHT: New tenant Google Form ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(214,176,109,0.5)", background: "rgba(255,255,255,0.92)", boxShadow: "0 18px 40px rgba(24,35,60,0.08)" }}
        >
          {/* Card header */}
          <div
            className="px-5 py-4"
            style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)", borderBottom: "3px solid #232f4f" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "rgba(24,35,60,0.58)" }}>
              New tenant
            </p>
            <h2 className="text-lg font-semibold" style={{ color: "#18233c" }}>
              Submit onboarding form
            </h2>
          </div>

          <div className="p-5">
            <p className="text-xs mb-5" style={{ color: "#6B7280", lineHeight: 1.6 }}>
              Fill in the Google Form with your details. Your owner will review and approve your
              request before granting login access.
            </p>

            {/* How it works steps */}
            <div className="space-y-2.5 mb-5">
              {[
                { step: "1", text: "Click the button below to open the form" },
                { step: "2", text: "Fill in your name, contact, flat details & ID proof" },
                { step: "3", text: "Owner reviews and approves your request" },
                { step: "4", text: "You receive login credentials via email" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                    style={{ background: "#232f4f", color: "#fff" }}
                  >
                    {step}
                  </div>
                  <p className="text-xs" style={{ color: "#6B7280", lineHeight: 1.5 }}>{text}</p>
                </div>
              ))}
            </div>

            {/* Google Form button */}
            <a
              href={GOOGLE_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition mb-4"
              style={{
                background: "linear-gradient(135deg, #232f4f, #18233c)",
                color: "#fff",
                border: "none",
                textDecoration: "none",
                display: "flex",
              }}
            >
              <ExternalLink size={14} /> Open Google Form ↗
            </a>

            {/* Info box for developer */}
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "rgba(35,47,79,0.06)", border: "1px solid rgba(35,47,79,0.16)", color: "#0C447C", lineHeight: 1.7 }}
            >
              <div className="flex items-center gap-1.5 font-medium mb-1" style={{ color: "#232f4f" }}>
                <Info size={12} /> For developers
              </div>
              <p>Replace <span className="font-mono bg-white px-1 rounded">GOOGLE_FORM_URL</span> at the top of this file with your actual Google Form link.</p>
              <p className="mt-1">To auto-sync form responses → connect your Google Sheet to the <span className="font-mono bg-white px-1 rounded">data/tenants.ts</span> via Sheets API or Zapier.</p>
            </div>

            {/* Already have approval */}
            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: "#9CA3AF" }}>
                Already approved?{" "}
                <button
                  onClick={() => document.querySelector<HTMLInputElement>("input[type='email']")?.focus()}
                  className="underline"
                  style={{ color: "#b8924c", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}
                >
                  Sign in on the left →
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div
        className="mt-8 flex items-center gap-6 text-xs"
        style={{ color: "#9CA3AF" }}
      >
        <div className="flex items-center gap-1.5">
          <CheckCircle size={12} style={{ color: "#1D9E75" }} />
          <span>Secure login</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle size={12} style={{ color: "#1D9E75" }} />
          <span>Owner-approved access</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle size={12} style={{ color: "#1D9E75" }} />
          <span>Auto receipts</span>
        </div>
      </div>
    </div>
  );
}