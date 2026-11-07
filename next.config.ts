import type { NextConfig } from "next";

const isCapacitorBuild = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  output: isCapacitorBuild ? "export" : undefined,
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
};

export default nextConfig;