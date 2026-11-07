import { CapacitorConfig } from '@capacitor/cli';

/**
 * @fileOverview Dynamic identity configuration for ShopyKart Multi-App ecosystem.
 * Environment variables are used during build/sync to assign unique Package IDs and Names.
 */

const isAdmin = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
const isBiz = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
const isFleet = process.env.NEXT_PUBLIC_TOW_APP === 'true';

let appId = "co.in.shopykart.app";
let appName = "Shopykart";

if (isAdmin) {
  appId = "co.in.shopykart.admin";
  appName = "Shopykart CEO";
} else if (isBiz) {
  appId = "co.in.shopykart.biz";
  appName = "Shopykart Business";
} else if (isFleet) {
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
      launchShowDuration: 2000,
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
