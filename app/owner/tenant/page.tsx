"use client";

import Link from "next/link";
import { tenants } from "@/data/tenants";

export default function TenantsPage() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tenant Login</h1>
          <p className="text-gray-500">
            Existing tenants can sign in here. New tenants should use the Google Form and wait for owner approval before login is enabled.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            href="/tenant-login"
            className="px-4 py-2 rounded-lg bg-sky-600 text-white"
          >
            Tenants Login
          </Link>
          <a
            href="https://forms.gle/your-google-form-link"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-lg border border-slate-300"
          >
            Google Form
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Instruction</p>
          <h2 className="text-lg font-semibold mt-1">How to add your Google Form</h2>
          <p className="mt-2 text-sm text-gray-600">
            Replace the Google Form URL in the button above with your own form URL. When a tenant submits it, the record should be reviewed and approved by the owner before login access is enabled.
          </p>
        </div>

        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">New Tenant Flow</p>
          <h2 className="text-lg font-semibold mt-1">Approval required</h2>
          <p className="mt-2 text-sm text-gray-600">
            Submitted tenant details should show up in the owner tenant tab with an approval button and access toggle.
          </p>
        </div>

        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Tenant Dashboard</p>
          <h2 className="text-lg font-semibold mt-1">Payments and reminders</h2>
          <p className="mt-2 text-sm text-gray-600">
            Tenants should see rent, monthly payment history, UPI payment option, reminders, and receipts after logging in.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Building</th>
              <th className="text-left p-3">Flat</th>
              <th className="text-left p-3">Approval</th>
              <th className="text-left p-3">Access</th>
              <th className="text-left p-3">Risk</th>
            </tr>
          </thead>

          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id} className="border-t">
                <td className="p-3">
                <Link
                  href={`/owner/tenants/${tenant.id}`}
                  className="font-medium text-sky-600 hover:underline">
                  {tenant.name}
                </Link>

                <div className="text-xs text-gray-500">
                  {tenant.email}
                </div>
              </td>
                <td className="p-3">{tenant.building}</td>
                <td className="p-3">{tenant.flatNo}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${tenant.approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {tenant.approved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${tenant.accessEnabled ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                    {tenant.accessEnabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs">
                    {tenant.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}