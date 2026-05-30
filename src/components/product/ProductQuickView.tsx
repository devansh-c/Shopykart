
'use client';

import { useState, useMemo } from 'react';
import { 
  X, 
  Star, 
  Heart, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Circle,
  ShoppingBag,
  Sparkles,
  Info
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/cart/CartProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface ProductQuickViewProps {
  product: any;
  children: React.ReactNode;
}

export function ProductQuickView({ product, children }: ProductQuickViewProps) {
  const { cart, addToCart, removeFromCart, isInWishlist, toggleWishlist } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [selectedOption, setSelectedOption] = useState<{ name: string; price: number } | null>(null);
  const [instructions, setInstructions] = useState('');

  const liked = isInWishlist(product.id);
  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`;
  const hasOptions = product.options && product.options.length > 0;

  const currentPrice = useMemo(() => {
    const base = product.price || 0;
    const optPrice = selectedOption ? selectedOption.price : 0;
    return (base + optPrice);
  }, [product, selectedOption]);

  const handleAddToCart = () => {
    addToCart({ 
      ...product, 
      imageUrl, 
      quantity: localQuantity,
      selectedOption: selectedOption,
      instructions: instructions,
      price: currentPrice
    });
    
    setIsOpen(false);
    toast({ 
      title: "Added to Bag", 
      description: `${product.name} has been added.` 
    });
    
    // Reset states for next open
    setLocalQuantity(1);
    setSelectedOption(null);
    setInstructions('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-[92%] sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in-95 duration-200 focus:outline-none">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-white">
          {/* Header Info Section - Screenshot Matching */}
          <div className="p-6 pb-4">
             <div className="flex gap-4">
                <div className="relative h-28 w-28 rounded-2xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm">
                   <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                   {product.isVeg && (
                      <div className="absolute top-1.5 left-1.5 h-4 w-4 border border-green-600 rounded-sm flex items-center justify-center p-0.5 bg-white/90">
                        <div className="h-full w-full bg-green-600 rounded-full" />
                      </div>
                   )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                   <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                         <h3 className="font-black text-xl text-gray-900 leading-none italic uppercase tracking-tighter truncate">{product.name}</h3>
                         <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1.5 italic">{product.restaurantName || 'ShopyKart Select'}</p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                        className={cn("p-2 rounded-xl bg-gray-50 transition-all active:scale-75", liked ? "text-primary" : "text-gray-300")}
                      >
                        <Heart className={cn("h-5 w-5", liked && "fill-primary")} />
                      </button>
                   </div>

                   <div className="space-y-2">
                      <div className="flex items-center gap-1">
                         <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={cn("h-3 w-3", s <= (product.rating || 4) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                            ))}
                         </div>
                         <span className="text-[10px] font-bold text-gray-400 ml-1">({product.reviewsCount || '12'})</span>
                      </div>
                      <div className="text-2xl font-black text-gray-900 italic tracking-tighter">₹ {(currentPrice || 0).toFixed(2)}</div>
                   </div>
                </div>
             </div>
          </div>

          <div className="px-6 py-4 space-y-6">
            {/* CONDITIONAL LOGIC: Options vs Instructions */}
            {hasOptions ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-sm font-black uppercase tracking-widest text-gray-800">Addons</h4>
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>
                </div>
                <div className="space-y-2.5">
                  {product.options.map((opt: any, idx: number) => {
                    const isSelected = selectedOption?.name === opt.name;
                    return (
                      <button 
                        key={idx}
                        onClick={() => setSelectedOption(isSelected ? null : opt)}
                        className={cn(
                          "w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                          isSelected ? "border-primary bg-primary/5 shadow-inner" : "border-gray-50 bg-gray-50/50"
                        )}
                      >
                         <div className="flex items-center gap-3">
                            <div className={cn(
                              "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              isSelected ? "border-primary bg-primary" : "border-gray-300"
                            )}>
                              {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className="text-xs font-black uppercase italic text-gray-700">{opt.name}</span>
                         </div>
                         <span className="text-xs font-black text-primary">₹ {opt.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <Sparkles className="h-3.5 w-3.5 text-primary" />
                   <h4 className="text-sm font-black uppercase tracking-widest text-gray-800">Special Instructions</h4>
                </div>
                <Textarea 
                  placeholder="E.g. Don't add onion, make it extra spicy..." 
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="rounded-2xl bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium text-sm min-h-[100px]"
                />
              </div>
            )}
          </div>

          {/* Footer Interaction Section */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
             <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-2xl h-14 px-2 border border-gray-100 shadow-sm">
                   <button 
                    onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                   >
                     <Minus className="h-4 w-4" />
                   </button>
                   <span className="w-10 text-center text-lg font-black">{localQuantity}</span>
                   <button 
                    onClick={() => setLocalQuantity(localQuantity + 1)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                   >
                     <Plus className="h-4 w-4" />
                   </button>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic text-base tracking-tighter shadow-lg shadow-primary/20 active:scale-95 transition-all"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  ADD TO BAG • ₹{(currentPrice * localQuantity).toFixed(2)}
                </Button>
             </div>
             
             {/* Dynamic Availability Text (Fallback) */}
             <div className="mt-4 text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                   <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                   Available for delivery now
                </p>
             </div>
          </div>
        </div>

        {/* Close Trigger */}
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-gray-100 flex items-center justify-center text-gray-400 active:scale-90 transition-all z-20"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
