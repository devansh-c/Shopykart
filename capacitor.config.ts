
import type { CapacitorConfig } from '@capacitor/cli';

/**
 * @fileOverview Standard Capacitor Configuration for ShopyKart.
 * FIXED: Using simple string literals so GitHub Actions can easily swap identity with 'sed'.
 */

const config: CapacitorConfig = {
  appId: 'co.in.shopykart.app',
  appName: 'Shopykart',
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
