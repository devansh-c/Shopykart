
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Conditional output: 'export' only for static APK builds. 
  // For App Hosting/Production, 'standalone' is required.
  output: process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ? 'export' : 'standalone',
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
  staticPageGenerationTimeout: 600,
  // No experimental flags to ensure maximum server stability
};

export default nextConfig;
