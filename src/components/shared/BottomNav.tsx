"use client"

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Store, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const firestore = useFirestore();
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  // Fetch Heat Wave Status
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    };
    updateTime();
    const interval = setInterval(updateTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  const isRestrictionActive = useMemo(() => {
    if (!settings) return false;
    if (settings.isHeatWaveEnabled === true) return true;
    
    if (settings.heatWaveAutoMode === true && settings.heatWaveStartTime && settings.heatWaveEndTime) {
      const parseTimeToMinutes = (timeStr: string) => {
        try {
          const [time, modifier] = timeStr.trim().split(' ');
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          return hours * 60 + (minutes || 0);
        } catch (e) { return -1; }
      };
      const start = parseTimeToMinutes(settings.heatWaveStartTime);
      const end = parseTimeToMinutes(settings.heatWaveEndTime);
      if (start !== -1 && end !== -1) {
        return start < end 
          ? (currentTimeMinutes >= start && currentTimeMinutes <= end)
          : (currentTimeMinutes >= start || currentTimeMinutes <= end);
      }
    }
    return false;
  }, [settings, currentTimeMinutes]);

  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');
  
  if (isRestrictionActive && !isExcludedPath) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch={true}
              onPointerDown={() => router.prefetch(item.href)}
              onTouchStart={() => router.prefetch(item.href)}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-none relative active:scale-[0.88] touch-manipulation",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6", isActive && "scale-110")} />
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-black tracking-widest uppercase italic">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}