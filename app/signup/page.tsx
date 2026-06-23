"use client";

// app/signup/page.tsx
//
// Real account creation via Supabase Auth. After signing up, we also
// create a matching row in `profiles` so the app knows this user's role.
// Tenant signups additionally need to be linked to an existing tenant_id
// — for now we ask for the tenant's email to match against the tenants
// table; a more polished invite flow can replace this later.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Home, ShieldCheck, Building2, User, Eye, EyeOff } from "lucide-react";

type Role = "admin" | "owner" | "tenant";

const ROLE_ROUTES: Record<Role, string> = {
  admin: "/admin",
  owner: "/owner",
  tenant: "/tenant",
};

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError("");
    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);

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

    // For tenant signups, find their matching tenant_id by email so their
    // login is linked to their existing tenant record.
    let tenantId: number | null = null;
    if (role === "tenant") {
      const { data: matchedTenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("email", email.trim())
        .maybeSingle();

      if (!matchedTenant) {
        setError("No tenant record found with this email. Ask your admin to add you as a tenant first, using this exact email address.");
        setLoading(false);
        return;
      }
      tenantId = matchedTenant.id;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      role,
      name: name.trim(),
      tenant_id: tenantId,
    });

    if (profileError) {
      setError(`Account created, but profile setup failed: ${profileError.message}`);
      setLoading(false);
      return;
    }

    // If email confirmation is required, there may be no active session
    // yet — handle both cases.
    if (authData.session) {
      router.push(ROLE_ROUTES[role]);
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
          <p className="text-sm mb-5" style={{ color: "#6B7280" }}>Sign up for a new account</p>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {([
              { id: "admin" as Role, icon: ShieldCheck, label: "Admin" },
              { id: "owner" as Role, icon: Building2, label: "Owner" },
              { id: "tenant" as Role, icon: User, label: "Tenant" },
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

          {role === "tenant" && (
            <div className="text-xs px-3 py-2 rounded-lg mb-4"
              style={{ background: "#E6F1FB", color: "#0C447C", lineHeight: 1.6 }}>
              Use the exact email your admin/owner already has on file for you as a tenant.
            </div>
          )}

          <div className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg"
              style={{ border: "1.5px solid rgba(35,47,79,0.18)", outline: "none", color: "#111827", background: "#fff" }} />
          </div>

          <div className="mb-3">
            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
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
            Already have an account? <Link href="/login" style={{ color: "#b8924c" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
