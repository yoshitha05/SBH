"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { collections } from "@/data/collections";
import { ul } from "framer-motion/m";
import { insights } from "@/data/insights";

export default function ReportsPage() {
  const generateReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("RentFlow Collection Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [
        [
          "Tenant",
          "Building",
          "Flat",
          "Amount",
          "Status",
        ],
      ],
      body: collections.map((item) => [
        item.tenantName,
        item.building,
        item.flatNo,
        `₹${item.amount}`,
        item.status,
      ]),
    });

    doc.save("RentFlow-Report.pdf");
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">
        Reports
      </h1>

      <p className="text-gray-500 mb-6">
        Generate downloadable reports.
      </p>

      <div className="border rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">
            AI Insights
        </h2>

        <ul className="space-y-2">
            {insights.map((item, index) => (
            <li key={index}>• {item}</li>
            ))}
        </ul>
        </div>

      <button
        onClick={generateReport}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Download Collection Report
      </button>
    </div>
  );
}