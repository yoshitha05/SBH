import Sidebar from "@/components/dashboard/Sidebar";
import StatCard from "@/components/cards/StatCard";
import RiskBoard from "@/components/dashboard/RiskBoard";
import ForecastChart from "@/components/charts/ForecastChart";
import AIRecommendations from "@/components/dashboard/AIRecommendations";
import CollectionChart from "@/components/charts/CollectionChart";
import AIInsight from "@/components/dashboard/AIInsight";

import {
  Wallet,
  BadgeIndianRupee,
  AlertTriangle,
} from "lucide-react";

export default function OwnerDashboard() {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-8">
        <h1 className="text-4xl font-black mb-10">
          Portfolio Intelligence
        </h1>

        {/* KPI CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          <StatCard
            title="Total Rent"
            value="₹54,000"
            icon={<Wallet />}
          />

          <StatCard
            title="Collected"
            value="₹46,000"
            icon={<BadgeIndianRupee />}
          />

          <StatCard
            title="Outstanding"
            value="₹8,000"
            icon={<AlertTriangle />}
          />
        </div>

        {/* CHARTS */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <CollectionChart />
          <ForecastChart />
        </div>

        {/* RISK + AI */}
        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <RiskBoard />
          <AIInsight />
        </div>

        {/* RECOMMENDATIONS */}
        <div className="mt-8">
          <AIRecommendations />
        </div>
      </main>
    </div>
  );
}