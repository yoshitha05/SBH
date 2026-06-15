export default function TenantAvatars() {
  const tenants = [
    "VS",
    "MI",
    "AN",
    "RK",
    "PK",
  ];

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
      <h2 className="font-semibold text-xl mb-4">
        Active Tenants
      </h2>

      <div className="flex -space-x-3">
        {tenants.map((t) => (
          <div
            key={t}
            className="
            w-12
            h-12
            rounded-full
            bg-sky-500
            border-2
            border-slate-900
            flex
            items-center
            justify-center
            font-bold
            "
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}