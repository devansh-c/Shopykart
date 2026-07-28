
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

  // COLORS MATCHED FROM SCREENSHOT
  const ACTIVE_COLOR = "#D4A017"; // Mustard Golden
  const INACTIVE_COLOR = "#4A4A4A"; // Charcoal Grey
  const BG_COLOR = "#FDFDFD"; // Soft Off-White

  return (
    <nav 
      style={{ backgroundColor: BG_COLOR }}
      className="fixed bottom-0 left-0 right-0 z-[10000] border-t border-gray-100 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] h-20 safe-area-bottom transform-gpu"
    >
      <div className="flex justify-around items-center h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname === '/' && item.href === '/') || (pathname?.startsWith(item.href) && item.href !== '/');
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center flex-1 h-full transition-all relative active:scale-90"
              style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
            >
              {/* Top Active Indicator Line */}
              {isActive && (
                <div 
                  style={{ backgroundColor: ACTIVE_COLOR }}
                  className="absolute top-0 w-12 h-1 rounded-b-full shadow-sm animate-in fade-in slide-in-from-top-1 duration-300" 
                />
              )}
              
              <div className="relative mb-1">
                <Icon 
                  strokeWidth={2.5}
                  className={cn("h-6 w-6 transition-transform duration-300", isActive && "scale-105")} 
                />
                
                {/* Orders Notification Badge (Red Circle from Screenshot) */}
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#FF3B30] text-white text-[8px] font-black h-4.5 w-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-in zoom-in duration-300">
                    {totalItems}
                  </span>
                )}
              </div>
              
              <span className="text-[10px] font-black uppercase tracking-tight leading-none mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
