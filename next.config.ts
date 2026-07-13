import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* 
   * HYBRID BUILD CONFIGURATION
   * We enable 'export' only if strictly requested via env var.
   * Standard build is preferred for Firebase Studio Publish.
   */
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
  // Increase timeout for build optimization
  staticPageGenerationTimeout: 300,
};

export default nextConfig;
