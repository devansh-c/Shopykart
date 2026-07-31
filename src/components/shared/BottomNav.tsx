
"use client"

import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, Store, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';
import React, { useMemo } from 'react';

const navItems = [
  { label: 'Today', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: ClipboardList, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Account', icon: User, href: '/profile' },
];

/**
 * @fileOverview Apple News+ Styled Floating Water-Glass Navigation.
 * Optimized for high-end glassmorphism and smooth silver aesthetics.
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
    <div className="fixed bottom-8 left-0 right-0 z-[10000] px-6 flex justify-center pointer-events-none transform-gpu">
      <nav 
        className={cn(
          "w-full max-w-md h-[72px] rounded-full flex items-center justify-around px-4 pointer-events-auto transition-all duration-500",
          "bg-white/70 backdrop-blur-[30px] border border-white/60 shadow-[0_20px_40px_rgba(0,0,0,0.08)]",
          "ring-1 ring-black/[0.03]"
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
                <Icon 
                  strokeWidth={isActive ? 2.8 : 2}
                  className={cn(
                    "h-[22px] w-[22px] transition-all duration-300", 
                    isActive ? "text-black scale-110" : "text-black/40 group-hover:text-black/60"
                  )} 
                />
                
                {/* Notification Badge for Orders */}
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 bg-primary text-white text-[7px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tight leading-none mt-1.5 transition-colors duration-300",
                isActive ? "text-black" : "text-black/40 group-hover:text-black/60"
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
