"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { User, MapPin, CreditCard, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { toast } = useToast();
  
  const menuItems = [
    { label: 'Personal Information', icon: User },
    { label: 'Delivery Addresses', icon: MapPin },
    { label: 'Payment Methods', icon: CreditCard },
    { label: 'Settings', icon: Settings },
  ];

  const handleAction = (label: string) => {
    toast({
      title: label,
      description: "This feature is coming soon in a future update.",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Profile Header */}
      <div className="bg-primary h-48 relative flex flex-col items-center justify-center pt-8">
        <div className="absolute bottom-0 w-full h-12 bg-background rounded-t-[3rem]" />
        <Avatar className="h-24 w-24 border-4 border-white shadow-xl relative z-10 translate-y-4">
          <AvatarImage src="https://picsum.photos/seed/user-avatar/100/100" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>

      <div className="px-4 text-center mt-6">
        <h2 className="text-2xl font-black">John Doe</h2>
        <p className="text-muted-foreground text-sm">john.doe@example.com</p>
      </div>

      <div className="px-4 mt-8 space-y-3">
        {menuItems.map((item) => (
          <button 
            key={item.label}
            onClick={() => handleAction(item.label)}
            className="w-full premium-card p-4 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className="bg-secondary/50 p-2 rounded-xl text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold">{item.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}

        <button 
          onClick={() => handleAction("Sign Out")}
          className="w-full premium-card p-4 flex items-center space-x-3 text-red-500 hover:bg-red-50 transition-colors mt-6"
        >
          <div className="bg-red-50 p-2 rounded-xl">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
