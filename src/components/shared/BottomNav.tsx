
"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Map, ShoppingCart, User, Home, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo } from 'react';

/**
 * @fileOverview Compact Bottom Navigation with Rewards section.
 * Height maintained at 68px for a sleek look with 5 items.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  
  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    // Hidden on Admin, Vendor, Delivery and Checkout (Cart) pages
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') || 
           p.startsWith('/cart');
  }, [pathname]);

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Rewards', icon: Gift, href: '/rewards' },
    { label: 'Track', icon: Map, href: '/orders' },
    { label: 'Cart', icon: ShoppingCart, href: '/cart' },
    { label: 'Profile', icon: User, href: '/profile' },
  ];

  if (isExcludedPath) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[10000] px-5 flex justify-center pointer-events-none transform-gpu">
      <nav 
        className={cn(
          "w-full max-w-md h-[68px] rounded-full flex items-center justify-around px-2 pointer-events-auto transition-all duration-500",
          "bg-white border border-gray-100 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)]",
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
                
                {/* Notification Badge for Cart */}
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
