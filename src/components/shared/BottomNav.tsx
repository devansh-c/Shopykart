"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo } from 'react';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Package, href: '/stores' },
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
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-[#0B0B0B] border-t border-white/5 shadow-2xl h-20 safe-area-bottom transform-gpu rounded-t-[2.5rem]">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all relative active:scale-90",
                isActive ? "text-white" : "text-gray-600"
              )}
            >
              {isActive && (
                <div className="absolute top-0 w-10 h-1 bg-amber-400 rounded-b-full shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-in fade-in slide-in-from-top-1 duration-300" />
              )}
              <div className="relative">
                <Icon className={cn("h-6 w-6 mb-1 transition-all duration-300", isActive && "text-white scale-110")} />
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-[#0B0B0B] animate-pulse">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest mt-0.5 transition-opacity",
                isActive ? "opacity-100" : "opacity-40"
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