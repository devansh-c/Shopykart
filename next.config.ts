
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* Static export mode for Firebase Free Plan - This is CRITICAL */
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true, // Required for static export
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
