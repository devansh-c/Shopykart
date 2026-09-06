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
  // Fix for workstation cross-origin warnings
  experimental: {
    allowedDevOrigins: [
      '6000-firebase-studio-1778365071705.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev',
      '9002-firebase-studio-1778365071705.cluster-fdkw7vjj7bgguspe3fbbc25tra.cloudworkstations.dev'
    ]
  }
};

export default nextConfig;
