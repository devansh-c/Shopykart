
"use client"

import { usePathname } from 'next/navigation';
import { Map, ShoppingCart, User, Home, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo, useState, useEffect, memo } from 'react';
import Link from 'next/link';

/**
 * @fileOverview Ultra-Glassy Fixed Bottom Navigation.
 * Uses advanced glassmorphism with light transparency and high blur.
 */
const BottomNav = memo(() => {
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
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] z-[999999] transform-gpu">
      <nav className="bg-white/40 backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-[2rem] h-[72px] flex items-center justify-around px-4 overflow-hidden">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all relative active:scale-90 group outline-none"
            >
              <div className="relative">
                {Icon && (
                  <Icon 
                    strokeWidth={isActive ? 3 : 2}
                    className={cn(
                      "h-5 w-5 transition-all duration-300 transform-gpu", 
                      isActive ? "text-primary scale-110" : "text-gray-900 opacity-60"
                    )} 
                  />
                )}
                {item.label === 'Cart' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black tracking-tighter mt-1.5 uppercase transition-all transform-gpu",
                isActive ? "text-primary translate-y-0.5" : "text-gray-900 opacity-50"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
});

BottomNav.displayName = "BottomNav";
export default BottomNav;
