import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Only enable export mode when explicitly requested for static builds (APK/Hosting)
  // This prevents ENOENT manifest errors during development preview
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
