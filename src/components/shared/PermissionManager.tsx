
"use client";

import { useEffect } from "react";
import { requestPushToken } from "@/firebase/messaging";
import { useUser } from "@/firebase";

/**
 * @fileOverview PermissionManager - Requests system permissions and registers FCM tokens.
 */
export default function PermissionManager() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) return;

    const setupPermissions = async () => {
      try {
        if (typeof window === "undefined") return;
        
        // Delay slightly to ensure page stability before showing native prompt
        const timer = setTimeout(async () => {
          // Pass user ID to save the token in Firestore for real Cloud Notifications
          const token = await requestPushToken(user?.uid);
          if (token) {
            console.log("FCM Cloud Messenger Active.");
          }
        }, 3000);

        return () => clearTimeout(timer);
      } catch (e) {
        console.warn("Permission Error:", e);
      }
    };
    setupPermissions();
  }, [user, loading]);

  return null;
}
