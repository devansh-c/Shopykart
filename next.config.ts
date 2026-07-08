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
  
  /* TURBOPACK CONFIG */
  experimental: {
    turbo: {
      resolveAlias: {
        // Alias node modules to a hollow module on the client
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
      },
    },
  },

  /* FIX FOR NODE.JS MODULES IN CLIENT BUNDLE (fs, net, tls, etc.) */
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
