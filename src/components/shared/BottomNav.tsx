
"use client"

import { usePathname } from 'next/navigation';
import { Map, ShoppingCart, User, Home, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';

/**
 * @fileOverview Premium Bottom Navigation Centered.
 * Optimized: Removed dialog detection that was causing the nav to disappear permanently.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Threshold to prevent flickering
      if (Math.abs(currentScrollY - lastScrollY.current) < 15) return;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
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
    // Nav hidden on management portals and direct checkout
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') || 
           p.startsWith('/medical') || 
           p.startsWith('/beauty');
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
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[99999] flex justify-center pointer-events-none transform-gpu transition-all duration-500 ease-premium w-full px-4",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-[150%] opacity-0"
      )}
    >
      <nav 
        className={cn(
          "w-full max-w-sm h-[68px] rounded-full flex items-center justify-around px-2 pointer-events-auto",
          "bg-white/80 backdrop-blur-xl border border-black/[0.03] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]",
        )}
      >
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
                      isActive ? "text-primary scale-110" : "text-gray-900 opacity-70"
                    )} 
                  />
                )}
                {item.label === 'Cart' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-in zoom-in">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black tracking-tighter leading-none mt-1.5 uppercase",
                isActive ? "text-primary" : "text-gray-900 opacity-60"
              )}>
                {item.label}
              </span>
              
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
