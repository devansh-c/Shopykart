"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Home, Store, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useCallback, useEffect, useState, useTransition } from 'react';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

/**
 * @fileOverview Atomic-Speed Bottom Navigation.
 * Optimized for Zero Latency using hardware-level PointerEvents and Optimistic UI.
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const [isPending, startTransition] = useTransition();
  
  // OPTIMISTIC STATE: Highlight button instantly before page changes
  const [optimisticPath, setOptimisticPath] = useState(pathname);

  // Sync optimistic state with actual path changes
  useEffect(() => {
    setOptimisticPath(pathname);
  }, [pathname]);

  // Aggressive Prefetching for Light-Speed Transitions
  useEffect(() => {
    navItems.forEach(item => {
      router.prefetch(item.href);
    });
  }, [router]);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty') ||
                         pathname === '/cart';
  
  const handleNav = useCallback((href: string) => {
    if (pathname === href) return;
    
    // 1. VISUAL FEEDBACK: Change icon color instantly (0ms)
    setOptimisticPath(href);

    // 2. HARDWARE ROUTING: Trigger navigation
    startTransition(() => {
      router.push(href);
    });
  }, [pathname, router]);

  if (isExcludedPath) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] transition-none transform-gpu translate-z-0 isolate h-16">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom,0px)] touch-none">
        {navItems.map((item) => {
          // Use optimistic path for active state check to ensure zero visual delay
          const isActive = optimisticPath === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onPointerDown={(e) => {
                // Nuclear tap detection - bypasses all browser delay
                e.preventDefault();
                handleNav(item.href);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-none relative outline-none border-none bg-transparent cursor-pointer select-none touch-none",
                isActive ? "text-primary" : "text-gray-400"
              )}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'none' }}
            >
              <div className="relative pointer-events-none transition-none transform-gpu">
                <Icon className={cn("h-5 w-5 mb-0.5 transition-none", isActive && "stroke-[3.5] scale-110")} />
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[7px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-none">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tighter mt-0.5 pointer-events-none transition-none",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full transition-none" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
