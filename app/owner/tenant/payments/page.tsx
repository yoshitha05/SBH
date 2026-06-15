import { tenants } from "@/data/tenants";

export default function TenantPaymentsPage() {
  const tenant = tenants[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payments</h1>
        <p className="text-gray-500">Rent, reminders, UPI scan, and receipts for the logged-in tenant.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Monthly Rent</p>
          <h2 className="text-2xl font-bold mt-1">₹{tenant.rent.toLocaleString()}</h2>
        </div>
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Reminder</p>
          <h2 className="text-2xl font-bold mt-1">Pay before the 5th</h2>
        </div>
        <div className="border rounded-xl p-5">
          <p className="text-sm text-gray-500">Payment Status</p>
          <h2 className="text-2xl font-bold mt-1">{tenant.paymentStatus}</h2>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">UPI Payment</h2>
          <p className="text-gray-600">UPI ID: {tenant.upiId}</p>
          <div className="mt-4 h-52 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-500">
            QR scan box
          </div>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Receipts</h2>
          <div className="space-y-3">
            {(tenant.receipts?.length ? tenant.receipts : ["No receipts yet"]).map((receipt) => (
              <div key={receipt} className="flex justify-between border-b pb-2">
                <span>{receipt}</span>
                <span className="text-sky-600">Download</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}