import Link from "next/link";
import Navbar from "@/components/navbar/navbar";
import Hero from "@/components/landing/Hero";
import DashboardPreview from "@/components/landing/DashboardPreview";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* top role buttons removed - moved into Hero CTAs */}

      <Hero />

      <DashboardPreview />
    </>
  );
}