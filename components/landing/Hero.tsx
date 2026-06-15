"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      className="
      min-h-screen
      flex
      flex-col
      justify-center
      items-center
      text-center
      px-6
    "
    >
      <motion.h1
        initial={{
          opacity: 0,
          y: 30,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.6,
        }}
        className="
        text-6xl
        md:text-8xl
        font-black
      "
      >
        Stop Chasing Rent.
      </motion.h1>

      <p
        className="
        mt-6
        text-slate-400
        max-w-2xl
        text-xl
      "
      >
        AI-powered rent tracking,
        payment prediction,
        automated reminders,
        and tenant insights.
      </p>

      <div className="flex items-center gap-4 mt-10">
        <Link
          href="/admin"
          className="bg-sky-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Admin
        </Link>

        <Link
          href="/owner"
          className="bg-sky-500 px-6 py-3 rounded-xl font-semibold"
        >
          Start as Owner
        </Link>

        <Link
          href="/tenant"
          className="border border-slate-700 px-6 py-3 rounded-xl"
        >
          Tenant Login
        </Link>
      </div>
    </section>
  );
}