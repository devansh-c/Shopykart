
"use client"

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

  // Exclusion logic for admin/vendor panels only
  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery');
  
  if (isExcludedPath) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom,16px)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              onPointerDown={(e) => { 
                e.preventDefault(); 
                router.push(item.href);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-90",
                isActive ? "text-primary" : "text-gray-400"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5 mb-0.5", isActive && "stroke-[2.5]")} />
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[7px] font-black h-3.5 w-3.5 rounded-full flex items-center justify-center border border-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tight",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
