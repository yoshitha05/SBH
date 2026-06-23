import Navbar from "@/components/navbar/navbar";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/footer";
import login from "./login/page";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Footer />
    </>
  );
}