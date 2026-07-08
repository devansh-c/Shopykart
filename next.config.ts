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
  
  /* TURBOPACK CONFIG - Simple & Clean to avoid SSR conflicts */
  experimental: {
    turbo: {
      resolveAlias: {
        // Only essential browser mocks
        canvas: 'node-libs-browser/mock/empty',
      },
    },
  },

  /* WEBPACK FALLBACK - Only for Client Side */
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
        http2: false,
        dns: false,
      };
    }
    return config;
  },
};

export default nextConfig;
