import type { NextConfig } from "next";

/**
 * @fileOverview Next.js Configuration optimized for ShopyKart.
 * FIXED: 'output: export' restricted to production builds only to prevent dev server crashes.
 * REMOVED: Deprecated 'appIsrStatus' to stop server restart loops.
 */
const nextConfig: NextConfig = {
  // Only use static export when explicitly building for Capacitor/Production
  output: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig;
