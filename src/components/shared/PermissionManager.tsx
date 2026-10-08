"use client";

import { useEffect } from "react";

export default function PermissionManager() {
  useEffect(() => {
    const initNativeFeatures = async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        // Delay 1.5s so Next.js UI mounts completely first
        setTimeout(async () => {
          try {
            const { Geolocation } = await import("@capacitor/geolocation");
            await Geolocation.requestPermissions().catch(() => {});
          } catch (e) {}

          try {
            const { PushNotifications } = await import("@capacitor/push-notifications");
            const perm = await PushNotifications.checkPermissions().catch(() => null);
            if (perm && perm.receive !== "granted") {
              await PushNotifications.requestPermissions().catch(() => {});
            }
          } catch (e) {}
        }, 1500);
      } catch (err) {
        console.warn("Native feature init warning:", err);
      }
    };

    initNativeFeatures();
  }, []);

  return null;
}
