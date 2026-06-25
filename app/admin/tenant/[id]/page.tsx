"use client";

// app/admin/tenant/[id]/page.tsx
//
// STAGE 1 of Supabase migration for the tenant detail page: the PROFILE
// (name, phone, email, age, aadhar, building, flat, rent, status, dates)
// now loads from the real `tenants` table, and the Edit/Save flow writes
// back to it.
//
// DEFERRED to later stages (still client-side/sample only for now):
//   - Flat history: still the hardcoded SAMPLE_FLAT_HISTORY list
//   - Payment history / Receipts: still tenant.paymentHistory, which no
//     longer exists on the Supabase row — defaulted to empty for now
//   - Documents: still browser-memory only (URL.createObjectURL)
// Each of these needs its own table query joined by tenant id, which is
// a reasonable next stage rather than bundling into this one.

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import jsPDF from "jspdf";
import {
  Phone, Mail, Building2, Home, CreditCard,
  ShieldCheck, Wifi, WifiOff, QrCode,
  Download, ArrowLeft, UserX, CheckCircle,
  AlertTriangle, Calendar, Users, Pencil, Save, X, Clock,
  Upload, FileText, Trash2, Loader2, Plus,
} from "lucide-react";

const riskStyle: Record<string, { bg: string; text: string; border: string; label: string }> = {
  low:    { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB",  label: "Low risk" },
  medium: { bg: "#FAEEDA", text: "#633806", border: "#FAC775",  label: "Medium risk" },
  high:   { bg: "#FCEBEB", text: "#791F1F", border: "#F7C1C1",  label: "High risk" },
};

type FlatHistoryEntry = { flatNo: string; building: string; tenantName: string; from: string; to: string; rent: number };
const SAMPLE_FLAT_HISTORY: FlatHistoryEntry[] = [
  { flatNo: "101", building: "Ohm",     tenantName: "Ravi Kumar",   from: "Jan 2025", to: "Present",  rent: 12000 },
  { flatNo: "101", building: "Ohm",     tenantName: "Deepa Shah",   from: "Jun 2022", to: "Dec 2024",  rent: 10500 },
  { flatNo: "102", building: "Ohm",     tenantName: "Meena Iyer",   from: "Mar 2022", to: "Dec 2022",  rent: 16000 },
  { flatNo: "102", building: "Ohm",     tenantName: "Vijay Nair",   from: "Aug 2024", to: "Present",   rent: 19000 },
  { flatNo: "201", building: "NN Elite",tenantName: "Divya Rao",    from: "Jun 2021", to: "May 2024",  rent: 15000 },
];

function maskAadhar(aadhar?: string | null) {
  if (!aadhar) return "—";
  const digits = aadhar.replace(/\s/g, "");
  if (digits.length < 4) return "••••";
  return `•••• •••• ${digits.slice(-4)}`;
}

// Shape of a row from Supabase's `tenants` table.
// A co-tenant row. `id` is the real Supabase id once loaded; `isNew` marks
// rows added in this editing session that don't exist in the DB yet (so we
// know to INSERT rather than UPDATE them on save).
type CoTenant = {
  id: number | string;
  name: string;
  age: string;
  phone: string;
  email: string;
  aadhar: string;
  isNew?: boolean;
};

let _newCoId = 1;
function blankCoTenant(): CoTenant {
  return { id: `new${_newCoId++}`, name: "", age: "", phone: "", email: "", aadhar: "", isNew: true };
}

type SupabaseTenant = {
  owner_id: string;
  id: number;
  name: string;
  phone: string;
  email: string;
  building: string;
  flat_no: string;
  rent: number;
  status: string;
  risk: string;
  approved: boolean;
  access_enabled: boolean;
  age: number | null;
  aadhar: string | null;
  move_in_date: string | null;
  lease_end: string | null;
};

export default function AdminTenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [tenant, setTenant] = useState<SupabaseTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    async function loadTenant() {
      setLoading(true);
      setLoadError("");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadError("Not signed in."); setLoading(false); return; }

      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("id", id)
        .eq("owner_id", user.id)
        .maybeSingle();

      if (error) {
        setLoadError(error.message);
      } else {
        setTenant(data);
      }
      setLoading(false);
    }
    loadTenant();
  }, [id]);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", age: "", aadhar: "" });
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState("");

  // Co-tenants now load from the real co_tenants table, keyed by tenant_id.
  // `coTenants` is the saved/displayed list; `editCoTenants` is the working
  // copy used while editing is in progress (so Cancel can discard changes).
  const [coTenants, setCoTenants] = useState<CoTenant[]>([]);
  const [editCoTenants, setEditCoTenants] = useState<CoTenant[]>([]);
  const [coTenantsError, setCoTenantsError] = useState("");

  useEffect(() => {
    async function loadCoTenants() {
      if (!tenant) return;
      const { data, error } = await supabase
        .from("co_tenants")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("owner_id", tenant.owner_id);

      if (!error && data) {
        setCoTenants(
          data.map((c) => ({
            id: c.id,
            name: c.name ?? "",
            age: c.age ? String(c.age) : "",
            phone: c.phone ?? "",
            email: c.email ?? "",
            aadhar: c.aadhar ?? "",
          }))
        );
      }
    }
    loadCoTenants();
  }, [tenant]);

  // Payment history — real Supabase data now
  type PaymentEntry = { id: number; month: string; amount: number; paid_on: string | null; status: string; receipt_url: string | null };
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [uploadingReceiptFor, setUploadingReceiptFor] = useState<number | null>(null);
  const [receiptUploadError, setReceiptUploadError] = useState("");
  const [paymentsError, setPaymentsError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentEntry | null>(null);
  const [paymentForm, setPaymentForm] = useState({ month: "", amount: 0, paid_on: "", status: "Paid" });

  useEffect(() => {
    async function loadPayments() {
      if (!tenant) return;
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("owner_id", tenant.owner_id)
        .order("paid_on", { ascending: false });
      if (!error && data) setPayments(data);
    }
    loadPayments();
  }, [tenant]);

  function openAddPaymentModal() {
    setEditingPayment(null);
    setPaymentForm({ month: "", amount: tenant?.rent ?? 0, paid_on: new Date().toISOString().split("T")[0], status: "Paid" });
    setPaymentsError("");
    setShowPaymentModal(true);
  }
  function openEditPaymentModal(p: PaymentEntry) {
    setEditingPayment(p);
    setPaymentForm({ month: p.month, amount: p.amount, paid_on: p.paid_on ?? "", status: p.status });
    setPaymentsError("");
    setShowPaymentModal(true);
  }
  async function submitPayment() {
    if (!tenant || !paymentForm.month.trim()) {
      setPaymentsError("Please enter a month.");
      return;
    }
    setPaymentsError("");

    const payload = {
      tenant_id: tenant.id,
      owner_id: tenant.owner_id,
      month: paymentForm.month.trim(),
      amount: paymentForm.amount,
      paid_on: paymentForm.paid_on || null,
      status: paymentForm.status,
    };

    if (editingPayment) {
      const { error } = await supabase.from("payment_history").update(payload).eq("id", editingPayment.id);
      if (error) { setPaymentsError(error.message); return; }
    } else {
      const { error } = await supabase.from("payment_history").insert(payload);
      if (error) { setPaymentsError(error.message); return; }
    }

    setShowPaymentModal(false);
    const { data } = await supabase
      .from("payment_history")
      .select("*")
      .eq("tenant_id", tenant.id)
      .eq("owner_id", tenant.owner_id)
      .order("paid_on", { ascending: false });
    if (data) setPayments(data);
  }
  async function deletePayment(p: PaymentEntry) {
    if (!confirm(`Delete the ${p.month} payment entry? This cannot be undone.`)) return;
    const { error } = await supabase.from("payment_history").delete().eq("id", p.id);
    if (error) { alert(`Couldn't delete: ${error.message}`); return; }
    setPayments((prev) => prev.filter((entry) => entry.id !== p.id));
  }

  async function uploadReceipt(p: PaymentEntry, file: File) {
    if (!tenant) return;
    setUploadingReceiptFor(p.id);
    setReceiptUploadError("");

    const fileExt = file.name.split(".").pop();
    const filePath = `tenant-${tenant.id}/payment-${p.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, file);

    if (uploadError) {
      setReceiptUploadError(uploadError.message);
      setUploadingReceiptFor(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("receipts").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("payment_history")
      .update({ receipt_url: urlData.publicUrl })
      .eq("id", p.id);

    if (updateError) {
      setReceiptUploadError(updateError.message);
      setUploadingReceiptFor(null);
      return;
    }

    setPayments((prev) => prev.map((entry) =>
      entry.id === p.id ? { ...entry, receipt_url: urlData.publicUrl } : entry
    ));
    setUploadingReceiptFor(null);
  }

  async function removeReceipt(p: PaymentEntry) {
    if (!confirm("Remove this receipt? The uploaded file will be permanently deleted.")) return;
    const { error } = await supabase
      .from("payment_history")
      .update({ receipt_url: null })
      .eq("id", p.id);
    if (error) { alert(`Couldn't remove receipt: ${error.message}`); return; }
    setPayments((prev) => prev.map((entry) =>
      entry.id === p.id ? { ...entry, receipt_url: null } : entry
    ));
  }

  // Documents now load from and save to the real `documents` table +
  // Supabase Storage, instead of browser memory (URL.createObjectURL).
  type DocumentEntry = { id: number; file_name: string; file_path: string; uploaded_on: string; signedUrl?: string };
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [documentsError, setDocumentsError] = useState("");
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadDocuments() {
      if (!tenant) return;
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("owner_id", tenant.owner_id)
        .order("uploaded_on", { ascending: false });

      if (error) {
        setDocumentsError(error.message);
        return;
      }
      if (!data) return;

      // The bucket is private, so we need a signed (temporary) URL for
      // each file rather than a permanent public one.
      const withUrls = await Promise.all(
        data.map(async (doc) => {
          const { data: signed } = await supabase.storage
            .from("documents")
            .createSignedUrl(doc.file_path, 60 * 60); // 1 hour validity
          return { ...doc, signedUrl: signed?.signedUrl };
        })
      );
      setDocuments(withUrls);
    }
    loadDocuments();
  }, [tenant]);

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading tenant from database...</p>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load this tenant from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }
  if (!tenant) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Users size={32} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">Tenant not found</p>
        <Link href="/admin/tenants" className="text-xs mt-2 inline-block" style={{ color: "#1B4FBB" }}>
          ← Back to Tenants
        </Link>
      </div>
    );
  }

  const rs  = riskStyle[tenant.risk] ?? riskStyle.medium;
  // payStatusStyle relied on a paymentStatus field that no longer exists
  // on the Supabase row — derive a reasonable placeholder for now until
  // payment_history is wired in.
  const paymentStatus = tenant.status === "occupied" ? "Paid" : "Pending approval";
  const pss = paymentStatus === "Paid"
    ? { bg: "#E1F5EE", text: "#085041", border: "#9FE1CB" }
    : { bg: "#E6F1FB", text: "#0C447C", border: "#B5D4F4" };
  const occupants = 1 + coTenants.length;
  const flatHistory = SAMPLE_FLAT_HISTORY.filter(
    (h) => h.flatNo === tenant.flat_no && h.building === tenant.building
  );

  function startEdit() {
    setEditForm({
      name: tenant!.name, phone: tenant!.phone, email: tenant!.email,
      age: tenant!.age ? String(tenant!.age) : "", aadhar: tenant!.aadhar ?? "",
    });
    // Work from a fresh copy of the real co-tenants list so edits here
    // don't mutate the displayed list until Save is actually clicked.
    setEditCoTenants(coTenants.map((c) => ({ ...c })));
    setSaveError("");
    setCoTenantsError("");
    setEditing(true);
  }
  async function saveEdit() {
    setSaveError("");
    setCoTenantsError("");

    const { error } = await supabase
      .from("tenants")
      .update({
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        age: editForm.age ? Number(editForm.age) : null,
        aadhar: editForm.aadhar.trim() || null,
      })
      .eq("id", tenant!.id);

    if (error) {
      setSaveError(error.message);
      return;
    }

    // Co-tenants: diff editCoTenants against the original coTenants list.
    // New rows (isNew) get inserted; existing rows get updated; anything
    // that was in the original list but isn't in editCoTenants anymore
    // gets deleted.
    const originalIds = new Set(coTenants.map((c) => c.id));
    const editedIds = new Set(editCoTenants.filter((c) => !c.isNew).map((c) => c.id));
    const deletedIds = [...originalIds].filter((id) => !editedIds.has(id));

    for (const delId of deletedIds) {
      const { error: delErr } = await supabase.from("co_tenants").delete().eq("id", delId);
      if (delErr) { setCoTenantsError(delErr.message); return; }
    }

    for (const co of editCoTenants) {
      const payload = {
        tenant_id: tenant!.id,
        owner_id: tenant!.owner_id,
        name: co.name,
        age: co.age ? Number(co.age) : null,
        phone: co.phone,
        email: co.email,
        aadhar: co.aadhar.trim() || null,
      };
      if (co.isNew) {
        const { error: insErr } = await supabase.from("co_tenants").insert(payload);
        if (insErr) { setCoTenantsError(insErr.message); return; }
      } else {
        const { error: updErr } = await supabase.from("co_tenants").update(payload).eq("id", co.id);
        if (updErr) { setCoTenantsError(updErr.message); return; }
      }
    }

    // Refetch co-tenants so displayed list has real ids for anything just inserted
    const { data: freshCoTenants } = await supabase
      .from("co_tenants")
      .select("*")
      .eq("tenant_id", tenant!.id)
      .eq("owner_id", tenant!.owner_id);
    if (freshCoTenants) {
      setCoTenants(freshCoTenants.map((c) => ({
        id: c.id, name: c.name ?? "", age: c.age ? String(c.age) : "",
        phone: c.phone ?? "", email: c.email ?? "", aadhar: c.aadhar ?? "",
      })));
    }

    setTenant((prev) => prev ? {
      ...prev,
      name: editForm.name, phone: editForm.phone, email: editForm.email,
      age: editForm.age ? Number(editForm.age) : null,
      aadhar: editForm.aadhar.trim() || null,
    } : prev);
    setEditing(false);
    setSaved(`Saved at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setSaved(""), 3000);
  }

  async function approveTenant() {
    if (!tenant) return;
    if (!confirm(`Approve ${tenant.name}? This grants them login access.`)) return;

    const { error } = await supabase
      .from("tenants")
      .update({ approved: true, access_enabled: true })
      .eq("id", tenant.id);

    if (error) {
      alert(`Couldn't approve tenant: ${error.message}`);
      return;
    }
    setTenant((prev) => prev ? { ...prev, approved: true, access_enabled: true } : prev);
  }

  async function vacateTenant() {
    if (!tenant) return;
    if (!confirm(`Vacate ${tenant.name}? This disables their login access and marks the flat as vacated. This does not delete their record.`)) return;

    const { error } = await supabase
      .from("tenants")
      .update({ access_enabled: false, status: "vacated" })
      .eq("id", tenant.id);

    if (error) {
      alert(`Couldn't vacate tenant: ${error.message}`);
      return;
    }
    setTenant((prev) => prev ? { ...prev, access_enabled: false, status: "vacated" } : prev);
  }

  function addCoTenant() {
    setEditCoTenants((prev) => [...prev, blankCoTenant()]);
  }
  function updateCoTenant(id: number | string, field: "name" | "age" | "phone" | "email" | "aadhar", val: string) {
    setEditCoTenants((prev) => prev.map((c) => c.id === id ? { ...c, [field]: val } : c));
  }
  function removeCoTenant(id: number | string) {
    setEditCoTenants((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;
    setUploadingDocument(true);
    setDocumentsError("");

    const fileExt = file.name.split(".").pop();
    const filePath = `tenant-${tenant.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) {
      setDocumentsError(uploadError.message);
      setUploadingDocument(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("documents")
      .insert({
        tenant_id: tenant.id,
        owner_id: tenant.owner_id,
        file_name: file.name,
        file_path: filePath,
        uploaded_on: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      setDocumentsError(insertError.message);
      setUploadingDocument(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { data: signed } = await supabase.storage
      .from("documents")
      .createSignedUrl(filePath, 60 * 60);

    setDocuments((prev) => [{ ...inserted, signedUrl: signed?.signedUrl }, ...prev]);
    setUploadingDocument(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function removeDocument(doc: DocumentEntry) {
    if (!confirm(`Remove "${doc.file_name}"? This permanently deletes the uploaded file.`)) return;

    await supabase.storage.from("documents").remove([doc.file_path]);
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) {
      setDocumentsError(error.message);
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
  }

  function downloadReceiptPDF(receiptLabel: string) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Rent Receipt", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString("en-IN")}`, 14, 25);

    doc.setDrawColor(220);
    doc.line(14, 30, 196, 30);

    doc.setFontSize(11);
    doc.setTextColor(20);
    const lines = [
      ["Receipt", receiptLabel],
      ["Tenant", tenant!.name],
      ["Building / Flat", `${tenant!.building} · ${tenant!.flat_no}`],
      ["Tenant ID", String(tenant!.id)],
      ["Monthly rent", `Rs. ${tenant!.rent.toLocaleString("en-IN")}`],
      ["Payment status", paymentStatus],
    ];
    let y = 42;
    lines.forEach(([label, value]) => {
      doc.setTextColor(120);
      doc.text(label, 14, y);
      doc.setTextColor(20);
      doc.text(String(value), 70, y);
      y += 10;
    });

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("This is a system-generated receipt.", 14, y + 10);

    doc.save(`${receiptLabel.replace(/\s+/g, "_")}_${tenant!.id}.pdf`);
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-4" style={{ color: "#6B7280" }}>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 hover:underline"
          style={{ color: "#1B4FBB", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <span>/</span>
        <span>{tenant.name}</span>
      </div>

      {/* Profile header card */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
      >
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold flex-shrink-0"
              style={{ background: "#E8F0FE", color: "#1B4FBB" }}
            >
              {tenant.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
            </div>
            <div>
              <h1 className="text-xl font-semibold" style={{ color: "#111827" }}>
                {tenant.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
                {tenant.building} · Flat {tenant.flat_no} · ID: {tenant.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: rs.bg, color: rs.text, border: `1px solid ${rs.border}` }}
            >
              {rs.label}
            </span>
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: pss.bg, color: pss.text, border: `1px solid ${pss.border}` }}
            >
              {paymentStatus}
            </span>
            {!editing ? (
              <button onClick={startEdit}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", cursor: "pointer" }}>
                <Pencil size={12} /> Edit
              </button>
            ) : (
              <>
                <button onClick={saveEdit}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                  <Save size={12} /> Save
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)", cursor: "pointer" }}>
                  <X size={12} /> Cancel
                </button>
              </>
            )}
            {!tenant.approved && (
              <button
                onClick={approveTenant}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "#E1F5EE", color: "#085041", border: "1px solid #9FE1CB", cursor: "pointer" }}
              >
                <CheckCircle size={12} /> Approve
              </button>
            )}
            {tenant.approved && tenant.access_enabled && (
              <button
                onClick={vacateTenant}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1", cursor: "pointer" }}
              >
                <UserX size={12} /> Vacate tenant
              </button>
            )}
          </div>
        </div>

        {/* Detail grid — view mode */}
        {!editing ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5"
            style={{ borderTop: "1px solid rgba(27,79,187,0.1)" }}>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Phone size={12} /> Phone
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.phone}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Mail size={12} /> Email
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.email}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Calendar size={12} /> Age
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.age ?? "—"}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <ShieldCheck size={12} /> Aadhar
              </div>
              <p className="text-sm font-medium font-mono" style={{ color: "#111827" }}>{maskAadhar(tenant.aadhar)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Building2 size={12} /> Building
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.building}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Home size={12} /> Flat
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.flat_no}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Users size={12} /> Occupants
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{occupants}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                {tenant.access_enabled ? <Wifi size={12} /> : <WifiOff size={12} />} Login access
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: tenant.access_enabled ? "#0F6E56" : "#6B7280" }}
              >
                {tenant.access_enabled ? "Enabled" : "Disabled"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Calendar size={12} /> Move-in
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.move_in_date ?? "—"}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#9CA3AF" }}>
                <Calendar size={12} /> Lease end
              </div>
              <p className="text-sm font-medium" style={{ color: "#111827" }}>{tenant.lease_end ?? "—"}</p>
            </div>
          </div>
        ) : (
          /* Edit mode */
          <div className="grid grid-cols-2 gap-4 mt-5 pt-5" style={{ borderTop: "1px solid rgba(27,79,187,0.1)" }}>
            <div className="col-span-2">
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Full name</label>
              <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Age</label>
              <input type="number" value={editForm.age} onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Phone</label>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Email</label>
              <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Aadhar number</label>
              <input value={editForm.aadhar} onChange={(e) => setEditForm({ ...editForm, aadhar: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg font-mono" placeholder="XXXX XXXX XXXX"
                style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
            </div>
          </div>
        )}
        {saved && <p className="text-xs mt-3" style={{ color: "#0F6E56" }}>{saved}</p>}
        {saveError && <p className="text-xs mt-3" style={{ color: "#A32D2D" }}>Couldn't save: {saveError}</p>}
        {coTenantsError && <p className="text-xs mt-3" style={{ color: "#A32D2D" }}>Couldn't save co-tenants: {coTenantsError}</p>}

        {/* Co-tenants — now loads from and saves to the real co_tenants table */}
        {!editing ? (
          coTenants.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(27,79,187,0.1)" }}>
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-3" style={{ color: "#6B7280" }}>
                <Users size={13} /> Other occupants in this flat ({coTenants.length})
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {coTenants.map((co) => (
                  <div key={co.id} className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1px solid rgba(27,79,187,0.1)" }}>
                    <p className="text-sm font-medium mb-1" style={{ color: "#111827" }}>{co.name || "(unnamed)"}</p>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs" style={{ color: "#6B7280" }}>
                      <span>Age: {co.age || "—"}</span>
                      <span>Phone: {co.phone || "—"}</span>
                      <span className="col-span-2">Email: {co.email || "—"}</span>
                      <span className="col-span-2 font-mono">Aadhar: {maskAadhar(co.aadhar)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(27,79,187,0.1)" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#6B7280" }}>
                <Users size={13} /> Other occupants in this flat {editCoTenants.length > 0 && `(${editCoTenants.length})`}
              </div>
            </div>
            <div className="space-y-2 mb-3">
              {editCoTenants.map((co) => (
                <div key={co.id} className="rounded-lg p-3" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Occupant</span>
                    <button onClick={() => removeCoTenant(co.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="col-span-2">
                      <input value={co.name} onChange={(e) => updateCoTenant(co.id, "name", e.target.value)}
                        placeholder="Full name" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
                        style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                    </div>
                    <div>
                      <input type="number" value={co.age} onChange={(e) => updateCoTenant(co.id, "age", e.target.value)}
                        placeholder="Age" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
                        style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input value={co.phone} onChange={(e) => updateCoTenant(co.id, "phone", e.target.value)}
                      placeholder="Phone" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
                      style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                    <input value={co.email} onChange={(e) => updateCoTenant(co.id, "email", e.target.value)}
                      placeholder="Email" className="w-full px-2.5 py-1.5 text-xs rounded-lg"
                      style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                  </div>
                  <input value={co.aadhar} onChange={(e) => updateCoTenant(co.id, "aadhar", e.target.value)}
                    placeholder="Aadhar number" className="w-full px-2.5 py-1.5 text-xs rounded-lg font-mono"
                    style={{ border: "1px solid #E5E7EB", color: "#111827", outline: "none" }} />
                </div>
              ))}
            </div>
            <button onClick={addCoTenant}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", cursor: "pointer" }}>
              <Users size={12} /> + Add another tenant
            </button>
          </div>
        )}
      </div>

      {/* Flat history — still sample data for this stage */}
      <div className="rounded-xl overflow-hidden mb-5" style={{ border: "1.5px solid rgba(27,79,187,0.18)" }}>
        <div className="flex items-center gap-2 px-4 py-3" style={{ background: "#F5F7FB", borderBottom: "1px solid rgba(27,79,187,0.12)" }}>
          <Clock size={14} style={{ color: "#1B4FBB" }} />
          <span className="text-sm font-semibold" style={{ color: "#111827" }}>
            Flat history — {tenant.building} · {tenant.flat_no}
          </span>
        </div>
        {flatHistory.length > 0 ? (
          <>
            <div className="grid text-xs font-semibold uppercase tracking-wide px-4 py-2"
              style={{ gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.8fr", background: "#FAFBFF", color: "#6B7280", borderBottom: "1px solid rgba(27,79,187,0.08)" }}>
              <div>Tenant</div><div>From</div><div>To</div><div>Rent</div>
            </div>
            {flatHistory.map((h, i) => (
              <div key={i} className="grid px-4 py-3 items-center text-sm"
                style={{ gridTemplateColumns: "1.4fr 0.9fr 0.9fr 0.8fr", borderTop: i===0?"none":"1px solid rgba(27,79,187,0.07)", background: h.to === "Present" ? "#F5FBF8" : "#fff" }}>
                <div className="text-xs font-medium" style={{ color: "#111827" }}>
                  {h.tenantName}
                  {h.to === "Present" && (
                    <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#E1F5EE", color: "#085041" }}>Current</span>
                  )}
                </div>
                <div className="text-xs" style={{ color: "#6B7280" }}>{h.from}</div>
                <div className="text-xs" style={{ color: h.to === "Present" ? "#0F6E56" : "#6B7280", fontWeight: h.to === "Present" ? 600 : 400 }}>{h.to}</div>
                <div className="text-xs font-semibold" style={{ color: "#111827" }}>₹{h.rent.toLocaleString("en-IN")}</div>
              </div>
            ))}
          </>
        ) : (
          <div className="text-center py-8" style={{ color: "#9CA3AF" }}>
            <Clock size={20} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No previous tenant history recorded for this flat</p>
          </div>
        )}
        <div className="px-4 py-2.5 text-xs" style={{ color: "#9CA3AF", background: "#FAFBFF" }}>
          Showing sample history — connect this to past tenant records as they vacate to build a real timeline.
        </div>
      </div>

      {/* Bottom grid: Payments + UPI + History + Receipts */}
      <div className="grid lg:grid-cols-2 gap-5">

        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} style={{ color: "#1B4FBB" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Monthly payment</h2>
          </div>
          <div className="space-y-2.5">
            <div
              className="flex justify-between items-center py-2"
              style={{ borderBottom: "1px solid rgba(27,79,187,0.08)" }}
            >
              <span className="text-sm" style={{ color: "#6B7280" }}>Monthly rent</span>
              <span className="text-sm font-semibold" style={{ color: "#111827" }}>
                ₹{tenant.rent.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-sm" style={{ color: "#6B7280" }}>Status</span>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ background: pss.bg, color: pss.text, border: `1px solid ${pss.border}` }}
              >
                {paymentStatus}
              </span>
            </div>
            <p className="text-xs pt-2" style={{ color: "#9CA3AF" }}>
              Detailed due/paid breakdown is coming with the payment_history migration.
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "2px solid #F0C040" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={15} style={{ color: "#1B4FBB" }} />
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>UPI payment & scan</h2>
          </div>
          <div
            className="rounded-xl flex flex-col items-center justify-center py-8 mb-3"
            style={{ border: "2px dashed rgba(27,79,187,0.2)", background: "#F5F7FB" }}
          >
            <QrCode size={48} style={{ color: "#1B4FBB", opacity: 0.3 }} />
            <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
              QR code for ₹{tenant.rent.toLocaleString("en-IN")} payment
            </p>
          </div>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Reminder: pay before the 5th of every month to avoid late fees.
          </p>
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Payment history</h2>
            <button onClick={openAddPaymentModal}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
              <Plus size={12} /> Add payment
            </button>
          </div>
          {payments.length > 0 ? (
            <div className="space-y-2">
              {payments.map((entry, i) => (
                <div
                  key={entry.id}
                  className="py-2"
                  style={{ borderBottom: i < payments.length - 1 ? "1px solid rgba(27,79,187,0.08)" : "none" }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#111827" }}>{entry.month}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                        {entry.paid_on ? `Paid on ${entry.paid_on}` : "Not yet paid"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                          {entry.amount > 0 ? `₹${entry.amount.toLocaleString("en-IN")}` : "—"}
                        </p>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: entry.status === "Paid" ? "#E1F5EE" : entry.status === "Late" ? "#FAEEDA" : entry.status === "Partial" ? "#E6F1FB" : "#FCEBEB",
                            color: entry.status === "Paid" ? "#085041" : entry.status === "Late" ? "#633806" : entry.status === "Partial" ? "#0C447C" : "#791F1F",
                          }}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <button onClick={() => openEditPaymentModal(entry)}
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background="#F3F4F6"; e.currentTarget.style.color="#374151"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9CA3AF"; }}>
                        <Pencil size={11} />
                      </button>
                      <button onClick={() => deletePayment(entry)}
                        className="w-6 h-6 rounded flex items-center justify-center"
                        style={{ background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background="#FCEBEB"; e.currentTarget.style.color="#A32D2D"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9CA3AF"; }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Receipt upload/view row */}
                  <div className="flex items-center gap-2 mt-1.5">
                    {entry.receipt_url ? (
                      <>
                        <a href={entry.receipt_url} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs hover:underline" style={{ color: "#1B4FBB", textDecoration: "none" }}>
                          <FileText size={11} /> View receipt
                        </a>
                        <button onClick={() => removeReceipt(entry)}
                          className="text-xs" style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                          Remove
                        </button>
                      </>
                    ) : (
                      <label className="flex items-center gap-1 text-xs cursor-pointer" style={{ color: "#9CA3AF" }}>
                        <Upload size={11} />
                        {uploadingReceiptFor === entry.id ? "Uploading..." : "Upload receipt"}
                        <input type="file" className="hidden" disabled={uploadingReceiptFor === entry.id}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) uploadReceipt(entry, file);
                          }} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>
              No payment history yet — click "Add payment" to record one
            </p>
          )}
          {receiptUploadError && <p className="text-xs mt-2" style={{ color: "#A32D2D" }}>{receiptUploadError}</p>}
          {paymentsError && <p className="text-xs mt-3" style={{ color: "#A32D2D" }}>{paymentsError}</p>}
        </div>

        <div
          className="rounded-xl p-5"
          style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Receipts</h2>
            <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" id="tenant-doc-upload" />
            <label htmlFor="tenant-doc-upload"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: "#1B4FBB", color: "#fff", cursor: "pointer" }}>
              <Upload size={12} /> Upload document
            </label>
          </div>
          <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>
            Receipts list is coming with the payment_history migration.
          </p>
        </div>

        {/* Documents — real files in Supabase Storage, metadata in the documents table */}
        <div
          className="rounded-xl p-5 lg:col-span-2"
          style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>Documents</h2>
            <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" id="tenant-doc-upload-2" disabled={uploadingDocument} />
            <label htmlFor="tenant-doc-upload-2"
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: uploadingDocument ? "#9CA3AF" : "#1B4FBB", color: "#fff", cursor: uploadingDocument ? "not-allowed" : "pointer" }}>
              <Upload size={12} /> {uploadingDocument ? "Uploading..." : "Upload document"}
            </label>
          </div>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2"
                  style={{ borderBottom: "1px solid rgba(27,79,187,0.08)" }}>
                  {doc.signedUrl ? (
                    <a href={doc.signedUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 hover:underline" style={{ textDecoration: "none" }}>
                      <FileText size={14} style={{ color: "#1B4FBB" }} />
                      <div>
                        <p className="text-sm" style={{ color: "#1B4FBB" }}>{doc.file_name}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          Uploaded {new Date(doc.uploaded_on).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText size={14} style={{ color: "#9CA3AF" }} />
                      <div>
                        <p className="text-sm" style={{ color: "#9CA3AF" }}>{doc.file_name} (link expired — reload page)</p>
                      </div>
                    </div>
                  )}
                  <button onClick={() => removeDocument(doc)}
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ background: "transparent", border: "none", color: "#9CA3AF", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background="#FCEBEB"; e.currentTarget.style.color="#A32D2D"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#9CA3AF"; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-center py-6" style={{ color: "#9CA3AF" }}>
              No documents uploaded yet — add a lease agreement, ID proof, or other file
            </p>
          )}
          {documentsError && <p className="text-xs mt-2" style={{ color: "#A32D2D" }}>{documentsError}</p>}
          <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
            Files are stored permanently and privately. View links expire after 1 hour for security — reload the page to get a fresh link.
          </p>
        </div>
      </div>

      {/* ── ADD/EDIT PAYMENT MODAL ── */}
      {showPaymentModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(17,24,39,0.5)" }}>
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ background: "#fff" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold" style={{ color: "#111827" }}>
                {editingPayment ? "Edit payment" : "Add payment"}
              </h2>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Month</label>
                <input value={paymentForm.month} onChange={(e) => setPaymentForm({ ...paymentForm, month: e.target.value })}
                  placeholder="e.g. July 2026"
                  className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Amount (₹)</label>
                <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: +e.target.value || 0 })}
                  className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Paid on</label>
                <input type="date" value={paymentForm.paid_on} onChange={(e) => setPaymentForm({ ...paymentForm, paid_on: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg"
                  style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Status</label>
                <select value={paymentForm.status} onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827" }}>
                  <option>Paid</option><option>Late</option><option>Partial</option><option>Unpaid</option>
                </select>
              </div>
            </div>

            {paymentsError && <p className="text-xs mt-3" style={{ color: "#A32D2D" }}>{paymentsError}</p>}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={submitPayment}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                {editingPayment ? "Save changes" : "Add payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
