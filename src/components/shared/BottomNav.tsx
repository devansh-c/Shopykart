"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Home, Store, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useCallback, useEffect, useState, memo } from 'react';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

/**
 * @fileOverview Atomic-Speed Bottom Navigation.
 * Optimized for zero latency and instant visual feedback with aggressive routing.
 */
export const BottomNav = memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  
  // Optimistic path for 0ms visual feedback
  const [activePath, setActivePath] = useState(pathname);

  // Sync active path with actual pathname when navigation completes
  useEffect(() => {
    setActivePath(pathname);
  }, [pathname]);

  // Aggressive Prefetching for ALL routes
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
    if (activePath === href) return;
    
    // 1. INSTANT VISUAL FEEDBACK (0ms)
    setActivePath(href);

    // 2. IMMEDIATE NAVIGATION (Skip unnecessary NextJS features for speed)
    router.push(href, { scroll: false });
  }, [activePath, router]);

  if (isExcludedPath) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] transition-none transform-gpu translate-z-0 isolate h-16">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2 pb-[env(safe-area-inset-bottom,0px)] touch-none">
        {navItems.map((item) => {
          const isActive = activePath === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onPointerDown={(e) => {
                e.preventDefault();
                handleNav(item.href);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-none relative outline-none border-none bg-transparent cursor-pointer select-none touch-none transform-gpu",
                isActive ? "text-primary" : "text-gray-400"
              )}
              style={{ WebkitTapHighlightColor: 'transparent', touchAction: 'none' }}
            >
              <div className="relative pointer-events-none transition-none">
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
});

BottomNav.displayName = "BottomNav";