import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Next.js 15 Standard Config
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
  
  // Use standard serverExternalPackages for Next.js 15
  serverExternalPackages: ['archiver', 'jszip'],
};

export default nextConfig;
