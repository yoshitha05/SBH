"use client";

// app/admin/expenditure/page.tsx
//
// Fixed: previously, having zero sheets caused the ENTIRE page (header,
// all 4 tabs) to be replaced by a single "No sheets yet" screen. Now the
// header and all 4 tabs always render; "No sheets yet" only appears
// inside the Ledger tab's own content area, so MS Excel/Notes/Export
// remain fully usable even for a brand-new account with zero sheets.

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabaseClient";
import {
  Plus, Trash2, Download, FileSpreadsheet, FileText, StickyNote, Save,
  ChevronDown, ExternalLink, X, Pencil, Loader2, AlertTriangle,
} from "lucide-react";

type ColType = "text" | "number" | "date" | "select";
type ColDef = { key: string; label: string; type: ColType; options?: string[] };
type RowData = Record<string, string | number>;

type SheetRow = { id: number; owner_id: string; name: string; columns: ColDef[]; deletable: boolean };
type LedgerRow = { id: number; sheet_id: number; data: RowData };

const BUILDINGS = ["Ohm", "NN Elite", "RVB", "Renuka", "Pearls", "Sree Harsha", "All buildings"];
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function AdminExpenditurePage() {
  const [sheets, setSheets] = useState<SheetRow[]>([]);
  const [rowsBySheet, setRowsBySheet] = useState<Record<number, LedgerRow[]>>({});
  const [activeSheetId, setActiveSheetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [mainTab, setMainTab] = useState<"ledger" | "notes" | "export" | "msexcel">("ledger");

  const [noteTab, setNoteTab] = useState("general");
  const [currentNoteId, setCurrentNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const [showNewSheet, setShowNewSheet] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [newCols, setNewCols] = useState<ColDef[]>([{ key: "col1", label: "", type: "text" }]);

  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const cellRefs = useRef<Record<string, HTMLInputElement | HTMLSelectElement | null>>({});

  async function loadAll() {
    setLoading(true);
    setLoadError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadError("Not signed in."); setLoading(false); return; }

    const { data: sheetData, error: sheetError } = await supabase
      .from("ledger_sheets")
      .select("*")
      .eq("owner_id", user.id)
      .order("id", { ascending: true });

    if (sheetError) {
      setLoadError(sheetError.message);
      setLoading(false);
      return;
    }

    const { data: rowData, error: rowError } = await supabase
      .from("ledger_rows")
      .select("*")
      .eq("owner_id", user.id)
      .order("id", { ascending: true });

    if (rowError) {
      setLoadError(rowError.message);
      setLoading(false);
      return;
    }

    const grouped: Record<number, LedgerRow[]> = {};
    (rowData ?? []).forEach((r) => {
      grouped[r.sheet_id] = grouped[r.sheet_id] ?? [];
      grouped[r.sheet_id].push(r);
    });

    setSheets(sheetData ?? []);
    setRowsBySheet(grouped);
    if (sheetData && sheetData.length > 0 && activeSheetId === null) {
      setActiveSheetId(sheetData[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    async function loadNote() {
      setNoteLoading(true);
      setSavedMsg("");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setNoteLoading(false); return; }

      const { data } = await supabase
        .from("expenditure_notes")
        .select("*")
        .eq("scope", noteTab)
        .eq("owner_id", user.id)
        .maybeSingle();

      setCurrentNoteId(data?.id ?? null);
      setNoteText(data?.content ?? "");
      setNoteLoading(false);
    }
    loadNote();
  }, [noteTab]);

  async function saveNote() {
    setSavedMsg("");

    if (currentNoteId) {
      const { error } = await supabase.from("expenditure_notes").update({ content: noteText }).eq("id", currentNoteId);
      if (error) { setSavedMsg(`Error: ${error.message}`); return; }
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSavedMsg("Error: Not signed in."); return; }
      const { data, error } = await supabase
        .from("expenditure_notes")
        .insert({ scope: noteTab, content: noteText, owner_id: user.id })
        .select()
        .single();
      if (error) { setSavedMsg(`Error: ${error.message}`); return; }
      setCurrentNoteId(data.id);
    }
    setSavedMsg(`Saved at ${new Date().toLocaleTimeString()}`);
    setTimeout(() => setSavedMsg(""), 3000);
  }

  const activeSheet = sheets.find((s) => s.id === activeSheetId) ?? sheets[0];
  const activeRows = activeSheet ? (rowsBySheet[activeSheet.id] ?? []) : [];
  const isDefaultLedger = activeSheet?.name === "Expense Ledger" && !activeSheet?.deletable;

  const grandTotal = isDefaultLedger
    ? activeRows.reduce((s, r) => s + (Number(r.data.amount) || 0), 0)
    : null;

  async function updateCell(rowIdx: number, key: string, val: string | number) {
    if (!activeSheet) return;
    const row = activeRows[rowIdx];
    if (!row) return;

    setRowsBySheet((prev) => {
      const list = [...(prev[activeSheet.id] ?? [])];
      list[rowIdx] = { ...list[rowIdx], data: { ...list[rowIdx].data, [key]: val } };
      return { ...prev, [activeSheet.id]: list };
    });

    const newData = { ...row.data, [key]: val };
    const { error } = await supabase.from("ledger_rows").update({ data: newData }).eq("id", row.id);
    if (error) setLoadError(error.message);
  }

  async function addRowToActiveSheet() {
    if (!activeSheet) return;
    const blankRow: RowData = {};
    activeSheet.columns.forEach((c) => {
      if (c.key === "date") blankRow[c.key] = new Date().toISOString().split("T")[0];
      else if (c.type === "select" && c.options) blankRow[c.key] = c.options[0];
      else if (c.type === "number") blankRow[c.key] = 0;
      else blankRow[c.key] = "";
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadError("Not signed in."); return; }

    const { data, error } = await supabase
      .from("ledger_rows")
      .insert({ sheet_id: activeSheet.id, data: blankRow, owner_id: user.id })
      .select()
      .single();

    if (error) {
      setLoadError(error.message);
      return;
    }
    setRowsBySheet((prev) => ({
      ...prev,
      [activeSheet.id]: [...(prev[activeSheet.id] ?? []), data],
    }));
  }

  async function deleteRowFromActiveSheet(rowIdx: number) {
    if (!activeSheet) return;
    const row = activeRows[rowIdx];
    if (!row) return;
    if (!confirm("Delete this row?")) return;

    const { error } = await supabase.from("ledger_rows").delete().eq("id", row.id);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setRowsBySheet((prev) => ({
      ...prev,
      [activeSheet.id]: (prev[activeSheet.id] ?? []).filter((r) => r.id !== row.id),
    }));
  }

  function openNewSheetModal() {
    setNewSheetName(`Sheet ${sheets.length + 1}`);
    setNewCols([{ key: "col1", label: "", type: "text" }]);
    setShowNewSheet(true);
  }
  function addColDefRow() {
    setNewCols((prev) => [...prev, { key: `col${prev.length + 1}`, label: "", type: "text" }]);
  }
  function updateColDef(idx: number, field: "label" | "type", val: string) {
    setNewCols((prev) => prev.map((c, i) => i === idx ? { ...c, [field]: val as any } : c));
  }
  function removeColDef(idx: number) {
    setNewCols((prev) => prev.filter((_, i) => i !== idx));
  }
  async function createSheet() {
    const validCols = newCols.filter((c) => c.label.trim() !== "");
    if (validCols.length === 0) { alert("Add at least one column with a name."); return; }
    if (!newSheetName.trim()) { alert("Give the sheet a name."); return; }

    const colsWithKeys = validCols.map((c, i) => ({ ...c, key: `col${i + 1}` }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Not signed in."); return; }

    const { data: newSheet, error } = await supabase
      .from("ledger_sheets")
      .insert({ name: newSheetName.trim(), columns: colsWithKeys, deletable: true, owner_id: user.id })
      .select()
      .single();

    if (error) {
      alert(`Couldn't create sheet: ${error.message}`);
      return;
    }

    const blankRow: RowData = {};
    colsWithKeys.forEach((c) => { blankRow[c.key] = c.type === "number" ? 0 : ""; });

    const { data: firstRow } = await supabase
      .from("ledger_rows")
      .insert({ sheet_id: newSheet.id, data: blankRow, owner_id: user.id })
      .select()
      .single();

    setSheets((prev) => [...prev, newSheet]);
    setRowsBySheet((prev) => ({ ...prev, [newSheet.id]: firstRow ? [firstRow] : [] }));
    setActiveSheetId(newSheet.id);
    setShowNewSheet(false);
  }
  function startRename(sheet: SheetRow) {
    setRenamingId(sheet.id);
    setRenameValue(sheet.name);
  }
  async function commitRename() {
    if (renamingId !== null && renameValue.trim()) {
      const { error } = await supabase.from("ledger_sheets").update({ name: renameValue.trim() }).eq("id", renamingId);
      if (!error) {
        setSheets((prev) => prev.map((s) => s.id === renamingId ? { ...s, name: renameValue.trim() } : s));
      }
    }
    setRenamingId(null);
  }
  async function deleteSheet(id: number) {
    if (!confirm("Delete this sheet? This cannot be undone.")) return;
    await supabase.from("ledger_rows").delete().eq("sheet_id", id);
    const { error } = await supabase.from("ledger_sheets").delete().eq("id", id);
    if (error) {
      alert(`Couldn't delete sheet: ${error.message}`);
      return;
    }
    setSheets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSheetId === id) setActiveSheetId(next[0]?.id ?? null);
      return next;
    });
    setRowsBySheet((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function openExcel() {
    window.open("https://excel.cloud.microsoft/en-gb/", "_blank", "noopener,noreferrer");
  }

  function handleKeyDown(e: KeyboardEvent, rowIdx: number, colIdx: number) {
    if (!activeSheet) return;
    const numRows = activeRows.length;
    const numCols = activeSheet.columns.length;
    let nextRow = rowIdx, nextCol = colIdx;
    if (e.key === "Enter" || e.key === "ArrowDown") { nextRow = Math.min(rowIdx + 1, numRows - 1); e.preventDefault(); }
    else if (e.key === "ArrowUp") { nextRow = Math.max(rowIdx - 1, 0); e.preventDefault(); }
    else if (e.key === "Tab" && !e.shiftKey) {
      nextCol = colIdx + 1;
      if (nextCol >= numCols) { nextCol = 0; nextRow = Math.min(rowIdx + 1, numRows - 1); }
      e.preventDefault();
    } else if (e.key === "Tab" && e.shiftKey) {
      nextCol = colIdx - 1;
      if (nextCol < 0) { nextCol = numCols - 1; nextRow = Math.max(rowIdx - 1, 0); }
      e.preventDefault();
    } else return;

    const key = `${nextRow}-${nextCol}`;
    cellRefs.current[key]?.focus();
    setSelectedCell({ row: nextRow, col: nextCol });
  }

  function exportExcel() {
    if (!activeSheet) return;
    const cols = activeSheet.columns;
    const data = activeRows.map((r) => {
      const obj: Record<string, any> = {};
      cols.forEach((c) => { obj[c.label] = r.data[c.key] ?? ""; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeSheet.name.slice(0, 31));
    XLSX.writeFile(wb, `${activeSheet.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`);
    setShowExport(false);
  }

  function exportPDF() {
    if (!activeSheet) return;
    const cols = activeSheet.columns;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(activeSheet.name, 14, 16);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`Generated ${new Date().toLocaleDateString("en-IN")}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [cols.map((c) => c.label)],
      body: activeRows.map((r) => cols.map((c) => String(r.data[c.key] ?? ""))),
      headStyles: { fillColor: [27, 79, 187] },
      styles: { fontSize: 8 },
    });
    doc.save(`${activeSheet.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
    setShowExport(false);
  }

  if (loading) {
    return (
      <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
        <Loader2 size={28} className="mx-auto mb-3 animate-spin opacity-50" />
        <p className="text-sm">Loading expenditure ledger from database...</p>
      </div>
    );
  }
  if (loadError && sheets.length === 0) {
    return (
      <div className="p-10 text-center" style={{ color: "#A32D2D" }}>
        <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">Couldn't load the ledger from the database</p>
        <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>{loadError}</p>
      </div>
    );
  }

  // NOTE: no early return for "no sheets" anymore — the header and all
  // 4 tabs always render below; the Ledger tab's own content handles
  // the zero-sheets case internally.

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>Expenditure</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
            Admin editable — multiple sheets, saved to the database automatically
          </p>
        </div>
        {mainTab === "ledger" && activeSheet && (
          <div className="flex gap-2">
            <button onClick={addRowToActiveSheet}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
              style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
              <Plus size={14} /> Add row
            </button>
            <div className="relative">
              <button onClick={() => setShowExport((s) => !s)}
                className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
                style={{ background: "#F0C040", color: "#1339A0", border: "none", cursor: "pointer" }}>
                <Download size={14} /> Export <ChevronDown size={13} />
              </button>
              {showExport && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowExport(false)} />
                  <div className="absolute right-0 mt-1 rounded-lg overflow-hidden z-20"
                    style={{ background: "#fff", border: "1.5px solid rgba(27,79,187,0.18)", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: 180 }}>
                    <button onClick={exportPDF}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left"
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "#111827" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F5F7FB"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <FileText size={14} style={{ color: "#1B4FBB" }} /> Download as PDF
                    </button>
                    <button onClick={exportExcel}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left"
                      style={{ background: "transparent", border: "none", cursor: "pointer", color: "#111827", borderTop: "1px solid rgba(27,79,187,0.08)" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#F5F7FB"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <FileSpreadsheet size={14} style={{ color: "#1F7244" }} /> Download as Excel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {mainTab === "ledger" && isDefaultLedger && activeSheet && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-lg p-3" style={{ background: "#FCEBEB", border: "1.5px solid #F7C1C1" }}>
            <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Total spent</div>
            <div className="text-xl font-semibold" style={{ color: "#A32D2D" }}>₹{(grandTotal ?? 0).toLocaleString("en-IN")}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "2px solid #F0C040" }}>
            <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Entries</div>
            <div className="text-xl font-semibold" style={{ color: "#111827" }}>{activeRows.length}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
            <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Sheets</div>
            <div className="text-xl font-semibold" style={{ color: "#111827" }}>{sheets.length}</div>
          </div>
          <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
            <div className="text-xs mb-1" style={{ color: "#6B7280" }}>Top category</div>
            <div className="text-sm font-semibold" style={{ color: "#111827" }}>
              {Object.entries(activeRows.reduce((acc, r) => {
                const cat = String(r.data.category ?? "—");
                acc[cat] = Number(acc[cat] ?? 0) + (Number(r.data.amount) || 0);
                return acc;
              }, {} as Record<string, number>))
                .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] ?? "—"}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-0 mb-5" style={{ borderBottomWidth: 1, borderBottomStyle: "solid", borderBottomColor: "rgba(27,79,187,0.12)" }}>
        {(["ledger","msexcel","notes","export"] as const).map((t) => (
          <button key={t} onClick={() => setMainTab(t)}
            className="px-5 py-2.5 text-sm font-medium capitalize"
            style={{
              borderTop: "none", borderLeft: "none", borderRight: "none",
              borderBottomWidth: 2, borderBottomStyle: "solid",
              borderBottomColor: mainTab===t ? "#1B4FBB" : "transparent",
              color: mainTab===t?"#1B4FBB":"#6B7280", background:"transparent", cursor:"pointer",
            }}>
            {t === "ledger" ? "Expense ledger" : t === "msexcel" ? "MS Excel" : t === "notes" ? "Notes" : "Export"}
          </button>
        ))}
      </div>

      {mainTab === "ledger" && (
        <div>
          {loadError && <p className="text-xs mb-2" style={{ color: "#A32D2D" }}>{loadError}</p>}

          {!activeSheet ? (
            <div className="p-10 text-center" style={{ color: "#9CA3AF" }}>
              <FileSpreadsheet size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sheets yet</p>
              <button onClick={openNewSheetModal} className="text-xs mt-2" style={{ color: "#1B4FBB", background: "none", border: "none", cursor: "pointer" }}>+ Create your first sheet</button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 mb-3 flex-wrap">
                {sheets.map((sheet) => {
                  const isActive = sheet.id === activeSheetId;
                  const isRenaming = renamingId === sheet.id;
                  return (
                    <div key={sheet.id}
                      className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: isActive ? "#1B4FBB" : "#F5F7FB",
                        color: isActive ? "#fff" : "#6B7280",
                        border: isActive ? "none" : "1px solid rgba(27,79,187,0.15)",
                        cursor: "pointer",
                      }}
                      onClick={() => !isRenaming && setActiveSheetId(sheet.id)}>
                      {isRenaming ? (
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                          onBlur={commitRename}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-1 rounded"
                          style={{ background: "#fff", color: "#111827", border: "1px solid #1B4FBB", outline: "none", width: 100 }}
                        />
                      ) : (
                        <>
                          <span>{sheet.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); startRename(sheet); }}
                            className="opacity-0 group-hover:opacity-100"
                            style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? "#fff" : "#9CA3AF", display: "flex" }}>
                            <Pencil size={11} />
                          </button>
                          {sheet.deletable && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteSheet(sheet.id); }}
                              className="opacity-0 group-hover:opacity-100"
                              style={{ background: "none", border: "none", cursor: "pointer", color: isActive ? "#fff" : "#9CA3AF", display: "flex" }}>
                              <X size={12} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
                <button onClick={openNewSheetModal}
                  className="flex items-center justify-center w-7 h-7 rounded-lg"
                  style={{ background: "#E8F0FE", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", cursor: "pointer" }}
                  title="Add new sheet">
                  <Plus size={14} />
                </button>
              </div>

              <div style={{ border: "1px solid #D1D5DB", borderRadius: 6, overflow: "auto", background: "#fff" }}>
                <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36, background: "#F1F3F5", border: "1px solid #D1D5DB", color: "#6B7280", fontWeight: 500, fontSize: 11 }}></th>
                      {activeSheet.columns.map((col, i) => (
                        <th key={col.key}
                          style={{ background: "#F1F3F5", border: "1px solid #D1D5DB", color: "#6B7280", fontWeight: 500, fontSize: 11, padding: "4px 8px" }}>
                          {LETTERS[i] ?? "?"}
                        </th>
                      ))}
                      <th style={{ width: 36, background: "#F1F3F5", border: "1px solid #D1D5DB" }}></th>
                    </tr>
                    <tr>
                      <th style={{ background: "#E8F0FE", border: "1px solid #D1D5DB", color: "#1B4FBB", fontWeight: 600, fontSize: 11 }}>#</th>
                      {activeSheet.columns.map((col) => (
                        <th key={col.key}
                          style={{ background: "#E8F0FE", border: "1px solid #D1D5DB", color: "#1B4FBB", fontWeight: 600, fontSize: 12, padding: "6px 8px", textAlign: col.type === "number" ? "right" : "left" }}>
                          {col.label}
                        </th>
                      ))}
                      <th style={{ background: "#E8F0FE", border: "1px solid #D1D5DB" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeRows.map((row, rowIdx) => (
                      <tr key={row.id} style={{ background: rowIdx % 2 === 0 ? "#fff" : "#FAFBFC" }}>
                        <td style={{ border: "1px solid #E5E7EB", background: "#F1F3F5", color: "#9CA3AF", fontSize: 11, textAlign: "center", fontWeight: 500 }}>
                          {rowIdx + 1}
                        </td>
                        {activeSheet.columns.map((col, colIdx) => {
                          const cellKey = `${rowIdx}-${colIdx}`;
                          const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                          const cellStyle: React.CSSProperties = {
                            border: "1px solid #E5E7EB", padding: 0,
                            outline: isSelected ? "2px solid #1B4FBB" : "none", outlineOffset: -2,
                          };
                          if (col.type === "select") {
                            return (
                              <td key={col.key} style={cellStyle}>
                                <select
                                  ref={(el) => { cellRefs.current[cellKey] = el; }}
                                  value={row.data[col.key] as string}
                                  onChange={(e) => updateCell(rowIdx, col.key, e.target.value)}
                                  onFocus={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                                  onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                  className="w-full px-2 py-1.5 text-xs"
                                  style={{ border: "none", outline: "none", color: "#111827", background: "transparent", cursor: "pointer" }}>
                                  {(col.options ?? []).map((o) => <option key={o}>{o}</option>)}
                                </select>
                              </td>
                            );
                          }
                          return (
                            <td key={col.key} style={cellStyle}>
                              <input
                                ref={(el) => { cellRefs.current[cellKey] = el; }}
                                type={col.type === "number" ? "number" : col.type === "date" ? "date" : "text"}
                                value={row.data[col.key] as string | number}
                                onChange={(e) => updateCell(rowIdx, col.key, col.type === "number" ? +e.target.value : e.target.value)}
                                onFocus={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                                onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                                placeholder={col.type === "text" ? "Type here..." : ""}
                                className="w-full px-2 py-1.5 text-xs"
                                style={{
                                  border: "none", outline: "none", color: "#111827", background: "transparent",
                                  textAlign: col.type === "number" ? "right" : "left",
                                  fontWeight: col.type === "number" ? 500 : 400,
                                }} />
                            </td>
                          );
                        })}
                        <td style={{ border: "1px solid #E5E7EB", textAlign: "center" }}>
                          <button onClick={() => deleteRowFromActiveSheet(rowIdx)}
                            className="w-6 h-6 rounded flex items-center justify-center mx-auto"
                            style={{ background: "transparent", border: "none", color: "#D1D5DB", cursor: "pointer" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background="#FCEBEB"; e.currentTarget.style.color="#A32D2D"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#D1D5DB"; }}>
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={activeSheet.columns.length + 2} style={{ border: "1px solid #E5E7EB", padding: 0 }}>
                        <button onClick={addRowToActiveSheet}
                          className="w-full flex items-center gap-1.5 px-3 py-2 text-xs"
                          style={{ background: "#FAFBFC", border: "none", color: "#9CA3AF", cursor: "pointer", textAlign: "left" }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#F5F7FB"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "#FAFBFC"}>
                          <Plus size={12} /> Click to add a new row
                        </button>
                      </td>
                    </tr>
                    {isDefaultLedger && (
                      <tr>
                        <td colSpan={4} style={{ border: "1px solid #D1D5DB", background: "#FAEEDA", textAlign: "right", padding: "8px 12px", fontWeight: 600, fontSize: 12, color: "#633806" }}>
                          TOTAL
                        </td>
                        <td style={{ border: "1px solid #D1D5DB", background: "#FAEEDA", textAlign: "right", padding: "8px 12px", fontWeight: 700, fontSize: 13, color: "#854F0B" }}>
                          ₹{(grandTotal ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td style={{ border: "1px solid #D1D5DB", background: "#FAEEDA" }}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {mainTab === "msexcel" && (
        <div className="rounded-xl p-10 text-center" style={{ border: "2px dashed rgba(27,79,187,0.25)", background: "#F5F7FB" }}>
          <FileSpreadsheet size={32} className="mx-auto mb-3" style={{ color: "#1B4FBB", opacity: 0.5 }} />
          <p className="text-sm font-medium mb-1" style={{ color: "#111827" }}>Open Microsoft Excel</p>
          <p className="text-xs mb-4" style={{ color: "#9CA3AF" }}>
            Opens excel.cloud.microsoft in a new tab — sign in there with your Microsoft account
          </p>
          <button onClick={openExcel}
            className="inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg font-semibold"
            style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
            <ExternalLink size={15} /> Open Microsoft Excel
          </button>
        </div>
      )}

      {mainTab === "notes" && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            {["general", ...BUILDINGS.filter((b) => b !== "All buildings")].map((b) => (
              <button key={b} onClick={() => setNoteTab(b)}
                className="text-xs px-3 py-1.5 rounded-lg font-medium"
                style={noteTab===b ? { background:"#1B4FBB", color:"#fff", border:"none" } : { background:"#F5F7FB", color:"#6B7280", border:"1px solid rgba(27,79,187,0.15)" }}>
                {b === "general" ? "General" : b}
              </button>
            ))}
          </div>
          <div style={{ border: "1.5px solid rgba(27,79,187,0.18)", borderRadius: 10, overflow: "hidden" }}>
            <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium"
              style={{ background: "#F5F7FB", borderBottom: "1px solid rgba(27,79,187,0.12)", color: "#111827" }}>
              <StickyNote size={14} style={{ color: "#1B4FBB" }} />
              Notes — {noteTab === "general" ? "General" : noteTab}
            </div>
            <textarea
              value={noteLoading ? "Loading..." : noteText}
              onChange={(e) => setNoteText(e.target.value)}
              disabled={noteLoading}
              placeholder={`Add notes for ${noteTab}...`}
              className="w-full px-4 py-3 text-sm resize-y min-h-48"
              style={{ border: "none", outline: "none", color: "#111827", lineHeight: 1.7, background: "#fff" }} />
          </div>
          <div className="flex items-center gap-3 mt-3">
            <button onClick={saveNote} disabled={noteLoading}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
              style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: noteLoading ? "not-allowed" : "pointer" }}>
              <Save size={13} /> Save note
            </button>
            {savedMsg && <span className="text-xs" style={{ color: savedMsg.startsWith("Error") ? "#A32D2D" : "#0F6E56" }}>{savedMsg}</span>}
          </div>
        </div>
      )}

      {mainTab === "export" && (
        activeSheet ? (
          <div style={{ border: "2px solid #1B4FBB", borderRadius: 12, overflow: "hidden" }}>
            <div className="px-5 py-3 text-sm font-semibold flex items-center gap-2"
              style={{ background: "#E8F0FE", borderBottom: "1px solid rgba(27,79,187,0.18)", color: "#111827" }}>
              <Download size={15} style={{ color: "#1B4FBB" }} /> Download "{activeSheet.name}"
            </div>
            <div className="p-5">
              <p className="text-xs mb-4" style={{ color: "#6B7280" }}>
                Exports the currently active sheet ({activeSheet.name}). Switch sheets in the Expense ledger tab to export a different one.
              </p>
              <div className="flex gap-3">
                <button onClick={exportPDF}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold"
                  style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                  <FileText size={15} /> Download PDF
                </button>
                <button onClick={exportExcel}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold"
                  style={{ background: "#1F7244", color: "#fff", border: "none", cursor: "pointer" }}>
                  <FileSpreadsheet size={15} /> Download Excel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-8 text-center" style={{ border: "1px solid #E5E7EB", color: "#9CA3AF" }}>
            <Download size={24} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Create a sheet first to export it</p>
          </div>
        )
      )}

      {showNewSheet && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(17,24,39,0.5)" }}>
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: "#fff" }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: "#111827" }}>New sheet</h2>

            <label className="text-xs font-medium mb-1 block" style={{ color: "#6B7280" }}>Sheet name</label>
            <input
              value={newSheetName}
              onChange={(e) => setNewSheetName(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg mb-4"
              style={{ border: "1.5px solid rgba(27,79,187,0.25)", color: "#111827", outline: "none" }}
              placeholder="e.g. June Repairs"
            />

            <label className="text-xs font-medium mb-2 block" style={{ color: "#6B7280" }}>Columns</label>
            <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
              {newCols.map((col, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    value={col.label}
                    onChange={(e) => updateColDef(idx, "label", e.target.value)}
                    placeholder={`Column ${idx + 1} name`}
                    className="flex-1 px-3 py-2 text-sm rounded-lg"
                    style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827", outline: "none" }}
                  />
                  <select
                    value={col.type}
                    onChange={(e) => updateColDef(idx, "type", e.target.value)}
                    className="px-2 py-2 text-xs rounded-lg"
                    style={{ border: "1.5px solid rgba(27,79,187,0.2)", color: "#111827" }}>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                  {newCols.length > 1 && (
                    <button onClick={() => removeColDef(idx)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF" }}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addColDefRow}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium mb-5"
              style={{ background: "#F5F7FB", color: "#1B4FBB", border: "1px solid rgba(27,79,187,0.2)", cursor: "pointer" }}>
              <Plus size={12} /> Add column
            </button>

            <div className="flex gap-3">
              <button onClick={() => setShowNewSheet(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium"
                style={{ background: "#F5F7FB", color: "#6B7280", border: "1px solid rgba(27,79,187,0.15)", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={createSheet}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold"
                style={{ background: "#1B4FBB", color: "#fff", border: "none", cursor: "pointer" }}>
                Create sheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
