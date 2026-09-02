
import type {厚 CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.in.shopykart.app',
  appName: 'ShopyKart',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true
  }
};

export default config;
