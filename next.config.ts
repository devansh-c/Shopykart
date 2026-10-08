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
  
  // In Next.js 15, this is a top-level option, not under experimental
  serverExternalPackages: ['archiver', 'jszip'],

  // Optimization for faster dev compilation in Next.js 15
  experimental: {
    // Kept empty as we moved external packages to top level
  },

  // Turbopack rules for stable and fast preview
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
