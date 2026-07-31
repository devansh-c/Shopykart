
"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, Store, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo } from 'react';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: ClipboardList, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

/**
 * @fileOverview Floating Glass Navigation - Matched to Apple News+ style reference.
 * Features: Deep backdrop blur, pill shape, and floating elevation.
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

  if (isExcludedPath) return null;

  return (
    <div className="fixed bottom-6 left-0 right-0 z-[10000] px-4 flex justify-center pointer-events-none transform-gpu">
      <nav 
        className="w-full max-w-md bg-white/80 backdrop-blur-2xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 h-20 flex items-center justify-around px-4 pointer-events-auto ring-1 ring-black/5"
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
                <Icon 
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "h-6 w-6 transition-all duration-300", 
                    isActive ? "text-black scale-110" : "text-gray-400 group-hover:text-gray-600"
                  )} 
                />
                
                {/* Notification Badge for Orders */}
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-primary text-white text-[8px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[10px] font-black uppercase tracking-tight leading-none mt-1 transition-colors duration-300",
                isActive ? "text-black" : "text-gray-400 group-hover:text-gray-600"
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
