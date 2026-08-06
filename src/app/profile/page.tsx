
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

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);
  const { data: pages } = useCollection<any>(pagesQuery);

  const handleAction = (path: string, label: string) => {
    if (path) {
      startTransition(() => {
        router.push(path);
      });
    } else {
      toast({
        title: "Coming Soon",
        description: `${label} section is being upgraded.`,
      });
    }
  };

  const handleShareApp = () => {
    const shareText = `Hey! Check out ShopyKart for premium food delivery. Download now: https://shopykart.co.in`;
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
          const userRef = doc(firestore, 'users', user.uid);
          await setDoc(userRef, { 
            profileImageUrl: compressed,
            updatedAt: serverTimestamp()
          }, { merge: true });
          toast({ title: "Profile Updated" });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Upload Failed" });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRaiseTicket = async () => {
    if (!firestore || !user || !ticketData.description.trim() || ticketData.phone.length !== 10) return;
    setIsRaising(true);
    try {
      await addDoc(collection(firestore, 'tickets'), {
        userId: user.uid,
        customerName: profile?.fullName || 'Premium User',
        description: ticketData.description.trim(),
        phone: ticketData.phone,
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setTicketState('success');
      setTicketData({ description: '', phone: '' });
    } catch (err) {
      toast({ variant: "destructive", title: "Could not raise ticket" });
    } finally {
      setIsRaising(false);
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth).catch(() => {});
    }
    localStorage.removeItem('shopykart_session_active');
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('team_permissions');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_phone');
    localStorage.removeItem('user_location_set');
    window.location.href = '/';
  };

  const getPageIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('privacy')) return ShieldCheck;
    if (t.includes('terms') || t.includes('condition')) return ScrollText;
    if (t.includes('cancel')) return XCircle;
    if (t.includes('refund') || t.includes('return')) return Undo2;
    if (t.includes('about')) return Info;
    return FileText;
  };

  const displayName = profile?.fullName || user?.displayName || 'Premium User';
  const displayPhone = profile?.phoneNumber || user?.phoneNumber || 'Identity Verified';

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
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
      </div>

      <div className="px-4 text-center mt-12">
        <div className="flex items-center justify-center gap-2 mb-1">
           {isPremium ? (
             <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1 flex items-center gap-1.5 animate-pulse">
               <Crown className="h-3 w-3 fill-amber-700" /> Elite Member
             </Badge>
           ) : (
             <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1">Gold Member</Badge>
           )}
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">{displayName}</h2>
        <div className="flex items-center justify-center gap-2 mt-2 opacity-60">
           <Phone className="h-3 w-3 text-muted-foreground" />
           <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">{displayPhone}</p>
        </div>
      </div>

      <div className="px-4 mt-8 space-y-6">
        {isPremium && isMounted && (
          <div className="bg-green-50 border-2 border-dashed border-green-200 rounded-[2rem] p-6 flex flex-col gap-2 shadow-sm animate-in zoom-in-95 duration-500">
             <div className="flex items-center gap-2 text-green-700">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-widest">Elite Account Active</span>
             </div>
             <p className="text-[10px] font-bold text-green-600 uppercase">Zero Taxes & Fees Enabled by Admin</p>
          </div>
        )}

        <button 
          onClick={handleShareApp}
          className="w-full bg-[#0B0B0B] rounded-[2rem] p-6 flex items-center justify-between text-white shadow-xl shadow-gray-200 relative overflow-hidden group active:scale-[0.97] transition-all"
        >
          <div className="relative z-10 flex items-center gap-4">
             <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/20">
                <Share2 className="h-6 w-6 text-white" />
             </div>
             <div className="text-left">
                <h4 className="text-lg font-black italic uppercase tracking-tight">Invite Friends</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spread the gourmet love</p>
             </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-600 relative z-10" />
        </button>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Personal Settings</h3>
          {[
            { label: 'Wishlist', icon: Heart, path: '/wishlist' },
            { label: 'Active Cart', icon: ShoppingCart, path: '/cart' },
            { label: 'Personal Information', icon: User, path: '' },
            { label: 'Delivery Addresses', icon: MapPin, path: '' },
          ].map((item) => (
            <button 
              key={item.label}
              onClick={() => handleAction(item.path, item.label)}
              className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-border/40 shadow-sm active:scale-[0.98] transition-all"
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
          {[
            { label: 'Join as Beauty & Cosmetics', icon: Sparkles, path: '/vendor/register?type=Beauty', description: 'Sell luxury skincare & makeup', highlight: true, accent: 'rose' },
            { label: 'Join as Medical Store', icon: HeartPulse, path: '/vendor/register?type=Medical', description: 'Sell healthcare products & medicine', highlight: true, accent: 'teal' },
            { label: 'Vendor Dashboard', icon: Store, path: '/vendor/dashboard', description: 'Manage your store and products' },
            { label: 'Delivery Dashboard', icon: Bike, path: '/delivery/dashboard', description: 'View and accept delivery tasks' },
            { label: 'Join as Team Member', icon: ShieldAlert, path: '/admin/login?mode=team', description: 'Access assigned staff portals' },
          ].map((item: any) => (
            <button 
              key={item.label}
              onClick={() => handleAction(item.path, item.label)}
              className={cn(
                "w-full rounded-2xl p-4 flex items-center justify-between border shadow-sm active:scale-[0.97] transition-all group",
                item.highlight && item.accent === 'rose' ? "bg-rose-50 border-rose-100" :
                item.highlight && item.accent === 'teal' ? "bg-teal-50 border-teal-100" : 
                "bg-white border-primary/10"
              )}
            >
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  item.highlight && item.accent === 'rose' ? "bg-rose-100 text-rose-600" :
                  item.highlight && item.accent === 'teal' ? "bg-teal-100 text-teal-600" :
                  "bg-primary/10 text-primary"
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold block leading-none">{item.label}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">{item.description}</span>
                </div>
              </div>
              <ChevronRight className={cn(
                "h-4 w-4", 
                item.highlight && item.accent === 'rose' ? "text-rose-400" :
                item.highlight && item.accent === 'teal' ? "text-teal-400" :
                "text-primary"
              )} />
            </button>
          ))}
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full bg-white rounded-2xl p-4 flex items-center space-x-4 text-red-500 border border-red-50 active:scale-95 transition-all mt-6"
        >
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
