
"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { User, MapPin, CreditCard, Settings, LogOut, ChevronRight, Heart, ShoppingCart, Store, Bike, LayoutDashboard } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const mainItems = [
    { label: 'Wishlist', icon: Heart, path: '/wishlist' },
    { label: 'Active Cart', icon: ShoppingCart, path: '/cart' },
    { label: 'Personal Information', icon: User },
    { label: 'Delivery Addresses', icon: MapPin },
    { label: 'Payment Methods', icon: CreditCard },
  ];

  const dashboardItems = [
    { label: 'Vendor Dashboard', icon: Store, path: '/vendor/dashboard', description: 'Manage your store and products' },
    { label: 'Delivery Dashboard', icon: Bike, path: '/delivery/dashboard', description: 'View and accept delivery tasks' },
    { label: 'Admin Panel', icon: LayoutDashboard, path: '/admin/login', description: 'Global app administration' },
  ];

  const handleAction = (item: any) => {
    if (item.path) {
      router.push(item.path);
    } else {
      toast({
        title: item.label,
        description: "This feature is coming soon in a future update.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      {/* Profile Header */}
      <div className="bg-primary h-56 relative flex flex-col items-center justify-center pt-8">
        <div className="absolute bottom-0 w-full h-16 bg-[#F9FAFB] rounded-t-[3rem]" />
        <div className="relative group">
          <Avatar className="h-28 w-28 border-4 border-white shadow-2xl relative z-10 translate-y-6 active:scale-95 transition-transform">
            <AvatarImage src="https://picsum.photos/seed/user-avatar/200/200" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/20 rounded-full z-20 translate-y-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
            <span className="text-white text-[10px] font-bold uppercase">Edit</span>
          </div>
        </div>
      </div>

      <div className="px-4 text-center mt-10">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">John Doe</h2>
        <p className="text-muted-foreground text-sm font-medium">Gold Member since 2023</p>
      </div>

      <div className="px-4 mt-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Personal Settings</h3>
          {mainItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => handleAction(item)}
              className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-border/40 shadow-sm active:scale-[0.98] transition-all hover:border-primary/20"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-secondary/40 p-2.5 rounded-xl text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Business & Portals</h3>
          {dashboardItems.map((item) => (
            <button 
              key={item.label}
              onClick={() => handleAction(item)}
              className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-primary/10 shadow-sm active:scale-[0.98] transition-all hover:bg-primary/5"
            >
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block leading-none">{item.label}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{item.description}</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-primary" />
            </button>
          ))}
        </div>

        <button 
          onClick={() => {
            toast({ title: "Signed Out", description: "Come back soon!" });
            router.push('/');
          }}
          className="w-full bg-white rounded-2xl p-4 flex items-center space-x-4 text-red-500 border border-red-50 hover:bg-red-50 transition-colors mt-6"
        >
          <div className="bg-red-50 p-2.5 rounded-xl">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
