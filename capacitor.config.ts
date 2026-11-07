import { CapacitorConfig } from '@capacitor/cli';

/**
 * @fileOverview Dynamic Capacitor Config for ShopyKart Multi-App Build.
 * Version: 1.4.0
 * Detects app identity during build process to assign correct package names and labels.
 * Environment variables are checked during build/sync to bake unique identity.
 */

const isAdmin = process.env.NEXT_PUBLIC_ADMIN_APP === 'true' || process.env.npm_config_admin === 'true';
const isBiz = process.env.NEXT_PUBLIC_BIZ_APP === 'true' || process.env.npm_config_biz === 'true';
const isTow = process.env.NEXT_PUBLIC_TOW_APP === 'true' || process.env.npm_config_tow === 'true';

let appId = "co.in.shopykart.app";
let appName = "Shopykart";

if (isAdmin) {
  appId = "co.in.shopykart.admin";
  appName = "Shopykart CEO";
} else if (isBiz) {
  appId = "co.in.shopykart.biz";
  appName = "Shopykart Business";
} else if (isTow) {
  appId = "co.in.shopykart.tow";
  appName = "Shopykart Tow";
}

const config: CapacitorConfig = {
  appId: appId,
  appName: appName,
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