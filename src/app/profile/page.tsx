
"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { User, MapPin, CreditCard, LogOut, ChevronRight, Heart, ShoppingCart, Store, Bike, Loader2, Phone, Camera, Share2, MessageCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRef, useState } from 'react';
import { compressImage } from '@/lib/image-utils';

export default function ProfilePage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<any>(profileRef);
  
  const mainItems = [
    { label: 'Wishlist', icon: Heart, path: '/wishlist' },
    { label: 'Active Cart', icon: ShoppingCart, path: '/cart' },
    { label: 'Personal Information', icon: User },
    { label: 'Delivery Addresses', icon: MapPin },
  ];

  const dashboardItems = [
    { label: 'Vendor Dashboard', icon: Store, path: '/vendor/dashboard', description: 'Manage your store and products' },
    { label: 'Delivery Dashboard', icon: Bike, path: '/delivery/dashboard', description: 'View and accept delivery tasks' },
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

  const handleShareApp = () => {
    const shareText = `Hey! Check out ShopyKart for premium food delivery in Ranipur & Mauranipur. Download now: https://shopykart.co.in`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const compressed = await compressImage(base64, 400, 400);
        if (firestore && user) {
          // Use setDoc with merge to prevent "No document to update" error
          const userRef = doc(firestore, 'users', user.uid);
          await setDoc(userRef, { 
            profileImageUrl: compressed,
            updatedAt: serverTimestamp()
          }, { merge: true });
          toast({ title: "Profile Updated", description: "Your new photo is now live." });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Upload Failed" });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth).catch(() => {});
    }
    localStorage.removeItem('shopykart_session_active');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('user_location_set');
    toast({ title: "Signed Out", description: "Come back soon!" });
    window.location.href = '/';
  };

  const displayName = profile?.fullName || user?.displayName || 'Premium User';
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || 'Identity Verified';

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="bg-primary h-56 relative flex flex-col items-center justify-center pt-8">
        <div className="absolute bottom-0 w-full h-16 bg-[#F9FAFB] rounded-t-[3rem]" />
        
        <div 
          className="relative group cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar className="h-28 w-28 border-4 border-white shadow-2xl relative z-10 translate-y-6 active:scale-95 transition-transform overflow-hidden bg-muted">
            {profile?.profileImageUrl ? (
              <AvatarImage src={profile.profileImageUrl} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-4xl font-black bg-muted text-primary">
              {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute bottom-0 right-0 z-20 bg-white p-2.5 rounded-full shadow-xl border border-border translate-y-6 group-hover:scale-110 transition-transform">
            <Camera className="h-4 w-4 text-primary" />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
        </div>
      </div>

      <div className="px-4 text-center mt-12">
        <div className="flex items-center justify-center gap-2 mb-1">
           <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1">Gold Member</Badge>
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
          {displayName}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-2 opacity-60">
           <Phone className="h-3 w-3 text-muted-foreground" />
           <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
             {displayPhone}
           </p>
        </div>
      </div>

      <div className="px-4 mt-8 space-y-6">
        {/* Share App Card */}
        <button 
          onClick={handleShareApp}
          className="w-full bg-[#0B0B0B] rounded-[2rem] p-6 flex items-center justify-between text-white shadow-xl shadow-gray-200 relative overflow-hidden group active:scale-95 transition-all"
        >
          <div className="relative z-10 flex items-center gap-4">
             <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/20">
                <Share2 className="h-6 w-6 text-white" />
             </div>
             <div className="text-left">
                <h4 className="text-lg font-black italic uppercase tracking-tight">Share & Grow</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Send invite to friends</p>
             </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-600 relative z-10 group-hover:text-primary transition-colors" />
          <div className="absolute top-0 right-0 h-full w-24 bg-primary/5 -skew-x-12 translate-x-10" />
        </button>

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
          onClick={handleSignOut}
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
