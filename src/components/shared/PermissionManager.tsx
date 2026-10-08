"use client";

import { useEffect } from "react";

export default function PermissionManager() {
  useEffect(() => {
    const setup = async () => {
      try {
        if (typeof window === "undefined") return;
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
      } catch (e) {
        console.warn(e);
      }
    };
    setup();
  }, []);

  return null;
}
