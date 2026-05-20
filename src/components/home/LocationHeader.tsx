
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

const SEARCH_SUGGESTIONS = ["pizza", "milk", "burger", "chips", "pasta"];

const TypewriterPlaceholder = memo(() => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const handleTyping = () => {
      const fullText = SEARCH_SUGGESTIONS[suggestionIndex];
      
      if (!isDeleting) {
        setDisplayText(fullText.substring(0, displayText.length + 1));
        setTypingSpeed(150);
        
        if (displayText === fullText) {
          setTypingSpeed(2000); 
          setIsDeleting(true);
        }
      } else {
        setDisplayText(fullText.substring(0, displayText.length - 1));
        setTypingSpeed(75);
        
        if (displayText === '') {
          setIsDeleting(false);
          setSuggestionIndex((prev) => (prev + 1) % SEARCH_SUGGESTIONS.length);
          setTypingSpeed(200);
        }
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, suggestionIndex, typingSpeed]);

  return <span>Search &quot;{displayText}&quot;</span>;
});

TypewriterPlaceholder.displayName = 'TypewriterPlaceholder';

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
    <div className="w-full will-change-transform">
      <div className="bg-[#0B0B0B] px-4 pt-2 pb-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 max-w-[75%]">
          <MapPin className="h-3 w-3 text-primary shrink-0" />
          <div className="flex flex-row items-center gap-1.5 truncate">
            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-none shrink-0">Deliver to</span>
            <span className="text-white text-[10px] font-bold truncate tracking-tight">{currentAddress}</span>
          </div>
        </div>
        <button onClick={handleChangeLocation} className="text-primary text-[9px] font-black uppercase tracking-widest px-1 py-1">Change</button>
      </div>

      <div className="bg-[#0B0B0B] px-3 pt-2 pb-5 flex flex-col gap-3 border-b border-white/5 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <Logo className="scale-90 origin-left" />

          <div className="flex items-center gap-1.5">
            <Link href="/wishlist"><div className="h-8 w-8 rounded-lg bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><Heart className="h-4.5 w-4.5" /></div></Link>

            <Link href="/cart">
              <div className="relative">
                <div className="h-8 w-8 rounded-lg bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all"><ShoppingBag className="h-4.5 w-4.5" /></div>
                {totalItems > 0 && <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-primary rounded-full flex items-center justify-center border border-[#0B0B0B]"><span className="text-[8px] font-black text-white">{totalItems}</span></div>}
              </div>
            </Link>

            <Sheet>
              <SheetTrigger asChild><button className="h-8 w-8 rounded-lg bg-[#1A1A1A] flex items-center justify-center border border-white/5 active:scale-90 transition-all"><Menu className="h-4.5 w-4.5 text-white" /></button></SheetTrigger>
              <SheetContent side="left" className="bg-[#0B0B0B] border-white/5 p-0 text-white rounded-r-[2rem]">
                <SheetHeader className="p-8 border-b border-white/5">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <Logo className="justify-start bg-transparent shadow-none px-0" />
                </SheetHeader>
                <div className="p-6 space-y-2">
                  {[{label:'My Profile',icon:User,href:'/profile'},{label:'My Orders',icon:Package,href:'/orders'},{label:'Rewards',icon:Gift,href:'/rewards'},{label:'Wishlist',icon:Heart,href:'/wishlist'}].map((item) => (
                    <Link key={item.label} href={item.href}><button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors"><div className="flex items-center gap-4"><div className="bg-white/5 p-3 rounded-xl"><item.icon className="h-5 w-5 text-primary" /></div><span className="font-bold text-sm">{item.label}</span></div><ChevronRight className="h-4 w-4 text-gray-600" /></button></Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="px-1 -mb-9 relative z-20 flex gap-2">
          <div className="relative group flex-1">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <div className="absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm font-medium z-10">
              {!searchValue && <TypewriterPlaceholder />}
            </div>
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder=""
              className="h-12 bg-white border-none rounded-xl pl-14 pr-24 text-base text-foreground shadow-xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 bg-white/50 backdrop-blur-sm rounded-lg p-0.5">
              <button onClick={handleMicClick} className={`p-1.5 rounded-lg transition-all active:scale-90 ${isListening ? 'bg-primary text-white' : 'text-gray-400'}`}><Mic className="h-4 w-4" /></button>
              <button onClick={handleCameraClick} disabled={isIdentifying} className="p-1.5 text-gray-400 hover:text-primary rounded-lg transition-all active:scale-90">{isIdentifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}</button>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
          </div>

          <button 
            onClick={() => onModeChange(activeMode === 'Food' ? 'Grocery' : 'Food')}
            className={cn(
              "h-12 w-14 rounded-xl flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 shrink-0 border-2",
              activeMode === 'Food' ? "bg-white border-primary/20 text-primary" : "bg-green-600 border-green-500 text-white"
            )}
          >
            {activeMode === 'Food' ? <Utensils className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
            <span className="text-[7px] font-black uppercase mt-0.5 leading-none">
              {activeMode === 'Food' ? 'Food' : 'Grocery'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
