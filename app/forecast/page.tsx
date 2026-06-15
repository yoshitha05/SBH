import { aiPredictions } from "@/data/aiPredictions";

export default function ForecastPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        AI Forecast
      </h1>

      <div className="space-y-4">
        {aiPredictions.map((item, index) => (
          <div
            key={index}
            className="border rounded-xl p-4"
          >
            <h2 className="font-semibold">
              {item.tenant}
            </h2>

            <p className="text-gray-600 mt-2">
              {item.prediction}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}