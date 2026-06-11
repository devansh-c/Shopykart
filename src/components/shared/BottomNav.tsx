"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Home, Store, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { memo, useMemo, useTransition } from 'react';
import Link from 'next/link';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

/**
 * PERFORMANCE REFACTOR: Bottom Navigation with useTransition.
 * Ensures state updates (active colors) are prioritized, while heavy page transitions are non-blocking.
 */
export const BottomNav = memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const [isPending, startTransition] = useTransition();
  
  const isExcludedPath = useMemo(() => {
    // Robust check including trailing slashes and sub-paths
    if (!pathname) return false;
    const normalizedPath = pathname.endsWith('/') ? pathname : `${pathname}/`;
    
    return normalizedPath.startsWith('/admin/') || 
           normalizedPath.startsWith('/vendor/') || 
           normalizedPath.startsWith('/delivery/') ||
           normalizedPath.startsWith('/Medical/') ||
           normalizedPath.startsWith('/Beauty/') ||
           normalizedPath.startsWith('/cart/');
  }, [pathname]);

  const handleNavigate = (href: string) => {
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  if (isExcludedPath) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] h-16 safe-area-bottom pointer-events-auto transform-gpu">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onPointerDown={(e) => {
                e.preventDefault();
                handleNavigate(item.href);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative active:scale-90",
                isActive ? "text-primary" : "text-gray-400",
                isPending && !isActive && "opacity-80"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-0.5", isActive && "stroke-[3] scale-110")} />
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[7px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tight mt-0.5 transition-opacity",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";
