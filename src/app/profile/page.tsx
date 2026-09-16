
"use client"

import { 
  User, 
  MapPin, 
  LogOut, 
  ChevronRight, 
  ShoppingCart, 
  Store, 
  Bike, 
  Loader2, 
  Phone, 
  Camera, 
  Sparkles, 
  HeartPulse, 
  ShieldCheck,
  Calendar,
  X,
  Smartphone,
  Mail,
  Navigation,
  Heart,
  FileText,
  HelpCircle,
  Share2,
  Users2,
  ShieldAlert,
  UserPlus,
  RefreshCw,
  XCircle,
  Headphones
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { compressImage } from '@/lib/image-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function ProfileContent() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<any>(profileRef);

  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return null;
    try {
      if (profile.createdAt.seconds) return new Date(profile.createdAt.seconds * 1000);
      const d = new Date(profile.createdAt);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) { return null; }
  }, [profile?.createdAt]);

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
          await setDoc(doc(firestore, 'users', user.uid), { 
            profileImageUrl: compressed,
            updatedAt: serverTimestamp()
          }, { merge: true });
          toast({ title: "Profile Updated" });
        }
      } catch (err) { toast({ variant: "destructive", title: "Sync Failed" }); }
      finally { setIsUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth).catch(() => {});
    }
    
    // CLEAR ALL SESSION DATA
    localStorage.removeItem('shopykart_session_active');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_phone');
    
    // CLEAR ALL LOCATION DATA AS REQUESTED
    localStorage.removeItem('user_location_set');
    localStorage.removeItem('active_zone_id');
    localStorage.removeItem('user_city');
    localStorage.removeItem('user_address');
    localStorage.removeItem('user_address_line');
    localStorage.removeItem('user_lat');
    localStorage.removeItem('user_lng');
    localStorage.removeItem('shopykart_zones_cache');

    window.location.href = '/';
  };

  const displayName = profile?.fullName || user?.displayName || 'Premium User';

  const menuItems = [
    {
      section: "PERSONAL SETTINGS",
      items: [
        { label: "Wishlist", icon: Heart, color: "text-red-500", path: "/wishlist" },
        { label: "Active Cart", icon: ShoppingCart, color: "text-rose-500", path: "/cart" },
        { label: "Personal Information", icon: User, color: "text-rose-400", path: "/profile" },
      ]
    },
    {
      section: "INFORMATION & LEGAL",
      items: [
        { label: "CANCELLATION POLICY", icon: XCircle, color: "text-blue-600", path: "/page/cancellation-policy" },
        { label: "TERMS AND CONDITIONS", icon: FileText, color: "text-blue-500", path: "/page/terms-and-conditions" },
        { label: "PRIVACY POLICY", icon: ShieldCheck, color: "text-blue-400", path: "/page/privacy-policy" },
      ]
    },
    {
      section: "BUSINESS & PORTALS",
      items: [
        { label: "Vendor Dashboard", icon: Store, color: "text-red-400", path: "/vendor/login" },
        { label: "Delivery Dashboard", icon: Bike, color: "text-rose-400", path: "/delivery/login" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 transform-gpu">
      <div className="bg-primary h-48 relative">
        <div className="absolute bottom-0 w-full h-10 bg-[#F9FAFB] rounded-t-[3rem]" />
      </div>

      <div className="flex flex-col items-center -mt-24 px-6 text-center">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="h-28 w-28 rounded-full border-4 border-white shadow-2xl relative overflow-hidden bg-white">
            {profile?.profileImageUrl ? <img src={profile.profileImageUrl} className="h-full w-full object-cover" alt="" /> : <div className="h-full w-full flex items-center justify-center bg-gray-100 text-3xl font-black text-primary">{displayName.charAt(0)}</div>}
            {isUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>

        <div className="mt-6 space-y-2">
          <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[7px] uppercase tracking-[0.2em] px-3 py-0.5">GOLD MEMBER</Badge>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">{displayName}</h2>
          {joinedDate && <Badge variant="outline" className="text-[7px] font-black uppercase bg-white text-gray-400">JOINED {format(joinedDate, 'MMM yyyy')}</Badge>}
        </div>
      </div>

      <div className="px-6 mt-10 space-y-10">
        {menuItems.map((section, sIdx) => (
          <div key={sIdx} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-4">{section.section}</h3>
            <div className="space-y-3">
              {section.items.map((item, iIdx) => (
                <button key={iIdx} onClick={() => router.push(item.path)} className="w-full bg-white rounded-[1.75rem] p-5 flex items-center justify-between border border-gray-50 shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-5">
                    <item.icon className={cn("h-6 w-6", item.color)} />
                    <h4 className="text-xs font-black uppercase italic text-gray-900">{item.label}</h4>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-200" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <button onClick={() => setShowLogoutConfirm(true)} className="w-full h-16 bg-white rounded-[2rem] flex items-center gap-4 px-8 text-rose-500 shadow-sm active:scale-95 transition-all border border-rose-50 mt-10">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-black uppercase italic">Sign Out</span>
        </button>
      </div>

      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
         <DialogContent className="rounded-[3rem] max-w-xs p-8 text-center space-y-6">
            <LogOut className="h-12 w-12 text-red-500 mx-auto" />
            <div className="space-y-2">
               <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Sign Out?</DialogTitle>
               <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase">Are you sure you want to end your session?</DialogDescription>
            </div>
            <div className="flex flex-col gap-3">
               <Button onClick={handleSignOut} className="w-full h-14 bg-red-600 text-white rounded-2xl font-black uppercase italic">YES, SIGN OUT</Button>
               <Button onClick={() => setShowLogoutConfirm(false)} variant="ghost" className="w-full h-12 text-gray-400 font-bold uppercase text-[9px]">CANCEL</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ProfileContent />
    </Suspense>
  );
}
