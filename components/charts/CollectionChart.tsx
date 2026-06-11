"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
} from "recharts";

import { collectionData } from "@/data/mock";

export default function CollectionChart() {
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
        Collection Overview
      </h2>

      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart data={collectionData}>
          <XAxis dataKey="name" />

          <Tooltip />

          <Area
            type="monotone"
            dataKey="collected"
            stroke="#38bdf8"
            fill="#38bdf8"
            fillOpacity={0.2}
          />

          <Area
            type="monotone"
            dataKey="pending"
            stroke="#ef4444"
            fill="#ef4444"
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}