
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
  
  /* TURBOPACK CONFIG - Simplified for maximum stability */
  experimental: {
    turbo: {
      resolveAlias: {
        fs: 'node-libs-browser/mock/empty',
        path: 'node-libs-browser/mock/empty',
        os: 'node-libs-browser/mock/empty',
        net: 'node-libs-browser/mock/empty',
        tls: 'node-libs-browser/mock/empty',
        child_process: 'node-libs-browser/mock/empty',
      },
    },
  },

  /* FIX FOR NODE.JS MODULES IN CLIENT BUNDLE */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        net: false,
        tls: false,
        child_process: false,
        readline: false,
        perf_hooks: false,
        http2: false,
        dns: false,
      };
    }
    return config;
  },
};

export default nextConfig;
