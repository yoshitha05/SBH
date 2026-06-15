"use client";

import { useMemo, useState } from "react";

const initialRows = [
  { date: "2026-06-01", building: "Ohm", notes: "Lift maintenance", amount: 4200 },
  { date: "2026-06-03", building: "NN Elite", notes: "Water tanker", amount: 1800 },
  { date: "2026-06-04", building: "Overall", notes: "Office supplies", amount: 900 },
];

export default function ExpenditurePage() {
  const [downloadType, setDownloadType] = useState("excel");
  const [scope, setScope] = useState("overall");

  const total = useMemo(() => initialRows.reduce((sum, row) => sum + row.amount, 0), []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenditure</h1>
        <p className="text-gray-500">Owner can enter Excel-style rows, add notes, and choose PDF or Excel export.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="border rounded-xl p-4">
          <label className="text-sm text-gray-500">Download format</label>
          <select className="w-full mt-2 border rounded-lg p-2" value={downloadType} onChange={(e) => setDownloadType(e.target.value)}>
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>

        {downloadType === "pdf" && (
          <div className="border rounded-xl p-4">
            <label className="text-sm text-gray-500">PDF scope</label>
            <select className="w-full mt-2 border rounded-lg p-2" value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="overall">Overall buildings</option>
              <option value="ohm">Ohm</option>
              <option value="nn-elite">NN Elite</option>
              <option value="rvb">RVB</option>
              <option value="renuka">Renuka</option>
              <option value="pearls">Pearls</option>
              <option value="sree-harsha">Sree Harsha</option>
            </select>
          </div>
        )}

        <div className="border rounded-xl p-4">
          <p className="text-sm text-gray-500">Total expenditure</p>
          <p className="text-2xl font-bold mt-1">₹{total.toLocaleString()}</p>
        </div>

        <div className="border rounded-xl p-4 flex items-end">
          <button className="w-full bg-sky-600 text-white rounded-lg py-2">Download {downloadType.toUpperCase()}</button>
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Building</th>
              <th className="text-left p-3">Notes</th>
              <th className="text-left p-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {initialRows.map((row) => (
              <tr key={`${row.date}-${row.building}`} className="border-t">
                <td className="p-3">{row.date}</td>
                <td className="p-3">{row.building}</td>
                <td className="p-3">{row.notes}</td>
                <td className="p-3">₹{row.amount.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}