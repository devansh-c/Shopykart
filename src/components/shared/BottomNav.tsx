"use client"

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Store, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

/**
 * @fileOverview BottomNav with 5 premium options.
 * Optimized for TRUE Zero Latency and Premium Smoothness.
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();

  // Prefetch all top level routes for instant switching
  useEffect(() => {
    navItems.forEach(item => router.prefetch(item.href));
  }, [router]);

  const handleNav = (href: string) => {
    if (pathname !== href) {
      router.push(href);
    }
  };

  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');
  
  if (isExcludedPath) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border/40 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom-full duration-500">
      <div className="flex justify-around items-center h-18 max-w-lg mx-auto px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onPointerDown={(e) => { e.preventDefault(); handleNav(item.href); }}
              className={cn(
                "flex flex-col items-center justify-center space-y-1.5 w-full h-full transition-all duration-300 relative active:scale-[0.85] touch-manipulation",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-500",
                  isActive ? "bg-primary/5 scale-110 shadow-inner" : "bg-transparent"
                )}>
                  <Icon className={cn("h-5.5 w-5.5", isActive && "stroke-[2.5]")} />
                </div>
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black tracking-widest uppercase italic transition-all duration-300",
                isActive ? "opacity-100 translate-y-0" : "opacity-60"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-5 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-500" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
