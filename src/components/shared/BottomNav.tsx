
"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Menu as MenuIcon, Package, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCart } from '@/components/cart/CartProvider';

const navItems = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Menu', icon: MenuIcon, href: '/menu' },
  { label: 'Orders', icon: Package, href: '/orders' },
  { label: 'Rewards', icon: Gift, href: '/rewards' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-t border-border/50 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 w-full transition-all duration-300 relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6 transition-transform", isActive && "scale-110")} />
                {item.label === 'Orders' && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide uppercase">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
