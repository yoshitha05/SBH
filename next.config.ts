import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  async headers() {
    return [
      {
        // Relax Cross-Origin-Opener-Policy so the MSAL login popup can
        // communicate back to the main window and close itself after
        // a successful Microsoft sign-in. Without this, the popup opens
        // and authenticates correctly, but can't message the parent
        // window, so it never closes and just renders the app instead.
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "unsafe-none",
          },
        ],
      },
    ];
  },
};

export default nextConfig;