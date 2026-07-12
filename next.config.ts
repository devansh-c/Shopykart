import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* 
   * OPTIMIZED FOR FIREBASE APP HOSTING (SSR)
   * Removing 'output: export' allows the app to support dynamic server-side rendering,
   * which is required for runtime-generated IDs in routes like /orders/[orderId].
   */
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* CLEAN URLS FOR BETTER NAVIGATION */
  trailingSlash: true,
};

export default nextConfig;