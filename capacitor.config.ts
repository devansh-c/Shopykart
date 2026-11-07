import { CapacitorConfig } from '@capacitor/cli';

/**
 * @fileOverview Dynamic Capacitor Config for ShopyKart Multi-App Build.
 * Version: 1.4.0
 * Detects app identity during build process to assign correct package names and labels.
 */

const isAdmin = process.env.NEXT_PUBLIC_ADMIN_APP === 'true' || process.env.npm_config_admin === 'true';
const isBiz = process.env.NEXT_PUBLIC_BIZ_APP === 'true' || process.env.npm_config_biz === 'true';
const isTow = process.env.NEXT_PUBLIC_TOW_APP === 'true' || process.env.npm_config_tow === 'true';

const config: CapacitorConfig = {
  appId: isAdmin 
    ? "co.in.shopykart.admin" 
    : isBiz 
      ? "co.in.shopykart.biz" 
      : isTow 
        ? "co.in.shopykart.tow" 
        : "co.in.shopykart.app",
  appName: isAdmin 
    ? "Shopykart CEO" 
    : isBiz 
      ? "Shopykart Business" 
      : isTow 
        ? "Shopykart Tow" 
        : "Shopykart",
  webDir: "out",
  server: {
    androidScheme: "http",
    cleartext: true,
    allowNavigation: [
      "shopykart.co.in",
      "*.shopykart.co.in",
      "*.firebaseapp.com",
      "*.google.com"
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#EF4444",
      sound: "order_alert"
    }
  }
};

export default config;
