"use client";

// app/admin/reports/page.tsx
//
// Converted to a fully real reports generator. Each of the 5 report
// types now fetches real data from Supabase (filtered by scope/period)
// and generates a genuine PDF or Excel file — nothing here is faked
// with an alert() anymore.

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Download, FileText, FileSpreadsheet, Loader2, AlertTriangle } from "lucide-react";

const BUILDINGS = ["Overall — all buildings", "Ohm", "NN Elite", "RVB", "Renuka", "Pearls", "Sree Harsha"];
const PERIODS = ["Jun 2026", "May 2026", "Q2 2026", "Full year 2026"];
const TYPES = [
  "Rent collection + expenditure + summary",
  "Rent collection only",
  "Expenditure only",
  "Tenant directory",
  "Full portfolio report",
];

// Turn a period label into a date range, for filtering expenditure.date
function periodToRange(period: string): { start: string; end: string } {
  const year = 2026;
  if (period.startsWith("Q2")) return { start: `${year}-04-01`, end: `${year}-06-30` };
  if (period === "Full year 2026") return { start: `${year}-01-01`, end: `${year}-12-31` };
  // "Jun 2026" / "May 2026" style
  const monthNames: Record<string, string> = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  const prefix = period.slice(0, 3);
  const mm = monthNames[prefix] ?? "06";
  const lastDay = new Date(year, Number(mm), 0).getDate();
  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(lastDay).padStart(2, "0")}` };
}

// "Jun 2026" -> "June 2026" etc, to match payment_history.month free text
function periodToMonthText(period: string): string | null {
  const map: Record<string, string> = { "Jun 2026": "June 2026", "May 2026": "May 2026" };
  return map[period] ?? null; // Q2/Full year have no exact single-month match
}

export default function AdminReportsPage() {
  const [scope, setScope] = useState(BUILDINGS[0]);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [type, setType] = useState(TYPES[0]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");

  async function fetchPayments() {
    let query = supabase.from("payment_history").select("*");
    const monthText = periodToMonthText(period);
    if (monthText) query = query.eq("month", monthText);

    const { data: payments, error } = await query;
    if (error) throw error;

    const { data: tenants } = await supabase.from("tenants").select("id, name, building, flat_no");
    const tenantMap = new Map((tenants ?? []).map((t) => [t.id, t]));

    let joined = (payments ?? []).map((p) => ({
      ...p,
      tenantName: tenantMap.get(p.tenant_id)?.name ?? "Unknown",
      building: tenantMap.get(p.tenant_id)?.building ?? "—",
      flatNo: tenantMap.get(p.tenant_id)?.flat_no ?? "—",
    }));

    if (scope !== BUILDINGS[0]) joined = joined.filter((p) => p.building === scope);
    return joined;
  }

  async function fetchExpenditure() {
    const { start, end } = periodToRange(period);
    let query = supabase.from("expenditure").select("*").gte("date", start).lte("date", end);

    const { data: properties } = await supabase.from("properties").select("id, name");
    if (scope !== BUILDINGS[0]) {
      const match = (properties ?? []).find((p) => p.name === scope);
      if (match) query = query.eq("property_id", match.id);
    }

    const { data: rows, error } = await query;
    if (error) throw error;

    const propMap = new Map((properties ?? []).map((p) => [p.id, p.name]));
    return (rows ?? []).map((r) => ({ ...r, buildingName: propMap.get(r.property_id) ?? "—" }));
  }

  async function fetchTenantDirectory() {
    let query = supabase.from("tenants").select("*");
    if (scope !== BUILDINGS[0]) query = query.eq("building", scope);
    const { data: tenants, error } = await query;
    if (error) throw error;

    const { data: coTenants } = await supabase.from("co_tenants").select("*");
    const coByTenant = new Map<number, number>();
    (coTenants ?? []).forEach((c) => coByTenant.set(c.tenant_id, (coByTenant.get(c.tenant_id) ?? 0) + 1));

    return (tenants ?? []).map((t) => ({ ...t, occupants: 1 + (coByTenant.get(t.id) ?? 0) }));
  }

  async function generate(fmt: "pdf" | "excel") {
    setGenerating(true);
    setGenError("");
    try {
      const dateStr = new Date().toISOString().split("T")[0];
      const scopeLabel = scope === BUILDINGS[0] ? "All buildings" : scope;

      if (type === "Rent collection only") {
        const rows = await fetchPayments();
        if (fmt === "pdf") {
          const doc = new jsPDF();
          doc.setFontSize(14); doc.text("Rent Collection Report", 14, 16);
          doc.setFontSize(9); doc.setTextColor(120);
          doc.text(`${scopeLabel} · ${period} · Generated ${dateStr}`, 14, 22);
          autoTable(doc, {
            startY: 28,
            head: [["Tenant", "Building", "Flat", "Month", "Amount", "Status"]],
            body: rows.map((r) => [r.tenantName, r.building, r.flatNo, r.month, `₹${r.amount.toLocaleString("en-IN")}`, r.status]),
            headStyles: { fillColor: [27, 79, 187] }, styles: { fontSize: 8 },
          });
          doc.save(`Rent_Collection_${dateStr}.pdf`);
        } else {
          const ws = XLSX.utils.json_to_sheet(rows.map((r) => ({ Tenant: r.tenantName, Building: r.building, Flat: r.flatNo, Month: r.month, "Amount (₹)": r.amount, Status: r.status })));
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Rent Collection");
          XLSX.writeFile(wb, `Rent_Collection_${dateStr}.xlsx`);
        }
      }

      else if (type === "Expenditure only") {
        const rows = await fetchExpenditure();
        if (fmt === "pdf") {
          const doc = new jsPDF();
          doc.setFontSize(14); doc.text("Expenditure Report", 14, 16);
          doc.setFontSize(9); doc.setTextColor(120);
          doc.text(`${scopeLabel} · ${period} · Generated ${dateStr}`, 14, 22);
          autoTable(doc, {
            startY: 28,
            head: [["Date", "Building", "Item", "Amount"]],
            body: rows.map((r) => [r.date, r.buildingName, r.item, `₹${r.amount.toLocaleString("en-IN")}`]),
            headStyles: { fillColor: [27, 79, 187] }, styles: { fontSize: 8 },
          });
          doc.save(`Expenditure_${dateStr}.pdf`);
        } else {
          const ws = XLSX.utils.json_to_sheet(rows.map((r) => ({ Date: r.date, Building: r.buildingName, Item: r.item, "Amount (₹)": r.amount })));
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Expenditure");
          XLSX.writeFile(wb, `Expenditure_${dateStr}.xlsx`);
        }
      }

      else if (type === "Tenant directory") {
        const rows = await fetchTenantDirectory();
        if (fmt === "pdf") {
          const doc = new jsPDF();
          doc.setFontSize(14); doc.text("Tenant Directory", 14, 16);
          doc.setFontSize(9); doc.setTextColor(120);
          doc.text(`${scopeLabel} · Generated ${dateStr}`, 14, 22);
          autoTable(doc, {
            startY: 28,
            head: [["Name", "Building", "Flat", "Phone", "Occupants", "Rent", "Status"]],
            body: rows.map((r) => [r.name, r.building, r.flat_no, r.phone, String(r.occupants), `₹${r.rent.toLocaleString("en-IN")}`, r.status]),
            headStyles: { fillColor: [27, 79, 187] }, styles: { fontSize: 8 },
          });
          doc.save(`Tenant_Directory_${dateStr}.pdf`);
        } else {
          const ws = XLSX.utils.json_to_sheet(rows.map((r) => ({ Name: r.name, Building: r.building, Flat: r.flat_no, Phone: r.phone, Occupants: r.occupants, "Rent (₹)": r.rent, Status: r.status })));
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Tenant Directory");
          XLSX.writeFile(wb, `Tenant_Directory_${dateStr}.xlsx`);
        }
      }

      else {
        // "Rent collection + expenditure + summary" or "Full portfolio report"
        // — both combine payments + expenditure (+ a totals summary sheet)
        const [payments, expenditures] = await Promise.all([fetchPayments(), fetchExpenditure()]);
        const totalCollected = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
        const totalDue = payments.reduce((s, p) => s + p.amount, 0);
        const totalExpenditure = expenditures.reduce((s, e) => s + e.amount, 0);

        if (fmt === "pdf") {
          const doc = new jsPDF();
          doc.setFontSize(14); doc.text(type === "Full portfolio report" ? "Full Portfolio Report" : "Summary Report", 14, 16);
          doc.setFontSize(9); doc.setTextColor(120);
          doc.text(`${scopeLabel} · ${period} · Generated ${dateStr}`, 14, 22);

          doc.setFontSize(11); doc.setTextColor(20);
          doc.text(`Total rent due: ₹${totalDue.toLocaleString("en-IN")}`, 14, 32);
          doc.text(`Total collected: ₹${totalCollected.toLocaleString("en-IN")}`, 14, 38);
          doc.text(`Total expenditure: ₹${totalExpenditure.toLocaleString("en-IN")}`, 14, 44);

          autoTable(doc, {
            startY: 52,
            head: [["Rent Collection", "", "", "", "", ""]],
            body: [],
            headStyles: { fillColor: [27, 79, 187] },
          });
          autoTable(doc, {
            startY: 56,
            head: [["Tenant", "Building", "Flat", "Month", "Amount", "Status"]],
            body: payments.map((r) => [r.tenantName, r.building, r.flatNo, r.month, `₹${r.amount.toLocaleString("en-IN")}`, r.status]),
            headStyles: { fillColor: [27, 79, 187] }, styles: { fontSize: 8 },
          });

          const afterPayments = (doc as any).lastAutoTable.finalY + 10;
          autoTable(doc, {
            startY: afterPayments,
            head: [["Expenditure", "", "", ""]],
            body: [],
            headStyles: { fillColor: [240, 192, 64] },
          });
          autoTable(doc, {
            startY: afterPayments + 4,
            head: [["Date", "Building", "Item", "Amount"]],
            body: expenditures.map((r) => [r.date, r.buildingName, r.item, `₹${r.amount.toLocaleString("en-IN")}`]),
            headStyles: { fillColor: [240, 192, 64] }, styles: { fontSize: 8 },
          });
          doc.save(`${type === "Full portfolio report" ? "Full_Portfolio" : "Summary"}_${dateStr}.pdf`);
        } else {
          const wb = XLSX.utils.book_new();
          const summaryWs = XLSX.utils.json_to_sheet([
            { Metric: "Total rent due", "Value (₹)": totalDue },
            { Metric: "Total collected", "Value (₹)": totalCollected },
            { Metric: "Total expenditure", "Value (₹)": totalExpenditure },
          ]);
          XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
          const paymentsWs = XLSX.utils.json_to_sheet(payments.map((r) => ({ Tenant: r.tenantName, Building: r.building, Flat: r.flatNo, Month: r.month, "Amount (₹)": r.amount, Status: r.status })));
          XLSX.utils.book_append_sheet(wb, paymentsWs, "Rent Collection");
          const expWs = XLSX.utils.json_to_sheet(expenditures.map((r) => ({ Date: r.date, Building: r.buildingName, Item: r.item, "Amount (₹)": r.amount })));
          XLSX.utils.book_append_sheet(wb, expWs, "Expenditure");
          XLSX.writeFile(wb, `${type === "Full portfolio report" ? "Full_Portfolio" : "Summary"}_${dateStr}.xlsx`);
        }
      }
    } catch (err: any) {
      setGenError(err.message ?? "Something went wrong generating the report.");
    }
    setGenerating(false);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1" style={{ color: "#111827" }}>Reports</h1>
      <p className="text-sm mb-6" style={{ color: "#6B7280" }}>Generate and download reports for any scope and period</p>
      <div style={{ border: "2px solid #1B4FBB", borderRadius: 12, overflow: "hidden" }}>
        <div className="px-5 py-3 text-sm font-semibold" style={{ background: "#E8F0FE", borderBottom: "1px solid rgba(27,79,187,0.18)", color: "#111827" }}>
          Download report
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 gap-4 mb-5">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#6B7280" }}>Scope</label>
              <select value={scope} onChange={(e) => setScope(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff" }}>
                {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#6B7280" }}>Period</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff" }}>
                {PERIODS.map((p) => <option key={p}>{p}</option>)}
              </select>
              {(period === "Q2 2026" || period === "Full year 2026") && (
                <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>
                  Rent collection matches exact months only — Q2/yearly periods will show expenditure across the range, but rent collection may be empty unless months match exactly.
                </p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "#6B7280" }}>Report type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg" style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", background: "#fff" }}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {genError && (
            <div className="flex items-start gap-2 text-xs px-3 py-2.5 rounded-lg mb-4" style={{ background: "#FCEBEB", color: "#791F1F", border: "1px solid #F7C1C1" }}>
              <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {genError}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => generate("pdf")} disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold"
              style={{ background: generating ? "#9CA3AF" : "#1B4FBB", color: "#fff", border: "none", cursor: generating ? "not-allowed" : "pointer" }}>
              {generating ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />} Download PDF
            </button>
            <button onClick={() => generate("excel")} disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold"
              style={{ background: generating ? "#9CA3AF" : "#1F7244", color: "#fff", border: "none", cursor: generating ? "not-allowed" : "pointer" }}>
              {generating ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />} Download Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
