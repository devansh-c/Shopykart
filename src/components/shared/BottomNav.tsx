
"use client"

import { usePathname } from 'next/navigation';
import { Map, ShoppingCart, User, Home, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * @fileOverview Fixed Bottom Navigation for ShopyKart.
 * Ensures Nav is always fixed to the bottom of the viewport.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    // Nav hidden only on business portals
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') || 
           p.startsWith('/medical/store') || 
           p.startsWith('/beauty/store');
  }, [pathname]);

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Cart', icon: ShoppingCart, href: '/cart' },
    { label: 'Track', icon: Map, href: '/orders' },
    { label: 'Rewards', icon: Gift, href: '/rewards' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  if (!isMounted || isExcludedPath) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[999999] bg-white border-t border-black/[0.05] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-safe">
      <nav className="max-w-lg mx-auto h-[68px] flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all relative active:scale-90 group"
            >
              <div className="relative">
                {Icon && (
                  <Icon 
                    strokeWidth={isActive ? 3 : 2}
                    className={cn(
                      "h-5 w-5 transition-all duration-300", 
                      isActive ? "text-primary scale-110" : "text-gray-900 opacity-60"
                    )} 
                  />
                )}
                {item.label === 'Cart' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black tracking-tighter mt-1.5 uppercase",
                isActive ? "text-primary" : "text-gray-900 opacity-50"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
