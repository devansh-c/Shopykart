import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "co.in.shopykart.app",
  appName: "Shopykart",
  webDir: "out",
  server: {
    androidScheme: "http",
    cleartext: true,
    allowNavigation: [
      "shopykart.co.in",
      "*.shopykart.co.in"
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
