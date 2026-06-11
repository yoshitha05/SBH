"use client";

import { motion } from "framer-motion";

export default function DashboardPreview() {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 40,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.7,
      }}
      className="
      max-w-6xl
      mx-auto
      mt-24
      rounded-3xl
      border
      border-sky-900/40
      bg-slate-900/40
      backdrop-blur-xl
      shadow-[0_0_80px_rgba(56,189,248,0.15)]
      overflow-hidden
      "
    >
      <div className="grid lg:grid-cols-2">
        
        <div className="p-8 border-r border-slate-800">
          <h3 className="text-2xl font-bold mb-8">
            Portfolio Intelligence
          </h3>

          <div className="grid grid-cols-2 gap-4">

            <Card
              title="Total Rent"
              value="₹54,000"
            />

            <Card
              title="Collected"
              value="₹46,000"
            />

            <Card
              title="Outstanding"
              value="₹8,000"
            />

            <Card
              title="Occupancy"
              value="83%"
            />

          </div>
        </div>

        <div className="p-8">
          <h3 className="text-2xl font-bold mb-8">
            Risk Board
          </h3>

          <Risk
            name="Vijay Sharma"
            risk={78}
          />

          <Risk
            name="Meena Iyer"
            risk={52}
          />

          <Risk
            name="Arjun Nair"
            risk={18}
          />
        </div>
      </div>
    </motion.div>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      className="
      bg-slate-800/50
      rounded-2xl
      p-5
      "
    >
      <p className="text-slate-400">
        {title}
      </p>

      <h3 className="text-2xl font-bold mt-2">
        {value}
      </h3>
    </div>
  );
}

function Risk({
  name,
  risk,
}: {
  name: string;
  risk: number;
}) {
  return (
    <div className="mb-6">

      <div className="flex justify-between">
        <span>{name}</span>

        <span>{risk}%</span>
      </div>

      <div
        className="
        h-2
        bg-slate-700
        rounded-full
        mt-2
        "
      >
        <div
          style={{
            width: `${risk}%`,
          }}
          className="
          h-full
          rounded-full
          bg-gradient-to-r
          from-red-500
          to-orange-400
          "
        />
      </div>

    </div>
  );
}