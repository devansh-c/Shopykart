'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, ShoppingBag } from 'lucide-react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsRetrying(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100 flex flex-col items-center">
        
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-200">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">Shopykart</span>
        </div>

        <div className="relative mb-6">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-inner">
            <WifiOff className="w-12 h-12 animate-pulse" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-red-100 text-red-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-red-200">
            No Connection
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Oops! You&apos;re Offline
        </h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Check your Wi-Fi or mobile data to continue shopping.
        </p>

        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full py-3.5 px-6 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all duration-200 text-white font-semibold rounded-2xl shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Checking Connection...' : 'Retry'}
        </button>

        <p className="text-xs text-gray-400 mt-6">
          We&apos;ll automatically reconnect once your network is back.
        </p>

        <div className="mt-8 pt-6 border-t border-gray-100 w-full flex flex-col items-center text-xs">
          <p className="font-semibold text-gray-700">Shopykart delivery network</p>
          <p className="text-gray-400 text-[11px] mt-0.5">Handicrafted by Devansh</p>
        </div>

      </div>
    </div>
  );
}
