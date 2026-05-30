
'use client';

import { useState, useMemo } from 'react';
import { 
  X, 
  Star, 
  Heart, 
  Plus, 
  Minus, 
  CheckCircle2, 
  ShoppingBag,
  Sparkles
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
  const { cart, addToCart, isInWishlist, toggleWishlist } = useCart();
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
    
    setLocalQuantity(1);
    setSelectedOption(null);
    setInstructions('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      {/* Bottom Sheet styling for DialogContent */}
      <DialogContent className="sm:max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300 focus:outline-none bottom-0 top-auto translate-y-0 sm:top-[50%] sm:translate-y-[-50%]">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-white relative">
          {/* Circular Close Button from Screenshot */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white shadow-lg border border-border/50 flex items-center justify-center text-gray-400 active:scale-90 transition-all z-50"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header Section matching Screenshot */}
          <div className="p-6 pt-10 pb-4">
             <div className="flex gap-5">
                <div className="relative h-32 w-32 rounded-2xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm">
                   <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                   {product.isVeg && (
                      <div className="absolute top-2 left-2 h-4 w-4 border border-green-600 rounded-sm flex items-center justify-center p-0.5 bg-white/90">
                        <div className="h-full w-full bg-green-600 rounded-full" />
                      </div>
                   )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                   <div>
                      <h3 className="font-black text-2xl text-gray-900 leading-tight italic uppercase tracking-tighter truncate">{product.name}</h3>
                      <p className="text-xs font-black text-green-500 uppercase tracking-widest mt-1 italic">{product.restaurantName || 'ShopyKart Store'}</p>
                      
                      <div className="flex items-center gap-1.5 mt-2">
                         <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} className={cn("h-3.5 w-3.5", s <= (product.rating || 4) ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                            ))}
                         </div>
                         <span className="text-[10px] font-bold text-gray-400 ml-1">({product.reviewsCount || '35'})</span>
                      </div>
                   </div>

                   <div className="flex justify-between items-center mt-3">
                      <div className="text-3xl font-black text-gray-900 italic tracking-tighter">₹ {(currentPrice || 0).toFixed(2)}</div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }}
                        className={cn("p-2.5 rounded-2xl bg-gray-50 transition-all active:scale-75", liked ? "text-primary shadow-inner" : "text-gray-300")}
                      >
                        <Heart className={cn("h-6 w-6", liked && "fill-primary")} />
                      </button>
                   </div>
                </div>
             </div>
          </div>

          <div className="px-6 py-4 space-y-6">
            {hasOptions ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="text-lg font-black uppercase tracking-tighter text-gray-800">Addons</h4>
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full italic">Optional</span>
                </div>
                <div className="space-y-2.5">
                  {product.options.map((opt: any, idx: number) => {
                    const isSelected = selectedOption?.name === opt.name;
                    return (
                      <button 
                        key={idx}
                        onClick={() => setSelectedOption(isSelected ? null : opt)}
                        className={cn(
                          "w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 transition-all active:scale-[0.98]",
                          isSelected ? "border-primary bg-primary/5 shadow-inner" : "border-gray-50 bg-gray-50/50"
                        )}
                      >
                         <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                              isSelected ? "border-primary bg-primary" : "border-gray-300 bg-white"
                            )}>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                            </div>
                            <span className="text-sm font-black uppercase italic text-gray-700 tracking-tight">{opt.name}</span>
                         </div>
                         <span className="text-sm font-black text-gray-400 italic">₹ {opt.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <Sparkles className="h-4 w-4 text-primary" />
                   <h4 className="text-base font-black uppercase tracking-widest text-gray-800">Special Instructions</h4>
                </div>
                <Textarea 
                  placeholder="E.g. Don't add onion, make it extra spicy..." 
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="rounded-[1.5rem] bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-medium text-sm min-h-[120px] p-4"
                />
              </div>
            )}
          </div>

          {/* Fixed Footer with snappier interaction */}
          <div className="p-6 bg-gray-50 border-t border-gray-100 pb-10">
             <div className="flex items-center gap-4">
                <div className="flex items-center bg-white rounded-2xl h-16 px-2 border border-gray-100 shadow-sm">
                   <button 
                    onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
                    className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                   >
                     <Minus className="h-5 w-5" />
                   </button>
                   <span className="w-12 text-center text-xl font-black italic">{localQuantity}</span>
                   <button 
                    onClick={() => setLocalQuantity(localQuantity + 1)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
                   >
                     <Plus className="h-5 w-5" />
                   </button>
                </div>

                <Button 
                  onClick={handleAddToCart}
                  className="flex-1 h-16 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase italic text-lg tracking-tighter shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  ADD TO BAG • ₹{(currentPrice * localQuantity).toFixed(2)}
                </Button>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
