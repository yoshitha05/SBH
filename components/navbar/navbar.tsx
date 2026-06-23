"use client";

import Link from "next/link";
import { Home, Sparkles } from "lucide-react";

export default function Navbar() {
  return (
    <header className="flex justify-between items-center px-5 md:px-8 py-4 md:py-5 brand-shell sticky top-0 z-40">
      <Link href="/" className="flex items-center gap-3 text-left">
        <span className="w-11 h-11 rounded-2xl flex items-center justify-center brand-accent-bg shadow-[0_10px_24px_rgba(214,176,109,0.2)]">
          <Home size={18} style={{ color: "#18233c" }} />
        </span>
        <span>
          <span className="block text-sm md:text-[15px] font-semibold tracking-[0.22em] uppercase text-white/70">
            Sree Balaji
          </span>
          <span className="block text-lg md:text-2xl font-semibold tracking-[0.08em] text-white">
            Hospitalities
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <a
          href="/login"
          className="px-4 py-2 rounded-full text-sm font-semibold transition hover:opacity-95"
          style={{ background: "linear-gradient(135deg, #e6c888, #d6b06d)", color: "#18233c", textDecoration: "none" }}
        >
          Sign in
        </a>
      </div>
    </header>
  );
}