import { properties } from "@/data/properties";
import { tenants } from "@/data/tenants";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users, Home, TrendingUp, AlertTriangle } from "lucide-react";

const statusStyles: Record<string, { card: string; pill: string; label: string }> = {
  paid:    { card: "border-green-200 bg-green-50",   pill: "bg-green-100 text-green-800 border border-green-300",   label: "Paid" },
  overdue: { card: "border-red-300 bg-red-50",       pill: "bg-red-100 text-red-800 border-2 border-red-400",       label: "Overdue" },
  partial: { card: "border-yellow-300 bg-yellow-50", pill: "bg-yellow-100 text-yellow-800 border border-yellow-300", label: "Partial" },
  pending: { card: "border-blue-200 bg-blue-50",     pill: "bg-blue-100 text-blue-800 border border-blue-200",      label: "Pending" },
  vacant:  { card: "border-gray-200 bg-gray-50",     pill: "bg-gray-100 text-gray-500 border border-gray-200",      label: "Vacant" },
};

const riskStyles: Record<string, string> = {
  low:    "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high:   "bg-red-100 text-red-800",
};

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ building: string }>;
}) {
  const { building } = await params;
  const decodedBuilding = decodeURIComponent(building);

  // Find the property using id or name
  const property =
    properties.find((p) => p.id === decodedBuilding) ??
    properties.find(
      (p) => p.name.toLowerCase() === decodedBuilding.toLowerCase()
    );

  if (!property) notFound();

  const paid    = property.flats.filter((f) => f.status === "paid").length;
  const overdue = property.flats.filter((f) => f.status === "overdue").length;
  const vacant  = property.flats.filter((f) => f.status === "vacant").length;
  const partial = property.flats.filter((f) => f.status === "partial").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "#6B7280" }}>
          <Link href="/owner/properties" className="hover:underline" style={{ color: "#1B4FBB" }}>
            Properties
          </Link>
          <span>/</span>
          <span>{property.name}</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: "#111827" }}>
              {property.name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B7280" }}>
              {property.address}
            </p>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: "#F0C040", color: "#1339A0" }}
          >
            {property.occupiedFlats} / {property.totalFlats} occupied
          </div>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-lg p-3" style={{ background: "#F5F7FB" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <Home size={13} /> Total flats
          </div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>
            {property.totalFlats}
          </div>
        </div>

        <div className="rounded-lg p-3 border-2" style={{ borderColor: "#F0C040", background: "#F5F7FB" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <TrendingUp size={13} /> Monthly rent
          </div>
          <div className="text-xl font-semibold" style={{ color: "#0F6E56" }}>
            ₹{property.monthlyCollection.toLocaleString("en-IN")}
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <Users size={13} /> Tenants
          </div>
          <div className="text-xl font-semibold" style={{ color: "#111827" }}>
            {property.tenantCount}
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: "#FCEBEB", border: "1.5px solid #F7C1C1" }}>
          <div className="flex items-center gap-1.5 text-xs mb-1" style={{ color: "#6B7280" }}>
            <AlertTriangle size={13} /> Overdue
          </div>
          <div className="text-xl font-semibold" style={{ color: "#A32D2D" }}>
            {overdue}
          </div>
        </div>
      </div>

      {/* ── Status summary bar ── */}
      <div
        className="flex gap-3 flex-wrap mb-6 p-3 rounded-lg"
        style={{ background: "#F5F7FB", border: "1.5px solid rgba(27,79,187,0.18)" }}
      >
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-800 border border-green-300">
          {paid} Paid
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-800 border-2 border-red-400">
          {overdue} Overdue
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-800 border border-yellow-300">
          {partial} Partial
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
          {vacant} Vacant
        </span>
      </div>

      {/* ── Flat grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {property.flats.map((flat) => {
          const tenant = flat.tenantId
            ? tenants.find((t) => t.id === flat.tenantId) ??
              tenants.find(
                (t) => t.building === property.name && t.flatNo === flat.flatNo
              )
            : null;

          const style = statusStyles[flat.status] ?? statusStyles.vacant;

          return (
            <div
              key={flat.flatNo}
              className={`border rounded-xl p-4 transition hover:shadow-md ${style.card}`}
            >
              {/* Flat number + status pill */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "#111827" }}>
                  Flat {flat.flatNo}
                </h2>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${style.pill}`}>
                  {style.label}
                </span>
              </div>

              {tenant ? (
                <div className="space-y-2">
                  {/* Tenant name → detail page */}
                  <Link
                    href={`/owner/tenant/${tenant.id}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "#1B4FBB" }}
                  >
                    {tenant.name}
                  </Link>

                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    📞 {tenant.phone}
                  </p>

                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    ✉ {tenant.email}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold" style={{ color: "#111827" }}>
                      ₹{flat.rent.toLocaleString("en-IN")}/mo
                    </span>
                    {tenant.risk && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskStyles[tenant.risk]}`}
                      >
                        {tenant.risk} risk
                      </span>
                    )}
                  </div>

                  {/* Approve / Vacate buttons */}
                  <div className="flex gap-1.5 pt-1 flex-wrap">
                    {!tenant.approved && (
                      <Link
                        href={`/tenant-approvals?id=${tenant.id}`}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium border transition"
                        style={{
                          background: "#E1F5EE",
                          borderColor: "#1D9E75",
                          color: "#085041",
                        }}
                      >
                        Approve
                      </Link>
                    )}
                    {tenant.approved && tenant.accessEnabled && (
                      <Link
                        href={`/owner/tenant/${tenant.id}?action=vacate`}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium border transition"
                        style={{
                          background: "#FCEBEB",
                          borderColor: "#E24B4A",
                          color: "#791F1F",
                        }}
                      >
                        Vacate
                      </Link>
                    )}
                    <Link
                      href={`/owner/tenant/${tenant.id}`}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium border transition"
                      style={{
                        background: "#E8F0FE",
                        borderColor: "rgba(27,79,187,0.3)",
                        color: "#1B4FBB",
                      }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="mt-1">
                  <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>
                    No tenant assigned
                  </p>
                  <button
                    className="text-xs px-2.5 py-1 rounded-lg font-medium border"
                    style={{
                      background: "#E8F0FE",
                      borderColor: "rgba(27,79,187,0.3)",
                      color: "#1B4FBB",
                    }}
                  >
                    + Assign tenant
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}