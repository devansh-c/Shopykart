import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
  trailingSlash: true,
  staticPageGenerationTimeout: 600,
  experimental: {
    turbo: {
      rules: {
        // Build optimizations
      }
    }
  }
};

export default nextConfig;
