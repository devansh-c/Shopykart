import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "co.in.shopykart.app",
  appName: "ShopyKart",
  webDir: "out",
  server: {
    androidScheme: "https",
    cleartext: true,
    allowNavigation: [
      "shopykart.co.in",
      "*.shopykart.co.in"
    ]
  },
  plugins: {
    PushNotifications: { 
      presentationOptions: ["badge", "sound", "alert"] 
    },
    LocalNotifications: { 
      smallIcon: "ic_stat_notification", 
      iconColor: "#EF4444",
      sound: "order_alert.mp3"
    },
  }
};

export default config;