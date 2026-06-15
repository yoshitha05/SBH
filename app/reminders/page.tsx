import { tenants } from "@/data/tenants";

export default function RemindersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reminders</h1>
        <p className="text-gray-500">
          Monthly payment reminders shown to the owner and tenant.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {tenants.map((tenant) => (
          <div key={tenant.id} className="border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{tenant.name}</p>
                <p className="text-sm text-gray-500">{tenant.building} • Flat {tenant.flatNo}</p>
              </div>
              <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
                {tenant.paymentStatus}
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-600">
              Reminder: pay ₹{tenant.monthlyDue.toLocaleString()} before the 5th of every month.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}