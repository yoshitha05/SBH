import { collections } from "@/data/collections";

export default function CollectionsPage() {
  const totalRent = collections.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const paid = collections
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);

  const unpaid = collections
    .filter((item) => item.status === "unpaid")
    .reduce((sum, item) => sum + item.amount, 0);

  const overdue = collections
    .filter((item) => item.status === "overdue")
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Rent Collections
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-xl p-4">
          <p className="text-gray-500">Total Rent</p>
          <h2 className="text-2xl font-bold">
            ₹{totalRent.toLocaleString()}
          </h2>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-gray-500">Collected</p>
          <h2 className="text-2xl font-bold text-green-600">
            ₹{paid.toLocaleString()}
          </h2>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-gray-500">Pending</p>
          <h2 className="text-2xl font-bold text-yellow-600">
            ₹{unpaid.toLocaleString()}
          </h2>
        </div>

        <div className="border rounded-xl p-4">
          <p className="text-gray-500">Overdue</p>
          <h2 className="text-2xl font-bold text-red-600">
            ₹{overdue.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* Collections Table */}
      <div className="border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Tenant</th>
              <th className="text-left p-3">Building</th>
              <th className="text-left p-3">Flat</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Mode</th>
              <th className="text-left p-3">Receipt</th>
              <th className="text-left p-3">Due Date</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {collections.map((item) => (
              <tr
                key={item.id}
                className="border-t"
              >
                <td className="p-3">
                  {item.tenantName}
                </td>

                <td className="p-3">
                  {item.building}
                </td>

                <td className="p-3">
                  {item.flatNo}
                </td>

                <td className="p-3">
                  ₹{item.amount.toLocaleString()}
                </td>

                <td className="p-3">{item.paymentMode}</td>

                <td className="p-3">{item.receiptNo}</td>

                <td className="p-3">
                  {item.dueDate}
                </td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      item.status === "paid"
                        ? "bg-green-100 text-green-700"
                        : item.status === "unpaid"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
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