
import type { NextConfig } from "next";

/**
 * @fileOverview Next.js Configuration optimized for ShopyKart.
 * FIXED: 'output: export' handled correctly for Capacitor.
 * REMOVED: Deprecated keys to prevent server restart loops.
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
  },
  // Suppress specific hydration warnings in logs
  devIndicators: {
    appIsrStatus: false,
  }
};

export default nextConfig;
