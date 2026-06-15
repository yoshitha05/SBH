import { tenants } from "@/data/tenants";

export default function TenantReceiptsPage() {
  const tenant = tenants[0];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Receipts</h1>
        <p className="text-gray-500">Downloaded receipts and payment history for the tenant account.</p>
      </div>

      <div className="border rounded-xl p-6">
        <div className="space-y-3">
          {(tenant.receipts?.length ? tenant.receipts : ["No receipts yet"]).map((receipt) => (
            <div key={receipt} className="flex justify-between border-b pb-2">
              <span>{receipt}</span>
              <span className="text-sky-600">PDF</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}