'use client';

import {
  Search,
  ShoppingCart,
  Menu,
  Heart,
  Camera,
  Mic,
  Loader2,
  PlusCircle,
} from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useCart } from '@/components/cart/CartProvider';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { identifyFood } from '@/ai/flows/visual-search-flow';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type LocationHeaderProps = {
  searchValue: string;
  onSearchChange: (val: string) => void;
};

export function LocationHeader({
  searchValue,
  onSearchChange,
}: LocationHeaderProps) {
  const { totalItems, addCustomRequest } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [customReqOpen, setCustomReqOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const { toast } = useToast();

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
        toast({
          title: 'Visual Search Successful',
          description: `Searching for: ${result.identifiedFood}`,
        });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Search Failed',
          description: 'Could not identify the food from the photo.',
        });
      } finally {
        setIsIdentifying(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleMicClick = () => {
    if (
      !('webkitSpeechRecognition' in window) &&
      !('SpeechRecognition' in window)
    ) {
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Your browser does not support voice search.',
      });
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast({
        title: 'Listening...',
        description: "Go ahead, tell me what you're looking for.",
      });
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      onSearchChange(speechToText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleCustomSubmit = () => {
    if (!customText.trim()) return;
    addCustomRequest(customText);
    setCustomText('');
    setCustomReqOpen(false);
    toast({
      title: 'Request Sent',
      description:
        'Custom Veg dish added to your cart with ₹20 delivery charge.',
    });
  };

  return (
    <div className="bg-[#0B0B0B] px-4 py-4 flex flex-col gap-4 sticky top-0 z-50 shadow-2xl">
      <div className="flex items-center justify-between gap-3">
        {/* Logo Section */}
        <Logo className="flex-shrink-0" />

        {/* Action Buttons Row (Top) */}
        <div className="flex items-center gap-2">
          {/* Custom Request Trigger */}
          <Dialog open={customReqOpen} onOpenChange={setCustomReqOpen}>
            <DialogTrigger asChild>
              <button className="h-10 w-10 rounded-xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-primary active:scale-90 transition-all">
                <PlusCircle className="h-5 w-5" />
              </button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] max-w-sm">
              <DialogHeader>
                <DialogTitle className="font-black italic uppercase text-xl tracking-tighter text-center">
                  Custom Veg Dish
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-xs text-muted-foreground font-bold text-center uppercase tracking-widest">
                  Can't find it? Tell us what you want!
                </p>
                <Textarea
                  placeholder="E.g. Paneer Tikka Masala..."
                  className="rounded-2xl h-24 bg-muted/30 border-none focus-visible:ring-primary/20"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                />
                <p className="text-[10px] text-primary font-black uppercase text-center tracking-widest">
                  Note: ₹20 Delivery charge applies
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCustomSubmit}
                  className="w-full h-12 rounded-xl bg-primary font-black uppercase italic tracking-tighter"
                >
                  ADD TO CART
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Wishlist Button */}
          <Link href="/wishlist">
            <div className="h-10 w-10 rounded-xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all">
              <Heart className="h-5 w-5" />
            </div>
          </Link>

          {/* Cart Button */}
          <Link href="/cart">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-[#1A1A1A] border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all">
                <ShoppingCart className="h-5 w-5" />
              </div>
              {totalItems > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-primary rounded-full flex items-center justify-center border-2 border-[#0B0B0B] animate-in zoom-in">
                  <span className="text-[10px] font-black text-primary-foreground">
                    {totalItems}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Menu Button */}
          <div className="h-10 w-10 rounded-xl bg-[#1A1A1A] flex items-center justify-center border border-white/5 active:scale-90 transition-all">
            <Menu className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>

      {/* Integrated Search Bar Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search favorites..."
            className="h-12 bg-[#1A1A1A] border-none rounded-2xl pl-11 pr-20 text-sm text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-all"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              onClick={handleMicClick}
              className={`p-2 rounded-xl transition-all active:scale-90 ${
                isListening
                  ? 'bg-primary text-primary-foreground animate-pulse'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              onClick={handleCameraClick}
              disabled={isIdentifying}
              className="p-2 text-gray-400 hover:text-white rounded-xl transition-all active:scale-90 disabled:opacity-50"
            >
              {isIdentifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
}
