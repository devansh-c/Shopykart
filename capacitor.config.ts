
import type { CapacitorConfig } from '@capacitor/cli';

/**
 * @fileOverview Bulletproof Dynamic Capacitor Configuration.
 * Optimized for Version 1.4.0 with explicit Package ID switching.
 */

const getAppIdentity = () => {
  // Check environment flags during build or sync
  const env = process.env;
  
  const isAdmin = env.NEXT_PUBLIC_ADMIN_APP === 'true' || env.ADMIN_APP === 'true';
  const isBiz = env.NEXT_PUBLIC_BIZ_APP === 'true' || env.BIZ_APP === 'true';
  const isTow = env.NEXT_PUBLIC_TOW_APP === 'true' || env.TOW_APP === 'true';

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
