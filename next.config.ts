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
  
  /* TURBOPACK CONFIG - Optimized for Next.js 15 (Root level property) */
  turbopack: {
    resolveAlias: {
      // Essential browser mocks for Node.js modules to prevent build errors
      canvas: 'node-libs-browser/mock/empty',
      fs: 'node-libs-browser/mock/empty',
      path: 'path-browserify',
      os: 'os-browserify',
      stream: 'stream-browserify',
    },
  },

  /* WEBPACK FALLBACK - Robust Polyfills for non-Turbo environments */
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        net: false,
        tls: false,
        child_process: false,
        readline: false,
        http2: false,
        dns: false,
        stream: require.resolve('stream-browserify'),
      };
    }
    return config;
  },
};

export default nextConfig;
