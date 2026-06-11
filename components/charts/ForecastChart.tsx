"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  Tooltip,
} from "recharts";

import { forecastData } from "@/data/mock";

export default function ForecastChart() {
  return (
    <div
      className="
      bg-slate-900/60
      border
      border-slate-800
      rounded-2xl
      p-6
      h-[350px]
      "
    >
      <h2
        className="
        text-xl
        font-semibold
        mb-5
      "
      >
        Collection Forecast
      </h2>

      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <LineChart data={forecastData}>
          <XAxis dataKey="month" />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#38bdf8"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}