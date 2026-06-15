import { units } from "@/data/unit";
import { tenants } from "@/data/tenants";

type Props = {
params: Promise<{
id: string;
}>;
};

export default async function PropertyDetailsPage({
params,
}: Props) {
const { id } = await params;

const buildingName = decodeURIComponent(id);

const buildingUnits = units.filter(
(unit) => unit.building === buildingName
);

const buildingTenants = tenants.filter(
(tenant) => tenant.building === buildingName
);

const totalFlats = buildingUnits.length;
const occupiedFlats = buildingTenants.length;
const vacantFlats = totalFlats - occupiedFlats;

return ( <div className="p-8 space-y-8"> <div> <h1 className="text-4xl font-bold">
{buildingName} </h1>

    <p className="text-gray-500 mt-2">
      Building overview and tenant details
    </p>
  </div>

  <div className="grid md:grid-cols-3 gap-4">
    <div className="border rounded-xl p-5">
      <p className="text-gray-500 text-sm">
        Total Flats
      </p>
      <h2 className="text-3xl font-bold">
        {totalFlats}
      </h2>
    </div>

    <div className="border rounded-xl p-5">
      <p className="text-gray-500 text-sm">
        Occupied
      </p>
      <h2 className="text-3xl font-bold text-green-600">
        {occupiedFlats}
      </h2>
    </div>

    <div className="border rounded-xl p-5">
      <p className="text-gray-500 text-sm">
        Vacant
      </p>
      <h2 className="text-3xl font-bold text-red-500">
        {vacantFlats}
      </h2>
    </div>
  </div>

  <div className="border rounded-xl p-6">
    <h2 className="text-xl font-semibold mb-4">
      Flats
    </h2>

    <div className="grid md:grid-cols-4 gap-3">
      {buildingUnits.map((unit) => (
        <div
          key={unit.id}
          className="border rounded-lg p-3"
        >
          {unit.flatNo}
        </div>
      ))}
    </div>
  </div>

  <div className="border rounded-xl p-6">
    <h2 className="text-xl font-semibold mb-4">
      Tenants
    </h2>

    {buildingTenants.length > 0 ? (
      <div className="space-y-3">
        {buildingTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="border rounded-lg p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">
                {tenant.name}
              </p>

              <p className="text-sm text-gray-500">
                Flat {tenant.flatNo}
              </p>
            </div>

            <span
              className={
                tenant.approved
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {tenant.approved
                ? "Approved"
                : "Pending"}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-gray-500">
        No tenants found.
      </p>
    )}
  </div>
</div>

);
}
