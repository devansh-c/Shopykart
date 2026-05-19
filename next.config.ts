
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* FORCING STATIC EXPORT FOR FREE PLAN */
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
