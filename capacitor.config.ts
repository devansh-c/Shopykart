
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.in.shopykart.app',
  appName: 'ShopyKart',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: [
      'shopykart.co.in',
      '*.shopykart.co.in'
    ]
  }
};

export default config;
