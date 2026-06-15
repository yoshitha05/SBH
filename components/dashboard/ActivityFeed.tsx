export default function ActivityFeed() {
  return (
    <div
      className="
      bg-slate-900/60
      border
      border-slate-800
      rounded-2xl
      p-6
      "
    >
      <h2 className="font-semibold text-xl mb-5">
        Recent Activity
      </h2>

      <div className="space-y-4">

        <p>
          ✓ Vijay paid ₹8,000
        </p>

        <p>
          ✓ Reminder sent to Meena
        </p>

        <p>
          ✓ Forecast updated
        </p>

        <p>
          ✓ Risk score recalculated
        </p>

      </div>
    </div>
  );
}