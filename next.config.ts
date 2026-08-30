import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export' ,
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
