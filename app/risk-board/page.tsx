import { tenants } from "@/data/tenants";

export default function RiskBoardPage() {
  const highRisk = tenants.filter(
    (tenant) => tenant.risk === "high"
  );

  const mediumRisk = tenants.filter(
    (tenant) => tenant.risk === "medium"
  );

  const lowRisk = tenants.filter(
    (tenant) => tenant.risk === "low"
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        AI Risk Board
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* High Risk */}
        <div className="border rounded-xl p-4">
          <h2 className="text-red-600 font-bold mb-4">
            High Risk
          </h2>

          {highRisk.map((tenant) => (
            <div
              key={tenant.id}
              className="border rounded-lg p-3 mb-3"
            >
              <p className="font-semibold">
                {tenant.name}
              </p>

              <p className="text-sm text-gray-500">
                {tenant.building} - {tenant.flatNo}
              </p>

              <p className="text-sm mt-2">
                Risk Score: 85%
              </p>
            </div>
          ))}
        </div>

        {/* Medium Risk */}
        <div className="border rounded-xl p-4">
          <h2 className="text-yellow-600 font-bold mb-4">
            Medium Risk
          </h2>

          {mediumRisk.map((tenant) => (
            <div
              key={tenant.id}
              className="border rounded-lg p-3 mb-3"
            >
              <p className="font-semibold">
                {tenant.name}
              </p>

              <p className="text-sm text-gray-500">
                {tenant.building} - {tenant.flatNo}
              </p>

              <p className="text-sm mt-2">
                Risk Score: 60%
              </p>
            </div>
          ))}
        </div>

        {/* Low Risk */}
        <div className="border rounded-xl p-4">
          <h2 className="text-green-600 font-bold mb-4">
            Low Risk
          </h2>

          {lowRisk.map((tenant) => (
            <div
              key={tenant.id}
              className="border rounded-lg p-3 mb-3"
            >
              <p className="font-semibold">
                {tenant.name}
              </p>

              <p className="text-sm text-gray-500">
                {tenant.building} - {tenant.flatNo}
              </p>

              <p className="text-sm mt-2">
                Risk Score: 25%
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}