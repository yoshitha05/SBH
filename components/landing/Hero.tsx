"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Building2, ChevronRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-40 md:pt-44 md:pb-52 text-center min-h-screen flex flex-col items-center justify-center">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(214,176,109,0.24),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(35,47,79,0.16),_transparent_24%),linear-gradient(180deg,_rgba(35,47,79,0.98),_rgba(35,47,79,0.88))]" />
      <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-center mb-8"
      >
        <Image
          src="/SBH.jpeg"
          alt="Sree Balaji Hospitalities"
          width={120}
          height={120}
          className="rounded-2xl"
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-4xl text-5xl md:text-7xl font-semibold tracking-tight text-white"
      >
        <span className="block text-white/70 text-sm md:text-base font-medium tracking-[0.35em] uppercase mb-4">
          Sree Balaji Hospitalities
        </span>
        Furnished spaces with calm, premium operations.
      </motion.h1>

      <p className="mx-auto mt-8 max-w-2xl text-base md:text-xl text-white/75 leading-8">
        A hospitality-first rental experience for owners, tenants, and admins.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-12">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold"
          style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)", color: "#18233c" }}
        >
          <Building2 size={16} /> Admin console
        </Link>

        <Link
          href="/owner"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-white/15 text-white bg-white/5 backdrop-blur"
        >
          <span className="text-[var(--gold-bright)]" /> Owner
        </Link>

        <Link
          href="/tenant"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold border border-white/15 text-white/85 bg-transparent"
        >
          Tenant login <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}