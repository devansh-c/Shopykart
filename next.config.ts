import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Conditional output: 'export' only for static APK builds. 
  // For App Hosting/Production, 'standalone' is required to prevent manifest errors.
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
};

export default nextConfig;
