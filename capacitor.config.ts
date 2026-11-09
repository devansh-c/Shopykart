
import type { CapacitorConfig } from '@capacitor/cli';

/**
 * @fileOverview Dynamic Capacitor Configuration for ShopyKart Quad-Apps.
 * Strictly resolves App ID and Name based on environment flags during build/sync.
 * Optimized for production environment variable detection in CI/CD.
 */

const getAppIdentity = () => {
  const env = process.env;
  
  // Checking both raw and NEXT_PUBLIC prefixed env vars for build-time reliability
  const isAdmin = env.ADMIN_APP === 'true' || env.NEXT_PUBLIC_ADMIN_APP === 'true';
  const isBiz = env.BIZ_APP === 'true' || env.NEXT_PUBLIC_BIZ_APP === 'true';
  const isTow = env.TOW_APP === 'true' || env.NEXT_PUBLIC_TOW_APP === 'true';

  if (isAdmin) {
    return {
      appId: 'co.in.shopykart.admin',
      appName: 'Shopykart CEO'
    };
  }
  if (isBiz) {
    return {
      appId: 'co.in.shopykart.biz',
      appName: 'Shopykart Business'
    };
  }
  if (isTow) {
    return {
      appId: 'co.in.shopykart.tow',
      appName: 'Shopykart Tow'
    };
  }

  // Default: Customer App
  return {
    appId: 'co.in.shopykart.app',
    appName: 'Shopykart'
  };
};

const identity = getAppIdentity();

const config: CapacitorConfig = {
  appId: identity.appId,
  appName: identity.appName,
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: 'app/release.jks',
      keystorePassword: 'shopykart123',
      keystoreAlias: 'shopykart',
      keystoreAliasPassword: 'shopykart123',
    }
  }
};

export default config;
