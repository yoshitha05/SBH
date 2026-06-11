import { riskTenants } from "@/data/mock";

export default function RiskBoard() {
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
      <h2
        className="
        text-xl
        font-semibold
        mb-6
      "
      >
        Tenant Risk Board
      </h2>

      <div className="space-y-5">
        {riskTenants.map((tenant) => (
          <div key={tenant.id}>
            <div className="flex justify-between">
              <div>
                <h3>{tenant.name}</h3>

                <p
                  className="
                  text-slate-500
                  text-sm
                  "
                >
                  {tenant.flat}
                </p>
              </div>

              <span
                className="
                font-bold
                "
              >
                {tenant.risk}%
              </span>
            </div>

            <div
              className="
              h-2
              bg-slate-800
              rounded-full
              mt-2
              "
            >
              <div
                style={{
                  width: `${tenant.risk}%`,
                }}
                className="
                h-full
                rounded-full
                bg-red-500
                "
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
