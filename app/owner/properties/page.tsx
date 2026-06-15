"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { units } from "@/data/unit";
import { tenants } from "@/data/tenants";

export default function PropertiesPage() {
const router = useRouter();
const [search, setSearch] = useState("");

const buildings = [...new Set(units.map((u) => u.building))];

const filteredBuildings = buildings.filter((building) =>
building.toLowerCase().includes(search.toLowerCase())
);

return ( <div className="p-6 space-y-6">
{/* Header */} <div> <h1 className="text-3xl font-bold">
Buildings </h1>
    <p className="text-gray-500">
      Manage buildings, flats, and tenants
    </p>
  </div>

  {/* Search */}
  <input
    type="text"
    placeholder="Search building..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full md:w-96 border rounded-lg p-3"
  />

  {/* Buildings Grid */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
    {filteredBuildings.map((building) => {
      const totalUnits = units.filter(
        (unit) => unit.building === building
      ).length;

      const buildingTenants = tenants.filter(
        (tenant) => tenant.building === building
      );

      const occupied = buildingTenants.length;

      const vacant = Math.max(
        totalUnits - occupied,
        0
      );

      return (
        <div
          key={building}
          onClick={() =>
            router.push(
              `/owner/properties/${encodeURIComponent(
                building
              )}`
            )
          }
          className="
            border
            rounded-xl
            p-5
            shadow
            hover:shadow-lg
            cursor-pointer
            transition
          "
        >
          <h2 className="text-xl font-semibold">
            {building}
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              Total Flats:
              <span className="font-medium ml-2">
                {totalUnits}
              </span>
            </p>

            <p className="text-green-600">
              Occupied Flats:
              <span className="font-medium ml-2">
                {occupied}
              </span>
            </p>

            <p className="text-red-500">
              Vacant Flats:
              <span className="font-medium ml-2">
                {vacant}
              </span>
            </p>

            <p>
              Tenants:
              <span className="font-medium ml-2">
                {buildingTenants.length}
              </span>
            </p>
          </div>

          <button
            className="
              mt-5
              w-full
              bg-indigo-600
              text-white
              py-2
              rounded-lg
            "
          >
            View Details
          </button>
        </div>
      );
    })}
  </div>

  {filteredBuildings.length === 0 && (
    <div className="text-center text-gray-500">
      No buildings found
    </div>
  )}
</div>

);
}
