
"use client"

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Store, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Stores', icon: Store, href: '/stores' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalItems } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Prefetch all pages for instant navigation
    navItems.forEach(item => router.prefetch(item.href));
  }, [router]);

  const handleNav = (href: string) => {
    if (pathname !== href) {
      router.push(href);
    }
  };

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery');
  
  if (isExcludedPath || !mounted) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom,16px)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] block">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onPointerDown={(e) => { 
                e.preventDefault(); 
                handleNav(item.href); 
              }}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full h-full transition-all active:scale-90 touch-manipulation relative",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <div className="relative">
                <div className={cn(
                  "p-1.5 rounded-xl transition-colors duration-200",
                  isActive ? "bg-primary/5" : "bg-transparent"
                )}>
                  <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
                </div>
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black tracking-widest uppercase italic transition-opacity",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-4 h-1 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
