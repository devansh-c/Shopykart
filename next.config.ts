import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only enable export mode when explicitly requested for static builds (APK/Hosting)
  output: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Fix for workstation cross-origin warnings in development
  experimental: {
    allowedDevOrigins: ["*.cloudworkstations.dev", "*.firebaseapp.com"]
  }
};

export default nextConfig;
