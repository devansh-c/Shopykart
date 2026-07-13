
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { ChevronLeft, Minus, Plus, Star, Share2, Loader2, CheckCircle2, ShieldCheck, Calendar, AlertCircle, FileText, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';

export default function ProductDetailsClient({ forcedId }: { forcedId?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart } = useCart();
  
  // Use forcedId (from dynamic route) or search param 'id'
  const productId = forcedId || searchParams.get('id');
  
  const [instructions, setInstructions] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | null>(null);

  const firestore = useFirestore();
  const productRef = useMemoFirebase(() => {
    if (!firestore || !productId || productId === 'view' || productId === 'featured' || productId === 'latest' || productId === 'trending') return null;
    return doc(firestore, 'products', productId);
  }, [firestore, productId]);

  const { data: product, loading } = useDoc<any>(productRef);
  
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  // Global Offer Hook
  const offerRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global_offer');
  }, [firestore]);
  const { data: globalOffer } = useDoc<any>(offerRef);

  const vendor = vendors?.find(v => v.id === product?.vendorId);
  const isOffline = (vendor?.isOnline === false) || (product?.isAvailable === false);

  const isMedical = useMemo(() => {
    return product?.serviceMode === 'Medical' || product?.category?.toLowerCase().includes('medic') || product?.isSilentPackaging !== undefined;
  }, [product]);

  const isSaleActive = globalOffer?.isActive;
  const isClosedMode = isSaleActive && globalOffer?.isClosedAfterMilestone === true;

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.price || 0;
    const optPrice = selectedOption ? selectedOption.price : 0;
    const totalBase = base + optPrice;

    // Milestone Check: Strictly return original price if mode is ON
    if (isClosedMode) {
      return totalBase;
    }

    // Apply discount only if sale is active AND it's NOT in milestone mode
    if (isSaleActive) {
      const val = Number(globalOffer.value) || 0;
      if (globalOffer.type === 'percentage') return totalBase * (1 - val / 100);
      return Math.max(0, totalBase - val);
    }

    return totalBase;
  }, [product, selectedOption, isSaleActive, isClosedMode, globalOffer]);

  const totalPrice = useMemo(() => {
    return currentPrice * localQuantity;
  }, [currentPrice, localQuantity]);

  const handleAddToCart = () => {
    if (!product || isOffline) return;

    if (product.isVarietyRequired && !selectedOption && product.options?.length > 0) {
      toast({ 
        variant: "destructive", 
        title: "Selection Required", 
        description: "Please select a variety first." 
      });
      return;
    }

    const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/800/600`;
    
    addToCart({ 
      ...product, 
      imageUrl, 
      quantity: localQuantity,
      selectedOption: selectedOption,
      price: currentPrice,
      instructions: isMedical ? '' : instructions
    });
    
    toast({ title: "Added to Cart", description: `${product.name} added successfully.` });
  };

  const handleShare = async () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: `Check out this delicious ${product.name} on ShopyKart!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied", description: "Product link copied." });
      } catch (err) {
        toast({ variant: "destructive", title: "Failed to Copy" });
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const handleSubmitReview = () => {
    if (userRating === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select a rating." });
      return;
    }
    setHasSubmitted(true);
    setIsEditing(false);
    toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
  };

  if (!productId || productId === 'view' || productId === 'featured' || productId === 'latest' || productId === 'trending') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black italic uppercase">Select a Product</h2>
        <p className="text-muted-foreground text-xs mt-2">Browse our menu to find your favorites.</p>
        <button onClick={() => router.push('/menu')} className="mt-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs">Explore Menu</button>
      </div>
    );
  }

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black italic uppercase">Product Not Found</h2>
        <p className="text-muted-foreground text-xs mt-2">The item you are looking for might have been removed.</p>
        <button onClick={() => router.push('/menu')} className="mt-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs">Explore Menu</button>
      </div>
    );
  }

  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/800/600`;
  const hasOptions = product.options && product.options.length > 0;

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-border/50">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-black uppercase italic tracking-tight">Item Details</h1>
        <button 
          onClick={handleShare} 
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground active:scale-90"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      <div className={cn("relative w-full aspect-[4/3] bg-muted", isOffline && "grayscale")}>
        <Image 
          src={imageUrl} 
          alt={product.name} 
          fill 
          className="object-cover"
          priority
        />
        {isOffline && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
             <span className="bg-white text-black px-6 py-2 rounded-2xl font-black uppercase italic text-lg shadow-2xl">Currently Offline</span>
          </div>
        )}
      </div>

      <div className="relative z-10 -mt-8 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </div>

        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-foreground leading-tight">{product.name}</h2>
            {isSaleActive && <Zap className="h-5 w-5 text-primary fill-primary animate-pulse" />}
          </div>
          {product.isVeg && (
            <div className="h-6 w-6 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mt-1">
              <div className="h-full w-full bg-green-600 rounded-full" />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-3 mb-4">
           <div className="text-3xl font-black text-gray-900 italic">₹{(currentPrice || 0).toFixed(2)}</div>
           {(isSaleActive || product.mrp > currentPrice) && (
             <div className="text-sm font-bold text-gray-400 line-through">MRP ₹{product.mrp || product.price}</div>
           )}
        </div>

        {isClosedMode && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-4">
               <div className="bg-red-500 p-2 rounded-xl text-white shadow-lg"><AlertCircle className="h-5 w-5" /></div>
               <div>
                  <p className="text-[11px] font-black text-red-600 uppercase tracking-tighter">SALE IS CLOSED</p>
                  <p className="text-xs font-bold text-red-400 uppercase leading-relaxed mt-1">Our first 10 orders have been completed, so sale is closed. Standard pricing now applies.</p>
               </div>
            </div>
          </div>
        )}

        {product.description && (
          <div className="mb-6 p-4 bg-muted/20 rounded-2xl border border-border/40">
             <div className="flex items-center gap-2 mb-2 text-primary">
                <FileText className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Description</span>
             </div>
             <p className="text-sm font-medium text-muted-foreground leading-relaxed">
               {product.description}
             </p>
          </div>
        )}

        <div className="space-y-4 mb-8">
           {product.isSilentPackaging && (
              <div className="bg-teal-50 p-6 rounded-[2rem] border-2 border-dashed border-teal-200 flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95 duration-500">
                <ShieldCheck className="h-10 w-10 text-teal-600" />
                <div className="space-y-1">
                  <h4 className="font-black text-lg italic uppercase tracking-tight text-teal-900 leading-none">Silent Packaging Enabled</h4>
                  <p className="text-[10px] font-bold text-teal-700 uppercase tracking-widest leading-relaxed px-4">
                    Your order will be delivered in discreet, unmarked packaging for your 100% privacy.
                  </p>
                </div>
              </div>
           )}

           {(product.mfgDate || product.expiryDate) && (
              <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-4">
                 <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Manufacturing & Expiry</span>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    {product.mfgDate && (
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-gray-400 uppercase">MFG Date</span>
                          <div className="flex items-center gap-2">
                             <Calendar className="h-3.5 w-3.5 text-gray-400" />
                             <span className="text-xs font-bold text-gray-700">{product.mfgDate}</span>
                          </div>
                       </div>
                    )}
                    {product.expiryDate && (
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-red-400 uppercase">Expiry Date</span>
                          <div className="flex items-center gap-2">
                             <Calendar className="h-3.5 w-3.5 text-red-400" />
                             <span className="text-xs font-bold text-red-500">{product.expiryDate}</span>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
           )}
        </div>

        {hasOptions ? (
          <div className="space-y-4 mb-8">
            <h3 className="text-base font-black text-foreground uppercase tracking-tight flex items-center justify-between">
              Choose Variation
              {product.isVarietyRequired ? (
                <span className="text-[8px] font-black uppercase text-white bg-primary px-2 py-0.5 rounded-full animate-pulse">Required</span>
              ) : (
                <span className="text-[9px] font-bold text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded-full">Optional</span>
              )}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {product.options.map((opt: any, i: number) => (
                <button 
                  key={i}
                  disabled={isOffline}
                  onClick={() => setSelectedOption(selectedOption?.name === opt.name ? null : opt)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                    selectedOption?.name === opt.name 
                      ? "border-primary bg-primary/5 shadow-inner" 
                      : "border-gray-100 bg-gray-50",
                    isOffline && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3">
                     <div className={cn(
                       "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                       selectedOption?.name === opt.name ? "border-primary bg-primary" : "border-gray-300"
                     )}>
                       {selectedOption?.name === opt.name && <CheckCircle2 className="h-3 w-3 text-white" />}
                     </div>
                     <span className="text-sm font-black uppercase italic text-gray-700 tracking-tight">{opt.name}</span>
                  </div>
                  <span className="text-sm font-black text-primary">
                    {opt.price > 0 ? `+ ₹${opt.price}` : 'FREE'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          !isMedical && (
            <div className="space-y-4 mb-8">
              <h3 className="text-base font-black text-foreground uppercase tracking-tight">Special instructions</h3>
              <Textarea 
                disabled={isOffline}
                placeholder="E.g. no onions, extra sauce..." 
                className="rounded-2xl bg-muted/30 border-muted h-24 focus-visible:ring-primary/20"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          )
        )}

        <div className="space-y-6 mb-12 border-t pt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">
              {hasSubmitted && !isEditing ? "Your Review" : "Give Rating"}
            </h3>
            {hasSubmitted && !isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-primary"
                onClick={() => setIsEditing(true)}
              >
                EDIT REVIEW
              </Button>
            )}
          </div>

          {( !hasSubmitted || isEditing ) ? (
            <div className="space-y-4 bg-muted/20 p-5 rounded-3xl border border-border/40">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setUserRating(star)}
                    className="focus:outline-none transition-transform active:scale-90"
                  >
                    <Star 
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= userRating ? "fill-primary text-primary" : "text-gray-300"
                      )} 
                    />
                  </button>
                ))}
              </div>
              <Textarea 
                placeholder="Share your experience..." 
                className="rounded-2xl bg-white border-muted h-24 focus-visible:ring-primary/20"
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
              />
              <Button 
                onClick={handleSubmitReview}
                className="w-full bg-primary font-black uppercase italic rounded-xl h-12"
              >
                {isEditing ? "UPDATE REVIEW" : "SUBMIT RATING"}
              </Button>
            </div>
          ) : (
            <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={cn(
                      "h-4 w-4",
                      star <= userRating ? "fill-primary text-primary" : "text-gray-200"
                    )} 
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-foreground italic">"{userReview || 'No comment provided.'}"</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[11000] bg-white border-t border-border/50 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <div className={cn("flex items-center bg-muted/50 rounded-2xl h-14 px-2", isOffline && "opacity-50")}>
            <button 
              disabled={isOffline}
              onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-lg font-black">{localQuantity}</span>
            <button 
              disabled={isOffline}
              onClick={() => setLocalQuantity(localQuantity + 1)}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button 
            disabled={isOffline}
            onClick={handleAddToCart}
            className={cn(
              "flex-1 h-14 rounded-2xl font-black uppercase italic tracking-tighter shadow-lg transition-all",
              isOffline ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed" : "bg-primary text-white shadow-primary/20 active:scale-95"
            )}
          >
            {isOffline ? 'ITEM UNAVAILABLE' : `Add to Cart • ₹${totalPrice.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
