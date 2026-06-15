import { units } from "@/data/unit";
import { tenants } from "@/data/tenants";
import Link from "next/link";

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ building: string }>;
}) {
  const { building } = await params;

  const decodedBuilding = decodeURIComponent(building);

  const buildingUnits = units.filter(
    (unit) => unit.building === decodedBuilding
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{decodedBuilding}</h1>
        <p className="text-gray-500">
          Total Units: {buildingUnits.length}
        </p>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {buildingUnits.map((unit) => {
          const tenant = tenants.find(
            (t) =>
              t.building === decodedBuilding &&
              t.flatNo === unit.flatNo
          );

          return (
            <div
              key={unit.id}
              className="border rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <h2 className="text-lg font-semibold">
                Flat {unit.flatNo}
              </h2>

              {tenant ? (
                <div className="mt-3 space-y-2">
                <Link
                href={`/tenants/${tenant.id}`}
                className="font-medium text-blue-600 hover:underline"> 
                {tenant.name} </Link> 

                  <p className="text-sm text-gray-500">
                    📞 {tenant.phone}
                  </p>

                  <p className="text-sm font-medium">
                    ₹{tenant.rent.toLocaleString()}/month
                  </p>

                  <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                    Occupied
                  </span>

                  <div>
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${
                        tenant.risk === "low"
                          ? "bg-green-100 text-green-700"
                          : tenant.risk === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      Risk: {tenant.risk}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-3">
                  <span className="inline-block px-2 py-1 text-xs rounded bg-red-100 text-red-600">
                    Vacant
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}