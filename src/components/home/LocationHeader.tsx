
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
  Sparkles,
  ChevronDown
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
import { CustomDishDialog } from './CustomDishDialog';

type LocationHeaderProps = {
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeMode: string;
  onModeChange: (mode: string) => void;
};

const SEARCH_WORDS = ["Pizza", "Burgers", "Sweets", "Pasta", "Biryani", "Shakes"];

const SearchPlaceholder = memo(() => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % SEARCH_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute left-10 top-0 bottom-0 flex items-center pointer-events-none overflow-hidden h-full">
      <span className="text-gray-500 text-[10px] font-bold mr-1">Search</span>
      <span 
        key={wordIndex}
        className="text-primary text-[10px] font-black italic animate-placeholder-slide"
      >
        {SEARCH_WORDS[wordIndex]}
      </span>
    </div>
  );
});

SearchPlaceholder.displayName = 'SearchPlaceholder';

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
  const [currentAddress, setCurrentAddress] = useState('Detecting Location...');
  const [addressSubtitle, setAddressSubtitle] = useState('');

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const updateAddress = () => {
      const savedAddress = localStorage.getItem('user_address');
      const savedFullAddress = localStorage.getItem('user_full_precise_address');
      const savedCity = localStorage.getItem('user_city');
      
      if (savedAddress) {
        setCurrentAddress(savedAddress);
        if (savedFullAddress) {
          const details = savedFullAddress.split(',').slice(1, 4).join(',').trim();
          setAddressSubtitle(details);
        } else {
          setAddressSubtitle(savedCity || 'Select your spot');
        }
      } else {
        setCurrentAddress('Select Location');
        setAddressSubtitle('Tap to detect your current spot');
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
        toast({ variant: 'destructive', title: 'Voice search not supported in this browser.' });
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
    <div className="w-full bg-[#0B0B0B] pb-4 pt-2 px-4 space-y-3 rounded-b-[2.5rem] shadow-2xl relative z-50 will-change-contents">
      <div className="flex items-center justify-between">
        <div onClick={handleChangeLocation} className="flex items-center gap-2 cursor-pointer max-w-[65%] group">
          <div className="h-9 w-9 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20 group-active:scale-90 transition-transform">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-white text-[13px] font-black truncate tracking-tight">{currentAddress}</span>
              <ChevronDown className="h-3.5 w-3.5 text-primary shrink-0 transition-transform group-hover:translate-y-0.5" />
            </div>
            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest truncate leading-none mt-0.5">
              {addressSubtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CustomDishDialog>
            <button className="h-9 px-2.5 rounded-lg bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/30 flex items-center gap-1.5 text-amber-500 active:scale-90 transition-all group">
              <div className="relative">
                <Utensils className="h-3.5 w-3.5" />
                <Sparkles className="absolute -top-1 -right-1 h-2 w-2 animate-pulse" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest hidden xs:block">CONCIERGE</span>
            </button>
          </CustomDishDialog>

          <Link href="/cart">
            <div className="relative">
              <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all">
                <ShoppingBag className="h-4 w-4" />
              </div>
              {totalItems > 0 && (
                <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-primary rounded-full flex items-center justify-center border-2 border-[#0B0B0B]">
                  <span className="text-[7px] font-black text-white">{totalItems}</span>
                </div>
              )}
            </div>
          </Link>
        </div>
      </div>

      <div className="flex justify-center py-1">
        <Logo className="scale-100" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <div className="relative h-11 w-full bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary/50 transition-all">
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-full w-full bg-transparent border-none pl-10 pr-20 text-white font-bold placeholder:text-transparent focus-visible:ring-0 text-xs"
            />
            {!searchValue && <SearchPlaceholder />}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
               <button onClick={handleCameraClick} className="p-1.5 text-primary active:scale-90 transition-all">
                {isIdentifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <button onClick={handleMicClick} className={cn("p-1.5 text-primary active:scale-90 transition-all", isListening && "animate-pulse text-red-500")}>
                <Mic className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
        </div>

        <div 
          onClick={() => onModeChange(activeMode === 'Food' ? 'Grocery' : 'Food')}
          className="h-10 w-20 rounded-full p-[2px] cursor-pointer flex-shrink-0 relative active:scale-95 transition-transform duration-150"
          style={{
            background: 'linear-gradient(180deg, #E0E0E0 0%, #707070 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
          }}
        >
           <div className="w-full h-full bg-[#121212] rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.9)] flex items-center relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-between px-2">
                 <span className={cn(
                   "text-[6px] font-black transition-opacity duration-300 select-none",
                   activeMode === 'Food' ? "text-white opacity-0" : "text-white opacity-30"
                 )}>FOOD</span>
                 <span className={cn(
                   "text-[6px] font-black transition-opacity duration-300 select-none",
                   activeMode === 'Grocery' ? "text-white opacity-0" : "text-white opacity-30"
                 )}>GROC</span>
              </div>

              <div 
                className={cn(
                  "absolute w-7 h-7 rounded-full transition-all duration-300 ease-out z-10 flex items-center justify-center",
                  activeMode === 'Food' ? "left-1" : "left-[calc(100%-32px)]"
                )}
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #FFFFFF 0%, #D1D1D1 60%, #B0B0B0 100%)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.8)'
                }}
              >
                {activeMode === 'Food' ? <Utensils className="h-2.5 w-2.5 text-gray-800" /> : <ShoppingBag className="h-2.5 w-2.5 text-gray-800" />}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
