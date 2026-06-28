"use client";

// app/admin/google-form/page.tsx
//
// Shows the logged-in admin their own account ID and the Apps Script
// template needed to connect their own Google Form/Sheet. Each admin
// pastes this same script into their own Sheet's Apps Script editor,
// filling in their own Owner ID — this is what makes form submissions
// land under the correct, isolated account.

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Copy, Check, ExternalLink, Loader2 } from "lucide-react";

const SCRIPT_TEMPLATE = `// Google Apps Script — paste this into Extensions > Apps Script
// inside your Google Sheet (the one linked to your Form's responses).
//
// Fill in the 3 values below, then run setupTrigger() once to activate.

const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE";
const OWNER_ID = "OWNER_ID_PLACEHOLDER";

function onFormSubmit(e) {
  const row = e.namedValues;

  const name = (row["Name"] || [""])[0];
  const phone = (row["mobile no"] || [""])[0];
  const building = (row["Building name"] || [""])[0];
  const flatNo = (row["FLAT #"] || [""])[0];
  const address = (row["PERMANENT ADDRESS"] || [""])[0];
  const email = (row["email id"] || [""])[0];

  const payload = {
    owner_id: OWNER_ID,
    name: name,
    phone: phone,
    building: building,
    flat_no: flatNo,
    permanent_address: address,
    email: email,
    status: "occupied",
    risk: "low",
    approved: false,
    access_enabled: false,
  };

  const response = UrlFetchApp.fetch(SUPABASE_URL + "/rest/v1/tenants", {
    method: "post",
    contentType: "application/json",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": "Bearer " + SERVICE_ROLE_KEY,
      "Prefer": "return=representation",
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  Logger.log(response.getContentText());
}

function setupTrigger() {
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();
  Logger.log("Trigger created. New form submissions will now sync automatically.");
}`;

export default function GoogleFormSetupPage() {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setOwnerId(user.id);
      setLoading(false);
    }
    loadUser();
  }, []);

  const personalizedScript = ownerId
    ? SCRIPT_TEMPLATE.replace("OWNER_ID_PLACEHOLDER", ownerId)
    : SCRIPT_TEMPLATE;

  function copyScript() {
    navigator.clipboard.writeText(personalizedScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  }
  function copyOwnerId() {
    if (!ownerId) return;
    navigator.clipboard.writeText(ownerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Connect Google Form</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
          Connect your own Google Form so new tenant submissions land directly in your Tenants list, pending your approval
        </p>
      </div>

      <div className="rounded-xl p-5 mb-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>Your Owner ID</h2>
        <p className="text-xs mb-3" style={{ color: "#6B7280" }}>
          This identifies your account — paste it into the script below so submissions are linked to you specifically, not anyone else.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs px-3 py-2 rounded-lg font-mono" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#111827" }}>
            {ownerId}
          </code>
          <button onClick={copyOwnerId}
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
            {copiedId ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      <div className="rounded-xl p-5 mb-5" style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "#111827" }}>Setup steps</h2>
        <ol className="text-xs space-y-2" style={{ color: "#374151", lineHeight: 1.7 }}>
          <li>1. Open your Google Form's linked response Sheet</li>
          <li>2. Go to <strong>Extensions → Apps Script</strong></li>
          <li>3. Delete any existing code, then paste the script below</li>
          <li>4. Replace <code className="font-mono text-xs px-1 rounded" style={{ background: "#F3F4F6" }}>YOUR_SUPABASE_URL_HERE</code> and <code className="font-mono text-xs px-1 rounded" style={{ background: "#F3F4F6" }}>YOUR_SERVICE_ROLE_KEY_HERE</code> with your real Supabase values (your Owner ID is already filled in)</li>
          <li>5. Click <strong>Run → setupTrigger</strong> once (you'll need to authorize it)</li>
          <li>6. New form submissions will now sync automatically</li>
        </ol>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(27,79,187,0.18)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ background: "#F5F7FB", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
          <span className="text-sm font-semibold" style={{ color: "#111827" }}>Apps Script (personalized for your account)</span>
          <button onClick={copyScript}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
            {copiedScript ? <Check size={12} /> : <Copy size={12} />} {copiedScript ? "Copied" : "Copy script"}
          </button>
        </div>
        <pre className="p-4 text-xs overflow-x-auto" style={{ background: "#0F172A", color: "#E2E8F0", maxHeight: 400 }}>
          {personalizedScript}
        </pre>
      </div>

      <a href="https://script.google.com" target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium" style={{ color: "#1B4FBB", textDecoration: "none" }}>
        <ExternalLink size={12} /> Open Google Apps Script
      </a>
    </div>
  );
}
