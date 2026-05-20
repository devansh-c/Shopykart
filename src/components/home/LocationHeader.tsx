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

const SEARCH_WORDS = ["Pizza", "Burgers", "Sweets", "Pasta", "Biryani", "Shakes"];

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
  const [wordIndex, setWordIndex] = useState(0);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % SEARCH_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

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
    <div className="w-full bg-[#0B0B0B] pb-6 pt-4 px-4 space-y-5 rounded-b-[2.5rem] shadow-2xl relative z-50">
      {/* Top Row: Location & Actions */}
      <div className="flex items-center justify-between">
        <div onClick={handleChangeLocation} className="flex items-center gap-2 cursor-pointer max-w-[65%] group">
          <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20 group-active:scale-90 transition-transform">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Deliver to</span>
            <div className="flex items-center gap-1">
              <span className="text-white text-xs font-black truncate tracking-tight">{currentAddress}</span>
              <ChevronRight className="h-3 w-3 text-primary shrink-0" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cart">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
                <ShoppingBag className="h-5 w-5" />
              </div>
              {totalItems > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center border-2 border-[#0B0B0B] animate-bounce">
                  <span className="text-[10px] font-black text-white">{totalItems}</span>
                </div>
              )}
            </div>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <button className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
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

      {/* Center Branding */}
      <div className="flex justify-center">
        <Logo className="scale-110" />
      </div>

      {/* Bottom Row: Search Bar & Mode Toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
          <div className="relative h-14 w-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden focus-within:border-primary/50 transition-all">
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-full w-full bg-transparent border-none pl-12 pr-12 text-white font-bold placeholder:text-transparent focus-visible:ring-0"
            />
            {!searchValue && (
              <div className="absolute left-12 top-0 bottom-0 flex items-center pointer-events-none overflow-hidden h-full">
                <span className="text-gray-500 text-sm font-bold mr-1">Search</span>
                <span 
                  key={wordIndex}
                  className="text-primary text-sm font-black italic animate-placeholder-slide"
                >
                  {SEARCH_WORDS[wordIndex]}
                </span>
              </div>
            )}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <button onClick={handleCameraClick} className="p-2 text-primary active:scale-90 transition-all">
                {isIdentifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
        </div>

        {/* Mode Toggle Switch */}
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-1 h-14">
          {[
            { id: 'Food', icon: Utensils },
            { id: 'Grocery', icon: ShoppingBag }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={cn(
                "h-full px-4 rounded-xl flex items-center justify-center transition-all relative overflow-hidden",
                activeMode === mode.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20 scale-100" 
                  : "text-gray-500 scale-90 opacity-60"
              )}
            >
              <mode.icon className="h-5 w-5" />
              {activeMode === mode.id && (
                 <div className="absolute -bottom-2 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
