"use client";

import { useState } from "react";
import { tenants } from "@/data/tenants";

export default function TenantApprovalsPage() {
  const [pendingTenants, setPendingTenants] = useState(
    tenants.filter((tenant) => !tenant.approved)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approvals</h1>
        <p className="text-gray-500">
          Owner can approve a tenant to enable login access, or disable access when the tenant vacates.
        </p>
      </div>

      <div className="grid gap-4">
        {pendingTenants.length ? (
          pendingTenants.map((tenant) => (
            <div key={tenant.id} className="border rounded-xl p-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-lg">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.building} • Flat {tenant.flatNo} • {tenant.email}</p>
                <p className="text-sm text-gray-500">Google Form status: {tenant.googleFormStatus}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPendingTenants((current) => current.filter((item) => item.id !== tenant.id))}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white"
                >
                  Approve Login
                </button>
                <button className="px-4 py-2 rounded-lg border border-slate-300">
                  Disable Access
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="border rounded-xl p-6 text-gray-500">
            No pending tenant approvals.
          </div>
        )}
      </div>
    </div>
  );
}