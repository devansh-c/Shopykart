
"use client"

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Menu as MenuIcon, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Menu', icon: MenuIcon, href: '/menu' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
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
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const isInRange = useMemo(() => {
    if (!settings?.heatWaveStartTime || !settings?.heatWaveEndTime) return false;
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
    if (start === -1 || end === -1) return false;
    return start < end 
      ? (currentTimeMinutes >= start && currentTimeMinutes <= end)
      : (currentTimeMinutes >= start || currentTimeMinutes <= end);
  }, [settings, currentTimeMinutes]);

  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');
  
  // Logic to determine if restriction is active
  const isRestrictionActive = (settings?.isHeatWaveEnabled === true) || (settings?.heatWaveAutoMode === true && isInRange);

  if (isRestrictionActive && !isExcludedPath) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border/50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full transition-all duration-150 relative active:scale-[0.90] touch-none",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6 transition-transform duration-150", isActive && "scale-110")} />
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide uppercase">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
