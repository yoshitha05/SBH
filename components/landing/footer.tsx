// components/landing/Footer.tsx

export default function Footer() {
  return (
    <footer className="px-6 py-6 text-center" style={{ background: "#18233c" }}>
      <p className="text-xs text-white/50">
        © {new Date().getFullYear()} Sree Balaji Hospitalities. All rights reserved.
      </p>
    </footer>
  );
}