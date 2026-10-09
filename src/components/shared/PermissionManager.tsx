"use client";

import { useEffect } from "react";
import { requestPushToken } from "@/firebase/messaging";
import { useToast } from "@/hooks/use-toast";

/**
 * @fileOverview PermissionManager - Requests critical permissions on startup.
 */
export default function PermissionManager() {
  const { toast } = useToast();

  useEffect(() => {
    const setupPermissions = async () => {
      try {
        if (typeof window === "undefined") return;
        
        // Delay slightly to ensure page stability before showing native prompt
        const timer = setTimeout(async () => {
          const token = await requestPushToken();
          if (token) {
            console.log("Push notifications active.");
          }
        }, 2500);

        return () => clearTimeout(timer);
      } catch (e) {
        console.warn("Permission Error:", e);
      }
    };
    setupPermissions();
  }, []);

  return null;
}
