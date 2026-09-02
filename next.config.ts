import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Conditional output: 'export' only for static APK builds
  // This prevents build errors on Firebase App Hosting while maintaining APK compatibility
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
  staticPageGenerationTimeout: 600,
};

export default nextConfig;
