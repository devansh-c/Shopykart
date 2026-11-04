import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only enable export mode when explicitly requested for static builds (APK/Hosting)
  // This prevents ENOENT manifest errors during development preview
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
};

export default nextConfig;
