
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
  HeartPulse
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { useRef, useState, useEffect, useTransition } from 'react';
import { compressImage } from '@/lib/image-utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSupportExpanded, setIsSupportExpanded] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [ticketState, setTicketState] = useState<'form' | 'success'>('form');
  const [isRaising, setIsRaising] = useState(false);
  
  const [ticketData, setTicketData] = useState({
    description: '',
    phone: ''
  });

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<any>(profileRef);

  const pagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'pages');
  }, [firestore]);
  const { data: pages } = useCollection<any>(pagesQuery);

  // Aggressive Prefetching for Dashboard Routes
  useEffect(() => {
    const routes = ['/Beauty/store', '/Medical/store', '/vendor/dashboard', '/delivery/dashboard', '/wishlist', '/cart'];
    routes.forEach(route => router.prefetch(route));
  }, [router]);
  
  const mainItems = [
    { label: 'Wishlist', icon: Heart, path: '/wishlist' },
    { label: 'Active Cart', icon: ShoppingCart, path: '/cart' },
    { label: 'Personal Information', icon: User, path: '' },
    { label: 'Delivery Addresses', icon: MapPin, path: '' },
  ];

  const dashboardItems = [
    { label: 'Join as Beauty & Cosmetics', icon: Sparkles, path: '/Beauty/store', description: 'Sell luxury skincare & makeup', highlight: true, accent: 'rose' },
    { label: 'Join as Medical Store', icon: HeartPulse, path: '/Medical/store', description: 'Sell healthcare products & medicine', highlight: true, accent: 'teal' },
    { label: 'Vendor Dashboard', icon: Store, path: '/vendor/dashboard', description: 'Manage your store and products' },
    { label: 'Delivery Dashboard', icon: Bike, path: '/delivery/dashboard', description: 'View and accept delivery tasks' },
  ];

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
          const userRef = doc(firestore, 'users', user.uid);
          await setDoc(userRef, { 
            profileImageUrl: compressed,
            updatedAt: serverTimestamp()
          }, { merge: true });
          toast({ title: "Profile Updated", description: "Image changed successfully." });
        }
      } catch (err) {
        console.error("Upload Failed");
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
      console.error("Ticket error:", err);
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
    <div className="min-h-screen bg-[#F9FAFB] pb-32 page-enter">
      <div className="bg-primary h-56 relative flex flex-col items-center justify-center pt-8">
        <div className="absolute bottom-0 w-full h-16 bg-[#F9FAFB] rounded-t-[3rem]" />
        
        <div 
          className="relative group cursor-pointer active:scale-95 transition-none"
          onPointerDown={() => fileInputRef.current?.click()}
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
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
        </div>
      </div>

      <div className="px-4 text-center mt-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
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
        <button 
          onPointerDown={handleShareApp}
          className="w-full bg-[#0B0B0B] rounded-[2rem] p-6 flex items-center justify-between text-white shadow-xl shadow-gray-200 relative overflow-hidden group active:scale-[0.97] transition-none"
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
          <ChevronRight className="h-5 w-5 text-gray-600 relative z-10" />
        </button>

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Personal Settings</h3>
          {mainItems.map((item) => (
            <button 
              key={item.label}
              onPointerDown={() => handleAction(item.path, item.label)}
              className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-border/40 shadow-sm active:scale-[0.98] transition-none"
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

        {pages && pages.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Information & Legal</h3>
            {pages.map((page: any) => {
              const Icon = getPageIcon(page.title);
              return (
                <button 
                  key={page.id}
                  onPointerDown={() => handleAction(`/pages/view?id=${page.id}`, page.title)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center justify-between border border-border/40 shadow-sm active:scale-[0.98] transition-none"
                >
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-50/50 p-2.5 rounded-xl text-blue-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold italic uppercase tracking-tight">{page.title}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-primary ml-2">Business & Portals</h3>
          {dashboardItems.map((item) => (
            <button 
              key={item.label}
              onPointerDown={() => handleAction(item.path, item.label)}
              className={cn(
                "w-full rounded-2xl p-4 flex items-center justify-between border shadow-sm active:scale-[0.97] transition-none group",
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
                  <span className="text-[10px] text-muted-foreground font-medium">{item.description}</span>
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

        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Assistance Center</h3>
          <div className="bg-white rounded-[2rem] border border-border/40 shadow-sm overflow-hidden p-2 space-y-2">
             <button 
              onPointerDown={() => setIsSupportExpanded(!isSupportExpanded)}
              className="w-full bg-primary/5 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-none"
             >
                <div className="flex items-center gap-4">
                   <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><Headphones className="h-5 w-5" /></div>
                   <div className="text-left">
                      <span className="text-sm font-black italic uppercase leading-none block">Need Support?</span>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Connect with our team</span>
                   </div>
                </div>
                {isSupportExpanded ? <ChevronUp className="h-4 w-4 text-primary" /> : <ChevronDown className="h-4 w-4 text-primary" />}
             </button>

             <div className={cn(
               "space-y-2 pt-1 overflow-hidden transition-all",
               isSupportExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
             )}>
                  <button 
                    onPointerDown={() => window.open('mailto:ceo@shopykart.co.in')}
                    className="w-full bg-blue-50/50 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-none border border-blue-100/50"
                  >
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600"><Mail className="h-5 w-5" /></div>
                        <div className="text-left">
                            <span className="text-sm font-bold block leading-none">Email Now</span>
                            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Get response from CEO</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-blue-200" />
                  </button>

                  <button 
                    onPointerDown={() => window.open('https://wa.me/919450355709')}
                    className="w-full bg-green-50/50 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-none border border-green-100/50"
                  >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-100 p-2.5 rounded-xl text-green-600"><MessageCircle className="h-5 w-5" /></div>
                        <div className="text-left">
                            <span className="text-sm font-bold block leading-none">WhatsApp Now</span>
                            <span className="text-[9px] font-black text-green-400 uppercase tracking-widest">Fastest Support</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-green-200" />
                  </button>

                  <Dialog open={isTicketOpen} onOpenChange={(val) => { setIsTicketOpen(val); if(!val) setTicketState('form'); }}>
                      <DialogTrigger asChild>
                        <button className="w-full bg-amber-50/50 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-none border border-amber-100/50">
                            <div className="flex items-center gap-4">
                              <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600"><LifeBuoy className="h-5 w-5" /></div>
                              <div className="text-left">
                                  <span className="text-sm font-bold block leading-none">Raise a Ticket</span>
                                  <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Official Complaint</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-amber-200" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
                        {ticketState === 'form' ? (
                          <div className="p-8 space-y-6">
                              <div className="flex flex-col items-center text-center space-y-2">
                                <div className="bg-amber-50 h-16 w-16 rounded-[1.5rem] flex items-center justify-center text-amber-600 border border-amber-100 animate-in zoom-in duration-500">
                                    <LifeBuoy className="h-8 w-8" />
                                </div>
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Support Request</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compulsory Information Required</DialogDescription>
                              </div>

                              <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Describe your issue *</label>
                                    <Textarea 
                                      placeholder="E.g. My order #12345 was missing an item..." 
                                      value={ticketData.description}
                                      onChange={e => setTicketData({...ticketData, description: e.target.value})}
                                      className="h-32 rounded-2xl bg-gray-50 border-none font-medium focus-visible:ring-1 focus-visible:ring-amber-500/20"
                                      required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Callback Phone Number *</label>
                                    <div className="relative">
                                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <Input 
                                          type="tel"
                                          placeholder="10 Digit Number" 
                                          value={ticketData.phone}
                                          onChange={e => setTicketData({...ticketData, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})}
                                          className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold"
                                          required
                                      />
                                    </div>
                                </div>
                              </div>

                              <Button 
                                onClick={handleRaiseTicket}
                                disabled={isRaising || !ticketData.description.trim() || ticketData.phone.length !== 10}
                                className="w-full h-16 bg-[#0B0B0B] hover:bg-amber-600 text-white rounded-3xl font-black uppercase italic shadow-xl active:scale-95 transition-none"
                              >
                                {isRaising ? <Loader2 className="h-6 w-6 animate-spin" /> : "RAISE A TICKET"}
                              </Button>
                          </div>
                        ) : (
                          <div className="p-10 text-center space-y-6 animate-in zoom-in duration-700">
                              <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                                <div className="relative bg-green-500 h-24 w-24 rounded-full flex items-center justify-center shadow-xl shadow-green-200">
                                    <CheckCircle2 className="h-14 w-14 text-white" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h2 className="text-2xl font-black italic uppercase text-gray-800 leading-tight">Ticket Raised!</h2>
                                <p className="text-sm font-bold text-green-600 uppercase tracking-tighter">Request ID: #{Math.floor(1000 + Math.random() * 9000)}</p>
                              </div>
                              <Button 
                                onPointerDown={() => setIsTicketOpen(false)}
                                className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic"
                              >
                                OKAY, GOT IT
                              </Button>
                          </div>
                        )}
                      </DialogContent>
                  </Dialog>
               </div>
          </div>
        </div>

        <button 
          onPointerDown={handleSignOut}
          className="w-full bg-white rounded-2xl p-4 flex items-center space-x-4 text-red-500 border border-red-50 active:scale-95 transition-none mt-6"
        >
          <div className="bg-red-50 p-2.5 rounded-xl">
            <LogOut className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
