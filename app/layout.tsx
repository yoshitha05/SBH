// src/app/layout.tsx

import "./globals.css";

export const metadata = {
  title: "RentFlow",
  description: "AI Powered Rent Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}