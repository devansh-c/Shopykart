import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Use export only for static builds, standalone for server-side
  output: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  trailingSlash: false,
  staticPageGenerationTimeout: 1200,
  
  // In Next.js 15, this is a top-level option
  serverExternalPackages: ['archiver', 'jszip'],

  // Optimization for workstation environment
  devIndicators: {
    buildActivity: false,
  },
};

export default nextConfig;
