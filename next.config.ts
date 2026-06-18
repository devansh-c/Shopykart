import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* FORCING STATIC EXPORT FOR EXTERNAL HOSTING & APK */
  output: 'export',
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* ENSURE CLEAN URLS & INDEX.HTML GENERATION */
  trailingSlash: true,
};

export default nextConfig;
