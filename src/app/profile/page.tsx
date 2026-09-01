
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
  Navigation
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { compressImage } from '@/lib/image-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
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
          const userRef = doc(firestore, 'users', user.uid);
          await setDoc(userRef, { 
            profileImageUrl: compressed,
            updatedAt: serverTimestamp()
          }, { merge: true });
          toast({ title: "Profile Updated" });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Sync Failed" });
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
    window.location.href = '/';
  };

  const displayName = profile?.fullName || user?.displayName || 'Premium User';

  // Safe Date Parsing to prevent RangeError
  const joinedDate = useMemo(() => {
    if (!profile?.createdAt) return null;
    try {
      const createdAt = profile.createdAt;
      // Handle both normalized string and Firestore Timestamp object
      const d = typeof createdAt === 'string' 
        ? new Date(createdAt) 
        : (createdAt.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt));
      
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  }, [profile?.createdAt]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40">
      <div className="bg-primary h-52 relative flex flex-col items-center justify-center pt-8">
        <div className="absolute bottom-0 w-full h-12 bg-[#F9FAFB] rounded-t-[3rem]" />
        
        <div 
          className="relative group cursor-pointer active:scale-95 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar className="h-24 w-24 border-4 border-white shadow-2xl relative z-10 translate-y-4 overflow-hidden bg-white transition-all duration-500">
            {profile?.profileImageUrl ? (
              <AvatarImage src={profile.profileImageUrl} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-3xl font-black bg-muted text-primary">
              {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute bottom-0 right-0 z-20 bg-white p-2 rounded-full shadow-xl border border-border translate-y-4">
            <Camera className="h-3.5 w-3.5 text-primary" />
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

      <div className="px-6 text-center mt-8">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">{displayName}</h2>
        <div className="flex justify-center gap-2 mt-2">
          <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[7px] uppercase tracking-widest px-2.5 py-1">
            ELITE MEMBER
          </Badge>
          {joinedDate && (
            <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest bg-white border-border/50 text-gray-400">
              JOINED {isMounted ? format(joinedDate, 'MMM yyyy') : '...'}
            </Badge>
          )}
        </div>
      </div>

      <div className="px-6 mt-8 space-y-8">
        {/* PERSONAL DETAILS CARD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/40 space-y-4">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shadow-sm border border-green-100">
                 <Smartphone className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Linked Phone</span>
                 <p className="text-sm font-black italic">{profile?.phoneNumber || 'Not Linked'}</p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                 <Navigation className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                 <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Primary Address</span>
                 <p className="text-xs font-bold text-gray-700 leading-tight uppercase line-clamp-1 italic">{profile?.address || 'No address set'}</p>
              </div>
           </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-3">Customer Panel</h3>
          <button onClick={() => router.push('/orders')} className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-border/40 shadow-sm active:scale-[0.98] transition-all">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/5 p-2.5 rounded-xl text-primary"><ShoppingCart className="h-5 w-5" /></div>
              <span className="text-sm font-bold">Manage Orders</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-primary ml-3">Partner Hubs</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { label: 'Beauty & Cosmetics Portal', icon: Sparkles, path: '/vendor/login?type=Beauty', color: 'bg-rose-50 text-rose-600' },
              { label: 'Medical Store Console', icon: HeartPulse, path: '/vendor/login?type=Medical', color: 'bg-teal-50 text-teal-600' },
              { label: 'Delivery Fleet Dashboard', icon: Bike, path: '/delivery/login', color: 'bg-blue-50 text-blue-600' },
            ].map((item: any) => (
              <button key={item.label} onClick={() => router.push(item.path)} className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-border/40 shadow-sm active:scale-[0.97] transition-all">
                <div className="flex items-center space-x-4">
                  <div className={cn("p-2.5 rounded-xl", item.color)}><item.icon className="h-5 w-5" /></div>
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setShowLogoutConfirm(true)} 
          className="w-full bg-white rounded-2xl p-5 flex items-center space-x-4 text-red-500 border border-red-50 shadow-sm active:scale-95 transition-all mt-4"
        >
          <div className="bg-red-50 p-2.5 rounded-xl"><LogOut className="h-5 w-5" /></div>
          <span className="text-sm font-black uppercase italic">Disconnect Account</span>
        </button>
      </div>

      {/* SIGN OUT CONFIRMATION DIALOG */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
         <DialogContent className="rounded-[2.5rem] max-w-xs p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
            <div className="p-8 text-center space-y-6">
               <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mx-auto shadow-inner">
                  <LogOut className="h-8 w-8" />
               </div>
               <div className="space-y-2">
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Sign Out?</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Are you sure you want to end your session?</DialogDescription>
               </div>
               <div className="flex flex-col gap-3 pt-2">
                  <Button onClick={handleSignOut} className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase italic shadow-lg shadow-red-100">YES, SIGN OUT</Button>
                  <Button onClick={() => setShowLogoutConfirm(false)} variant="ghost" className="w-full h-12 text-gray-400 font-bold uppercase text-[9px] tracking-widest">CANCEL</Button>
               </div>
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
