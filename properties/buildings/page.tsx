import { units } from "@/data/unit";
import { tenants } from "@/data/tenants";

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

  const buildingTenants = tenants.filter(
    (tenant) => tenant.building === decodedBuilding
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          {decodedBuilding}
        </h1>
        <p className="text-gray-500">
          Occupied flats, tenant details, and vacancy status for this building.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Occupied Flats</p>
          <p className="text-2xl font-bold">{buildingTenants.length}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Vacant Flats</p>
          <p className="text-2xl font-bold">{Math.max(buildingUnits.length - buildingTenants.length, 0)}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Tenant Details</p>
          <p className="text-2xl font-bold">{buildingTenants.length}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {buildingUnits.map((unit) => (
          <div
            key={unit.id}
            className="border rounded-lg p-4"
          >
            <h2 className="font-semibold">
              Flat {unit.flatNo}
            </h2>

            {buildingTenants.find((tenant) => tenant.flatNo === unit.flatNo) ? (
              <div className="mt-2 text-sm">
                <p className="font-medium">
                  {buildingTenants.find((tenant) => tenant.flatNo === unit.flatNo)?.name}
                </p>
                <p className="text-gray-500">Tenant details available</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                Vacant
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border rounded-lg p-5">
        <h2 className="text-xl font-semibold mb-3">Tenant Details</h2>
        <div className="space-y-3">
          {buildingTenants.length ? (
            buildingTenants.map((tenant) => (
              <div key={tenant.id} className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-3 gap-2 last:border-b-0 last:pb-0">
                <div>
                  <p className="font-medium">{tenant.name}</p>
                  <p className="text-sm text-gray-500">Flat {tenant.flatNo} • {tenant.phone}</p>
                </div>
                <div className="text-sm">
                  <p>Approval: {tenant.approved ? "Approved" : "Pending"}</p>
                  <p>Access: {tenant.accessEnabled ? "Enabled" : "Disabled"}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No tenants assigned to this building yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}