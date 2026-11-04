import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
      "localhost:9002",
      "*.cloudworkstations.dev",
      "*.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev"
    ]
  }
};

export default nextConfig;
