// src/app/layout.tsx

import "./globals.css";
// src/app/layout.tsx

import "./globals.css";
import MsalClientProvider from "@/components/auth/MsalClientProvider";

export const metadata = {
  title: "Sree Balaji Hospitalities",
  description: "Fully furnished apartment rentals and hospitality management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <MsalClientProvider>{children}</MsalClientProvider>
      </body>
    </html>
  );
}