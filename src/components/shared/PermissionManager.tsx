"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";

export default function PermissionManager() {
  useEffect(() => {
    const askPermissions = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Android Native Location Prompt
          const locStatus = await Geolocation.checkPermissions();
          if (locStatus.location !== "granted") {
            await Geolocation.requestPermissions();
          }
        } catch (e) {
          console.warn("Location permission error:", e);
        }

        try {
          // Android 13+ Native Notification Prompt
          const pushStatus = await PushNotifications.checkPermissions();
          if (pushStatus.receive !== "granted") {
            await PushNotifications.requestPermissions();
          }
        } catch (e) {
          console.warn("Push permission error:", e);
        }
      }
    };

    askPermissions();
  }, []);

  return null;
}
