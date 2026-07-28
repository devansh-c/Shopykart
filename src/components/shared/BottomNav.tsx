"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, Store, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo } from 'react';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: ClipboardList, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  
  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery');
  }, [pathname]);

  if (isExcludedPath) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] h-20 safe-area-bottom transform-gpu">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all relative active:scale-90",
                isActive ? "text-amber-500" : "text-gray-400"
              )}
            >
              {/* Top Active Indicator */}
              {isActive && (
                <div className="absolute top-0 w-12 h-1 bg-amber-500 rounded-b-full shadow-[0_2px_10px_rgba(245,158,11,0.3)] animate-in fade-in slide-in-from-top-1 duration-300" />
              )}
              
              <div className="relative mb-1">
                <Icon className={cn("h-6 w-6 transition-all duration-300", isActive && "scale-110")} />
                
                {/* Orders Notification Badge */}
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#EF4444] text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-bold tracking-tight transition-all",
                isActive ? "text-amber-600" : "text-gray-500"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
