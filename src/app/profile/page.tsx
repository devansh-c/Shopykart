
"use client"

import { 
  User, 
  MapPin, 
  LogOut, 
  ChevronRight, 
  Heart, 
  ShoppingCart, 
  Store, 
  Bike, 
  Loader2, 
  Phone, 
  Camera, 
  Share2, 
  MessageCircle, 
  FileText, 
  Info, 
  LifeBuoy, 
  Mail, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Headphones,
  ShieldCheck,
  ScrollText,
  XCircle,
  Undo2,
  HeartPulse,
  Users,
  ShieldAlert,
  Crown,
  Smartphone,
  Hash,
  ArrowRight,
  Clock,
  AlertCircle,
  Calendar,
  QrCode,
  Utensils
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { useRef, useState, useEffect, useMemo, useTransition, Suspense } from 'react';
import { compressImage } from '@/lib/image-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, slugify } from '@/lib/utils';
import { format } from 'date-fns';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSupportExpanded, setIsSupportExpanded] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketState, setTicketState] = useState<'form' | 'success'>('form');
  const [isRaising, setIsRaising] = useState(false);

  const [ticketData, setTicketData] = useState({
    description: '',
    phone: ''
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<any>(profileRef);

  const isPremium = useMemo(() => {
    if (!profile?.isPremium || !profile?.premiumExpiry) return false;
    const expiry = new Date(profile.premiumExpiry).getTime();
    return expiry > Date.now();
  }, [profile]);

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
          toast({ title: "Profile Updated", description: "Identity photo synced." });
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

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="bg-primary h-56 relative flex flex-col items-center justify-center pt-8">
        <div className="absolute bottom-0 w-full h-16 bg-white rounded-t-[3rem]" />
        
        <div 
          className="relative group cursor-pointer active:scale-95 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          <Avatar className="h-28 w-28 border-4 border-white shadow-2xl relative z-10 translate-y-6 overflow-hidden bg-muted transition-all duration-500">
            {profile?.profileImageUrl ? (
              <AvatarImage src={profile.profileImageUrl} className="object-cover" />
            ) : null}
            <AvatarFallback className="text-4xl font-black bg-muted text-primary">
              {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="absolute bottom-0 right-0 z-20 bg-white p-2.5 rounded-full shadow-xl border border-border translate-y-6">
            <Camera className="h-4 w-4 text-primary" />
          </div>
          
          {/* CAMERA TRIGGER: accept="image/*" handles OS permissions */}
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
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">{displayName}</h2>
        <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1 mt-2">
          {isPremium ? 'Elite Member' : 'Gold Member'}
        </Badge>
      </div>

      <div className="px-4 mt-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Personal Settings</h3>
          <button onClick={() => router.push('/orders')} className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-border/40 shadow-sm active:scale-[0.98] transition-all">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary/40 p-2.5 rounded-xl text-primary"><ShoppingCart className="h-5 w-5" /></div>
              <span className="text-sm font-bold">My Orders</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Business & Portals</h3>
          {[
            { label: 'Join as Beauty & Cosmetics', icon: Sparkles, path: '/vendor/register?type=Beauty' },
            { label: 'Join as Medical Store', icon: HeartPulse, path: '/vendor/register?type=Medical' },
            { label: 'Vendor Dashboard', icon: Store, path: '/vendor/dashboard' },
            { label: 'Delivery Dashboard', icon: Bike, path: '/delivery/dashboard' },
          ].map((item: any) => (
            <button key={item.label} onClick={() => router.push(item.path)} className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-primary/10 shadow-sm active:scale-[0.97] transition-all">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><item.icon className="h-5 w-5" /></div>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-primary" />
            </button>
          ))}
        </div>

        <button onClick={handleSignOut} className="w-full bg-white rounded-2xl p-4 flex items-center space-x-4 text-red-500 border border-red-50 active:scale-95 transition-all mt-6">
          <div className="bg-red-50 p-2.5 rounded-xl"><LogOut className="h-5 w-5" /></div>
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>
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
