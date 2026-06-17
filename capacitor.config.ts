
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.in.shopykart.app',
  appName: 'ShopyKart',
  webDir: 'out',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
