
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
  // Disable strict mode to prevent double-initialization in development
  reactStrictMode: false,
  // Fix Cross-Origin issues in cloud development environments
  experimental: {
    allowedDevOrigins: [
      '*.cloudworkstations.dev',
      '*.firebaseapp.com',
      '*.shopykart.co.in'
    ]
  }
};

export default nextConfig;
