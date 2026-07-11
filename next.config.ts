
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
  
  /* Turbopack Optimization: Removing explicit webpack config to resolve conflict */
  experimental: {
    // Turbopack will handle basic modules automatically. 
    // If specific polyfills are needed for node modules in browser, 
    // they should be configured under the 'turbo' key.
  }
};

export default nextConfig;
