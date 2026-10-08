"use client";
import { useEffect } from "react";

export default function PermissionManager() {
  useEffect(() => {
    const run = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          const { Geolocation } = await import("@capacitor/geolocation");
          await Geolocation.requestPermissions().catch(() => {});
          const { PushNotifications } = await import("@capacitor/push-notifications");
          await PushNotifications.requestPermissions().catch(() => {});
        }
      } catch (err) {
        console.warn("Permission setup error:", err);
      }
    };
    run();
  }, []);
  return null;
}
