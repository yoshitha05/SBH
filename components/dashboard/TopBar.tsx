import {
  Bell,
  UserCircle,
} from "lucide-react";

export default function TopBar() {
  return (
    <div
      className="
      flex
      justify-between
      items-center
      mb-10
      "
    >
      <div>
        <h1 className="text-4xl font-black">
          Dashboard
        </h1>

        <p className="text-slate-400 mt-1">
          rent management
        </p>
      </div>

      <div className="flex gap-4 items-center">

        <button
          className="
          relative
          p-3
          rounded-xl
          bg-slate-900
          border
          border-slate-800
          "
        >
          <Bell size={20} />

          <span
            className="
            absolute
            -top-1
            -right-1
            w-5
            h-5
            rounded-full
            bg-red-500
            text-xs
            flex
            items-center
            justify-center
            "
          >
            3
          </span>
        </button>

        <UserCircle size={36} />
      </div>
    </div>
  );
}