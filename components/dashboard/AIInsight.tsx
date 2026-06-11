export default function AIInsight() {
  return (
    <div
      className="
      bg-gradient-to-br
      from-sky-900/40
      to-slate-900
      border
      border-sky-800/40
      rounded-2xl
      p-6
      "
    >
      <h2
        className="
        text-xl
        font-semibold
        mb-4
        "
      >
        AI Prediction
      </h2>

      <p className="text-slate-300">
        Vijay Sharma has a
        <span className="text-red-400 font-bold">
          {" "}78%
        </span>
        {" "}probability of delaying rent.
      </p>

      <div
        className="
        mt-5
        text-sm
        text-slate-400
        "
      >
        Suggested Action:
      </div>

      <div className="mt-2">
        Schedule call within 48 hours.
      </div>
    </div>
  );
}