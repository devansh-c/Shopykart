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
import { useRef, useState, useEffect, memo } from 'react';
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
import { Switch } from '@/components/ui/switch';

const SEARCH_SUGGESTIONS = ["Pizza", "Sweets", "Burgers", "Pasta", "Cakes", "Biryani"];

const TypewriterPlaceholder = memo(() => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 overflow-hidden h-6">
      <span className="text-gray-400 text-sm font-medium whitespace-nowrap">Search for</span>
      <div className="relative h-full flex flex-col">
        <span key={SEARCH_SUGGESTIONS[index]} className="text-gray-500 text-sm font-bold animate-placeholder-slide">
          {SEARCH_SUGGESTIONS[index]}
        </span>
      </div>
    </div>
  );
});

TypewriterPlaceholder.displayName = 'TypewriterPlaceholder';

const CraveAthonBanner = () => {
  return (
    <div className="w-full flex flex-col items-center py-4 px-2">
      {/* Crave Athon Header */}
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-3xl font-black italic tracking-tighter text-[#FF4D00]">CRAVE</h2>
        <div className="bg-[#FF4D00] p-1 rounded-full border border-white shadow-lg animate-bounce">
          <Utensils className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter text-[#FF4D00]">ATHON</h2>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20" />
        <span className="text-[9px] font-black text-white/60 uppercase tracking-widest italic">FLAT ₹200 OFF & MORE</span>
        <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20" />
      </div>

      {/* Circular Mini Deals */}
      <div className="flex justify-center gap-5 w-full overflow-x-auto no-scrollbar py-2">
        <div className="flex flex-col items-center gap-1 min-w-[70px]">
          <div className="relative h-16 w-16 rounded-full bg-[#FFCC00] border-2 border-white shadow-lg flex items-center justify-center overflow-hidden">
            <img src="https://picsum.photos/seed/99/80/80" className="w-10 h-10 object-cover rounded-full" alt="99" />
          </div>
          <span className="text-[7px] font-black text-[#FFCC00] uppercase tracking-tighter">VALUE DEALS</span>
        </div>
        <div className="flex flex-col items-center gap-1 min-w-[70px]">
          <div className="relative h-16 w-16 rounded-full bg-[#FFCC00] border-2 border-white shadow-lg flex items-center justify-center p-1">
             <div className="w-full h-full bg-[#0055FF] rounded-full flex flex-col items-center justify-center text-white border border-white/30">
                <span className="text-[12px] font-black italic tracking-tighter">50%</span>
                <span className="text-[5px] font-black uppercase">OFF</span>
             </div>
          </div>
          <span className="text-[7px] font-black text-[#FFCC00] uppercase tracking-tighter">DEAL FEAST</span>
        </div>
        <div className="flex flex-col items-center gap-1 min-w-[70px]">
          <div className="relative h-16 w-16 rounded-full bg-[#FFCC00] border-2 border-white shadow-lg flex items-center justify-center overflow-hidden">
            <img src="https://picsum.photos/seed/burger/80/80" className="w-12 h-12 object-cover rounded-full" alt="Binge" />
          </div>
          <span className="text-[7px] font-black text-[#FFCC00] uppercase tracking-tighter">BINGE SAVER</span>
        </div>
      </div>
    </div>
  );
}

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
  const [isVegOnly, setIsVegOnly] = useState(false);

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
    <div className="w-full will-change-transform bg-[#3F0000]">
      <div className="px-4 pt-2 pb-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 max-w-[75%]">
          <MapPin className="h-3 w-3 text-[#FF4D00] shrink-0" />
          <div className="flex flex-row items-center gap-1.5 truncate">
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none shrink-0">Deliver to</span>
            <span className="text-white text-[10px] font-bold truncate tracking-tight">{currentAddress}</span>
          </div>
        </div>
        <button onClick={handleChangeLocation} className="text-[#FF4D00] text-[9px] font-black uppercase tracking-widest px-1 py-1">Change</button>
      </div>

      <div className="px-3 pt-2 pb-2 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Logo className="scale-90 origin-left border-[#FFCC00]/20 bg-black/40" />

          <div className="flex items-center gap-1.5">
            <Link href="/wishlist"><div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><Heart className="h-4.5 w-4.5" /></div></Link>

            <Link href="/cart">
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><ShoppingBag className="h-4.5 w-4.5" /></div>
                {totalItems > 0 && <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#FF4D00] rounded-full flex items-center justify-center border border-[#3F0000]"><span className="text-[8px] font-black text-white">{totalItems}</span></div>}
              </div>
            </Link>

            <Sheet>
              <SheetTrigger asChild><button className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 active:scale-90 transition-all"><Menu className="h-4.5 w-4.5 text-white" /></button></SheetTrigger>
              <SheetContent side="left" className="bg-[#0B0B0B] border-white/5 p-0 text-white rounded-r-[2rem]">
                <SheetHeader className="p-8 border-b border-white/5">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <Logo className="justify-start bg-transparent shadow-none px-0" />
                </SheetHeader>
                <div className="p-6 space-y-2">
                  {[{label:'My Profile',icon:User,href:'/profile'},{label:'My Orders',icon:Package,href:'/orders'},{label:'Rewards',icon:Gift,href:'/rewards'},{label:'Wishlist',icon:Heart,href:'/wishlist'}].map((item) => (
                    <Link key={item.label} href={item.href}><button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors"><div className="flex items-center gap-4"><div className="bg-white/5 p-3 rounded-xl"><item.icon className="h-5 w-5 text-[#FF4D00]" /></div><span className="font-bold text-sm">{item.label}</span></div><ChevronRight className="h-4 w-4 text-gray-600" /></button></Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Crave Athon Banner implemented inside header as requested */}
        <CraveAthonBanner />

        <div className="px-1 pb-4 flex items-center gap-2">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <div className="absolute left-11 top-1/2 -translate-y-1/2 pointer-events-none z-10">
              {!searchValue && <TypewriterPlaceholder />}
            </div>
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder=""
              className="h-14 bg-white border-none rounded-2xl pl-11 pr-14 text-base text-foreground shadow-2xl focus-visible:ring-1 focus-visible:ring-[#FF4D00]/20 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <button onClick={handleMicClick} className={`p-2 rounded-xl transition-all active:scale-90 ${isListening ? 'bg-[#FF4D00] text-white shadow-lg' : 'text-[#FF4D00]'}`}><Mic className="h-4.5 w-4.5" /></button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
          </div>

          {/* Premium Veg Toggle Section */}
          <div className="flex flex-col items-center justify-center bg-white px-2.5 h-14 rounded-2xl shadow-xl min-w-[56px] border-b-2 border-green-600/20">
             <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter leading-none mb-1">VEG</span>
             <Switch 
               checked={isVegOnly} 
               onCheckedChange={setIsVegOnly}
               className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-200 h-5 w-9"
             />
             <div className="h-2 w-2 border border-green-600 rounded-sm flex items-center justify-center p-0.5 mt-1 opacity-60">
                <div className="h-full w-full bg-green-600 rounded-full" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
