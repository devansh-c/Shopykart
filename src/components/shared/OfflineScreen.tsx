"use client";

import React, { useState, useEffect } from "react";
import { WifiOff, RefreshCw, Radio } from "lucide-react";

export default function OfflineScreen() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (navigator.onLine) {
        setIsOnline(true);
        window.location.reload();
      } else {
        setIsRetrying(false);
      }
    }, 1200);
  };

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-between bg-gradient-to-b from-white via-orange-50/30 to-white px-6 py-12 text-center select-none backdrop-blur-md">
      {/* Top Signal Status Pill */}
      <div className="flex items-center gap-2 rounded-full border border-orange-200/60 bg-white/80 px-4 py-1.5 shadow-sm backdrop-blur-md">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
        </span>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
          Disconnected
        </span>
      </div>

      {/* Main VFX Icon Hub */}
      <div className="flex flex-col items-center">
        <div className="relative mb-8 flex items-center justify-center">
          {/* Radar VFX Rings */}
          <div className="absolute h-36 w-36 animate-ping rounded-full bg-orange-400/20 duration-1000"></div>
          <div className="absolute h-28 w-28 animate-pulse rounded-full bg-orange-300/30"></div>

          {/* Core Floating Container */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-xl shadow-orange-500/30 transition-transform duration-700 hover:scale-105">
            <WifiOff size={44} className="animate-bounce drop-shadow" />
          </div>
        </div>

        <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
          No Internet Connection
        </h2>

        <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
          We can&apos;t reach the Shopykart cloud. Please check your cellular data or Wi-Fi to resume your order.
        </p>

        {/* Retry Button with Glow Effect */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="group relative mt-8 flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-orange-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/30 transition-all duration-300 active:scale-95 disabled:opacity-70 hover:bg-orange-700"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"></span>
          <RefreshCw
            size={18}
            className={`transition-transform duration-500 ${isRetrying ? "animate-spin" : "group-hover:rotate-180"}`}
          />
          <span>{isRetrying ? "Reconnecting..." : "Retry Connection"}</span>
        </button>
      </div>

      {/* Footer Branding with subtle glow */}
      <div className="flex flex-col items-center text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-gray-700">
          <Radio size={14} className="animate-pulse text-orange-500" />
          <span>Shopykart delivery network</span>
        </div>
        <p className="mt-1 text-[11px] font-medium tracking-wide text-gray-400">
          Handicrafted by Devansh
        </p>
      </div>
    </div>
  );
}
