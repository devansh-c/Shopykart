
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { allProducts } from '@/lib/mock-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { ChevronLeft, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PopularProducts } from '@/components/home/PopularProducts';

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const router = useRouter();
  const { addToCart, removeFromCart, cart } = useCart();
  const [instructions, setInstructions] = useState('');

  const product = useMemo(() => 
    allProducts.find(p => p.id === productId), 
    [productId]
  );

  const cartItem = cart.find(item => item.id === productId);
  const [localQuantity, setLocalQuantity] = useState(cartItem?.quantity || 1);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black uppercase italic">Product Not Found</h2>
        <Button onClick={() => router.push('/menu')} className="mt-4">Back to Menu</Button>
      </div>
    );
  }

  const img = PlaceHolderImages.find(pi => pi.id === product.imageId);
  const imageUrl = img?.imageUrl || "https://picsum.photos/800/600";

  const handleAddToCart = () => {
    // For MVP, we'll just add the quantity to cart
    // In a real app, special instructions would be part of the CartItem object
    for(let i = 0; i < localQuantity; i++) {
      addToCart({ ...product, imageUrl });
    }
    router.push('/cart');
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Custom Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-border/50">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-black uppercase italic tracking-tight mr-10">Item Details</h1>
      </div>

      {/* Product Image Section */}
      <div className="relative w-full aspect-[4/3] bg-muted">
        <Image 
          src={imageUrl} 
          alt={product.name} 
          fill 
          className="object-cover"
          priority
        />
      </div>

      {/* Content Card */}
      <div className="relative z-10 -mt-8 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </div>

        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-black text-foreground leading-tight max-w-[80%]">{product.name}</h2>
          {product.isVeg && (
            <div className="h-6 w-6 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mt-1">
              <div className="h-full w-full bg-green-600 rounded-full" />
            </div>
          )}
        </div>

        <div className="text-2xl font-black text-primary mb-6">₹{product.price.toFixed(2)}</div>

        <div className="space-y-4 mb-8">
          <h3 className="text-base font-black text-foreground uppercase tracking-tight">Special instructions</h3>
          <Textarea 
            placeholder="E.g. no onions, extra sauce..." 
            className="rounded-2xl bg-muted/30 border-muted h-28 focus-visible:ring-primary/20"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        {/* Horizontal List of Products under instructions */}
        <div className="mt-12">
          <PopularProducts category="all" />
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/50 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-500">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          {/* Quantity Selector */}
          <div className="flex items-center bg-muted/50 rounded-2xl h-14 px-2">
            <button 
              onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-lg font-black">{localQuantity}</span>
            <button 
              onClick={() => setLocalQuantity(localQuantity + 1)}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button 
            onClick={handleAddToCart}
            className="flex-1 h-14 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Add to Cart • ₹{(product.price * localQuantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
