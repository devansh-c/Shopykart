"use client"

import { usePathname } from 'next/navigation';
import { Home, Store, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { memo } from 'react';
import Link from 'next/link';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

/**
 * @fileOverview Atomic-Speed Bottom Navigation.
 * Optimized for zero latency using Next.js native Link prefetching.
 */
export const BottomNav = memo(() => {
  const pathname = usePathname();
  const { totalItems } = useCart();
  
  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty') ||
                         pathname === '/cart';

  if (isExcludedPath) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] h-16 safe-area-bottom">
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative active:scale-90",
                isActive ? "text-primary" : "text-gray-400"
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
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";
