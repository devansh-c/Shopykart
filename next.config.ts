
import type { NextConfig } from "next";

/**
 * @fileOverview Next.js Configuration optimized for ShopyKart v1.2.1.
 * FIXED: Removed deprecated devIndicators.
 * FIXED: 'output: export' handled correctly for Capacitor.
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
