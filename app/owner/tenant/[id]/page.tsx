import { tenants } from "@/data/tenants";
import Link from "next/dist/client/link";
import { notFound } from "next/navigation";


export default async function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tenant = tenants.find((t) => t.id === id);

  if (!tenant) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="border rounded-xl p-6 bg-white shadow-sm">
        <h1 className="text-3xl font-bold">{tenant.name}</h1>
        <p className="text-sm text-gray-500 mt-2">
          {tenant.approved ? "Approved tenant account" : "Awaiting owner approval"}
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-gray-500">Phone</p>
            <p>{tenant.phone}</p>
          </div>

          <div>
            <p className="text-gray-500">Tenant ID</p>
            <p>{tenant.id}</p>
          </div>

          <div>
            <p className="text-gray-500">Building</p>
            <p>{tenant.building}</p>
          </div>

          <div>
            <p className="text-gray-500">Flat</p>
            <p>{tenant.flatNo}</p>
          </div>

          <div>
            <p className="text-gray-500">Monthly Rent</p>
            <p>₹{tenant.rent.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-gray-500">Risk Level</p>
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
          </div>

          <div>
            <p className="text-gray-500">UPI ID</p>
            <p>{tenant.upiId}</p>
          </div>

          <div>
            <p className="text-gray-500">Access</p>
            <p>{tenant.accessEnabled ? "Enabled" : "Disabled"}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Payments</h2>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span>Current Month Due</span>
              <span>₹{tenant.monthlyDue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>Paid</span>
              <span className="text-green-600">₹{tenant.monthlyPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span>{tenant.paymentStatus}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">UPI Payment and Scan</h2>
          <div className="space-y-3 text-sm">
            <p>
              UPI ID: <span className="font-medium">{tenant.upiId}</span>
            </p>
            <div className="border-2 border-dashed rounded-xl h-48 flex items-center justify-center text-gray-500">
              QR scan placeholder for monthly payment
            </div>
            <p className="text-gray-500">
              Reminder: pay before the 5th of every month to avoid late fees.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Receipts</h2>
        <div className="space-y-3">
          {(tenant.receipts?.length ? tenant.receipts : ["No receipts yet"]).map((receipt) => (
            <div key={receipt} className="flex justify-between border-b pb-2 last:border-b-0 last:pb-0">
              <span>{receipt}</span>
              <span className="text-sky-600">Download</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}