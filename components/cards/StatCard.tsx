import { ReactNode } from "react";

type Props = {
  title: string;
  value: string;
  icon: ReactNode;
};

export default function StatCard({
  title,
  value,
  icon,
}: Props) {
  return (
    <div
      className="
      bg-slate-900/60
      backdrop-blur-xl
      border
      border-slate-800
      rounded-2xl
      p-6
      "
    >
      <div className="flex justify-between">
        <div>
          <p className="text-slate-400">
            {title}
          </p>

          <h2
            className="
            text-3xl
            font-bold
            mt-2
          "
          >
            {value}
          </h2>
        </div>

        <div>{icon}</div>
      </div>
    </div>
  );
}