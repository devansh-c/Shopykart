'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  const [currentAppType, setCurrentAppType] = useState<'customer' | 'biz' | 'admin' | 'fleet' | 'hotel' | 'hotelbiz'>('customer');

  useEffect(() => {
    const checkAppType = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      const host = window.location.hostname;
      
      const isHotelEnv = process.env.NEXT_PUBLIC_HOTEL_APP === 'true' || host.includes('hotelwale') || path.startsWith('/hotel');
      const isBizEnv = process.env.NEXT_PUBLIC_BIZ_APP === 'true' || path.startsWith('/vendor') || path.startsWith('/partner') || path.startsWith('/hotel-partner');

      if (path.startsWith('/admin')) setCurrentAppType('admin');
      else if (path.startsWith('/delivery')) setCurrentAppType('fleet');
      else if (isHotelEnv && isBizEnv) setCurrentAppType('hotelbiz');
      else if (isHotelEnv) setCurrentAppType('hotel');
      else if (isBizEnv) setCurrentAppType('biz');
      else setCurrentAppType('customer');
    };

    checkAppType();
  }, []);

  const getAppTag = () => {
    switch (currentAppType) {
      case 'admin': return 'SUPER ADMIN';
      case 'fleet': return 'FLEET PARTNER';
      case 'biz': return 'BIZ PARTNER';
      case 'hotel': return 'HOTELWALE';
      case 'hotelbiz': return 'HOTEL PARTNER';
      default: return null;
    }
  };

  const tag = getAppTag();
  const isHotel = currentAppType === 'hotel' || currentAppType === 'hotelbiz';

  return (
    <div className={cn("inline-flex items-center select-none", className)}>
      <div className={cn(
        "px-3 py-1 rounded-xl border border-white/20 shadow-md flex items-center gap-2 transition-all duration-300",
        isHotel
          ? "bg-gradient-to-br from-[#F43F5E] via-[#E11D48] to-[#9F1239]"
          : "bg-gradient-to-br from-[#166534] via-[#15803d] to-[#064e3b]"
      )}>
        {isHotel && (
          <img src="/hotel-logo.png" alt="Hotelwale" className="h-6 w-6 rounded-md object-contain" />
        )}
        {currentAppType === 'biz' && (
          <img src="/biz-logo.png" alt="Shopykart Biz" className="h-6 w-6 rounded-md object-contain" />
        )}
        <div className="flex flex-col items-center">
          <span className="font-black text-base tracking-tighter text-white italic leading-none drop-shadow-sm">
            {isHotel ? 'HOTEL' : 'SHOPY'}
            <span className="text-[#FFD700]">{isHotel ? 'वाले' : 'KART'}</span>
          </span>
          {tag && (
            <span className="text-[7px] font-black tracking-[0.2em] text-white/90 uppercase mt-0.5 leading-none bg-black/20 px-1.5 py-0.5 rounded-full">
              {tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
