'use client';

import {
  Search,
  ShoppingBag,
  Menu,
  Heart,
  Camera,
  Mic,
  Loader2,
  User,
  Package,
  Gift,
  ChevronRight,
  MapPin,
  Utensils,
  Zap,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useCart } from '@/components/cart/CartProvider';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRef, useState, useEffect } from 'react';
import { identifyFood } from '@/ai/flows/visual-search-flow';
import { useToast } from '@/hooks/use-toast';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

type LocationHeaderProps = {
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeMode: string;
  onModeChange: (mode: string) => void;
};

export function LocationHeader({
  searchValue,
  onSearchChange,
  activeMode,
  onModeChange,
}: LocationHeaderProps) {
  const { totalItems } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('Select Location');

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const updateAddress = () => {
      const savedAddress = localStorage.getItem('user_address');
      if (savedAddress) {
        const parts = savedAddress.split(',');
        setCurrentAddress(parts[0].trim() || savedAddress);
      } else {
        setCurrentAddress('Select Location');
      }
    };

    updateAddress();
    window.addEventListener('user-address-updated', updateAddress);
    return () => window.removeEventListener('user-address-updated', updateAddress);
  }, []);

  const handleChangeLocation = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIdentifying(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const result = await identifyFood({ photoDataUri: base64String });
        onSearchChange(result.identifiedFood);
        toast({ title: 'Success', description: `Identified: ${result.identifiedFood}` });
      } catch (err) {
        toast({ variant: 'destructive', title: 'Failed', description: 'Could not identify food.' });
      } finally {
        setIsIdentifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({ variant: 'destructive', title: 'Not Supported' });
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => onSearchChange(event.results[0][0].transcript);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    }
  };

  return (
    <div className="w-full will-change-transform bg-white border-b border-gray-100">
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-1.5 max-w-[75%]">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Deliver to</span>
            <span className="text-foreground text-xs font-bold truncate tracking-tight">{currentAddress}</span>
          </div>
        </div>
        <button onClick={handleChangeLocation} className="text-primary text-[10px] font-black uppercase tracking-widest">Change</button>
      </div>

      <div className="px-3 pt-2 pb-4 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Logo className="scale-90 origin-left" />

          <div className="flex items-center gap-2">
            <Link href="/wishlist">
              <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-foreground active:scale-90 transition-all">
                <Heart className="h-5 w-5" />
              </div>
            </Link>

            <Link href="/cart">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary active:scale-90 transition-all">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                {totalItems > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                    <span className="text-[10px] font-black text-white">{totalItems}</span>
                  </div>
                )}
              </div>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <button className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center text-foreground active:scale-90 transition-all">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-[#0B0B0B] border-white/5 p-0 text-white rounded-r-[2rem]">
                <SheetHeader className="p-8 border-b border-white/5">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <Logo className="justify-start bg-transparent shadow-none px-0" />
                </SheetHeader>
                <div className="p-6 space-y-2">
                  {[
                    { label: 'My Profile', icon: User, href: '/profile' },
                    { label: 'My Orders', icon: Package, href: '/orders' },
                    { label: 'Rewards', icon: Gift, href: '/rewards' },
                    { label: 'Wishlist', icon: Heart, href: '/wishlist' }
                  ].map((item) => (
                    <Link key={item.label} href={item.href}>
                      <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-white/5 p-3 rounded-xl">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-bold text-sm">{item.label}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-600" />
                      </button>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder='Search "Pizza, Sweets, Burgers..."'
            className="h-14 bg-muted/30 border-none rounded-2xl pl-12 pr-24 text-base text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button onClick={handleMicClick} className={cn("p-2 rounded-xl transition-all active:scale-90", isListening ? "bg-primary text-white" : "text-primary")}>
              <Mic className="h-5 w-5" />
            </button>
            <button onClick={handleCameraClick} className="p-2 text-primary rounded-xl active:scale-90 transition-all">
              {isIdentifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['Food', 'Grocery'].map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 flex items-center gap-2",
                activeMode === mode ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted/50 text-muted-foreground"
              )}
            >
              {mode === 'Food' ? <Utensils className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
              {mode}
            </button>
          ))}
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100">
             <div className="h-1.5 w-1.5 bg-green-600 rounded-full animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-tight">Pure Veg</span>
          </button>
        </div>
      </div>
    </div>
  );
}
