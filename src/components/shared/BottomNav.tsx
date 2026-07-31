
"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Map, Package, Menu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo } from 'react';

/**
 * @fileOverview Exactly matches the user provided screenshot.
 * Features 4 items: Track, Auro (Custom Brand Icon), Orders, Menu.
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
    { label: 'Track', icon: Map, href: '/orders' },
    { label: 'Auro', icon: null, href: '/' }, // Custom Brand Icon
    { label: 'Orders', icon: Package, href: '/cart' },
    { label: 'Menu', icon: Menu, href: '/profile' },
  ];

  if (isExcludedPath) return null;

  return (
    <div className="fixed bottom-8 left-0 right-0 z-[10000] px-4 flex justify-center pointer-events-none transform-gpu">
      <nav 
        className={cn(
          "w-full max-w-[95%] h-[85px] rounded-[2.5rem] flex items-center justify-around px-2 pointer-events-auto transition-all duration-500",
          "bg-white border border-gray-100 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]",
        )}
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all relative active:scale-90 group pt-1"
            >
              <div className="relative mb-1">
                {item.label === 'Auro' ? (
                  /* THE CUSTOM AURO PILL FROM SCREENSHOT */
                  <div className="relative flex items-center justify-center w-14 h-7 bg-black rounded-full border-2 border-[#EF4444] shadow-md group-hover:scale-105 transition-transform">
                    <div className="flex gap-2">
                       <div className="w-2 h-2 bg-[#F5F5F0] rounded-full" />
                       <div className="w-2 h-2 bg-[#F5F5F0] rounded-full" />
                    </div>
                  </div>
                ) : (
                  Icon && (
                    <Icon 
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn(
                        "h-[26px] w-[22px] transition-all duration-300", 
                        isActive ? "text-[#111827]" : "text-[#111827]"
                      )} 
                    />
                  )
                )}
                
                {/* Notification Badge for Orders */}
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 bg-primary text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[12px] font-bold text-[#111827] tracking-tight leading-none mt-1",
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
