"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Map, ShoppingCart, User, Home, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo, useState, useEffect, useRef } from 'react';

/**
 * @fileOverview Premium Bottom Navigation Centered.
 * Features: Center Aligned, Hide on Scroll Down, Show on Scroll Up, Frosted Glass Effect.
 * Order: Home | Cart | Track | Rewards | Profile
 */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) return;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') || 
           p.startsWith('/cart');
  }, [pathname]);

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Cart', icon: ShoppingCart, href: '/cart' },
    { label: 'Track', icon: Map, href: '/orders' },
    { label: 'Rewards', icon: Gift, href: '/rewards' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  if (isExcludedPath) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex justify-center pointer-events-none transform-gpu transition-transform duration-500 ease-premium w-full px-4",
        isVisible ? "translate-y-0" : "translate-y-[150%]"
      )}
    >
      <nav 
        className={cn(
          "w-full max-w-sm h-[68px] rounded-full flex items-center justify-around px-2 pointer-events-auto",
          "bg-white/70 backdrop-blur-xl border border-white/30 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.2)]",
        )}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all relative active:scale-90 group"
            >
              <div className="relative">
                {Icon && (
                  <Icon 
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn(
                      "h-5 w-5 transition-all duration-300", 
                      isActive ? "text-primary" : "text-gray-900"
                    )} 
                  />
                )}
                {item.label === 'Cart' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-tight leading-none mt-1 uppercase",
                isActive ? "text-primary" : "text-gray-900"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}