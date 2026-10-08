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
  // Optimization for faster dev compilation in Next.js 15
  experimental: {
    // Removed allowedDevOrigins as it causes validation errors in some 15.x versions
    // and is currently only a future warning.
    serverExternalPackages: ['archiver', 'jszip'],
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
