import { units } from "@/data/unit";
import { tenants } from "@/data/tenants";

export default function DashboardPage() {
  const totalUnits = units.length;

  const occupiedUnits = tenants.length;

  const vacantUnits = totalUnits - occupiedUnits;

  const totalRevenue = tenants.reduce(
    (sum, tenant) => sum + tenant.rent,
    0
  ); 

  const highRiskTenants = tenants.filter(
    (tenant) => tenant.risk === "high"
  ).length;

  const buildings = new Set(
    units.map((unit) => unit.building)
  ).size;

  const cards = [
    {
      title: "Buildings",
      value: buildings,
    },
    {
      title: "Total Units",
      value: totalUnits,
    },
    {
      title: "Occupied Units",
      value: occupiedUnits,
    },
    {
      title: "Vacant Units",
      value: vacantUnits,
    },
    {
      title: "Monthly Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
    },
    {
      title: "High Risk Tenants",
      value: highRiskTenants,
    },
  ];

  return (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">
      Dashboard
    </h1>

    {/* Analytics Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className="bg-white border rounded-xl p-5 shadow-sm"
        >
          <p className="text-gray-500 text-sm">
            {card.title}
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {card.value}
          </h2>
        </div>
      ))}
    </div>

    {/* Recent Tenants */}
    <div className="mt-8 bg-white border rounded-xl p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Recent Tenants
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Name</th>
              <th className="text-left py-3">Building</th>
              <th className="text-left py-3">Flat</th>
              <th className="text-left py-3">Rent</th>
              <th className="text-left py-3">Risk</th>
            </tr>
          </thead>

          <tbody>
            {tenants.slice(0, 5).map((tenant) => (
              <tr
                key={tenant.id}
                className="border-b hover:bg-gray-50"
              >
                <td className="py-3">
                  {tenant.name}
                </td>

                <td className="py-3">
                  {tenant.building}
                </td>

                <td className="py-3">
                  {tenant.flatNo}
                </td>

                <td className="py-3">
                  ₹{tenant.rent.toLocaleString()}
                </td>

                <td className="py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      tenant.risk === "low"
                        ? "bg-green-100 text-green-700"
                        : tenant.risk === "medium"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {tenant.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}