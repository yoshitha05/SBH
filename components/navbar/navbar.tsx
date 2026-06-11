"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <header
      className="
      flex
      justify-between
      items-center
      px-8
      py-5
      border-b
      border-slate-800
      backdrop-blur-md
    "
    >
      <Link
        href="/"
        className="
        text-3xl
        font-bold
        text-sky-400
      "
      >
        RentFlow
      </Link>

      <div className="flex gap-3">
        <Link
          href="/owner"
          className="
          px-4 py-2
          rounded-lg
          bg-sky-500
          hover:bg-sky-600
          transition
        "
        >
          Owner
        </Link>

        <Link
          href="/tenant"
          className="
          px-4 py-2
          rounded-lg
          border
          border-slate-700
        "
        >
          Tenant
        </Link>
      </div>
    </header>
  );
}