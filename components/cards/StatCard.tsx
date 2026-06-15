"use client";

import { ReactNode } from "react";
import CountUp from "react-countup";

type Props = {
  title: string;
  value: string;
  icon: ReactNode;
};

export default function StatCard({
  title,
  value,
  icon,
}: Props) {
  const number = Number(
    value.replace(/[₹,%]/g, "")
  );

  const hasPercent = value.includes("%");

  return (
    <div
      className="
      bg-slate-900/60
      backdrop-blur-xl
      border
      border-slate-800
      rounded-3xl
      p-6
      shadow-[0_0_30px_rgba(56,189,248,0.1)]
      "
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400">
            {title}
          </p>

          <h2
            className="
            text-3xl
            font-bold
            mt-2
            "
          >
            {hasPercent ? (
              <>
                <CountUp end={number} duration={2} />%
              </>
            ) : (
              <>
                ₹
                <CountUp end={number} duration={2} />
              </>
            )}
          </h2>
        </div>

        <div>{icon}</div>
      </div>
    </div>
  );
}