import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* 
   * HYBRID BUILD CONFIGURATION
   * If process.env.NEXT_PUBLIC_STATIC_EXPORT is true, we enable 'export' for Capacitor APK.
   * Otherwise, we allow SSR for Firebase App Hosting.
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
};

export default nextConfig;