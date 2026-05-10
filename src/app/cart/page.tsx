"use client"

import { useCart } from '@/components/cart/CartProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems } = useCart();
  const router = useRouter();

  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-muted h-32 w-32 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-black italic uppercase">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2 mb-8">Add something delicious to get started!</p>
        <Button onClick={() => router.push('/menu')} className="rounded-2xl h-12 px-8 font-bold">
          BROWSE MENU
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="bg-white sticky top-0 z-10 border-b border-border/50 px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-black italic uppercase tracking-tight">MY CART ({totalItems})</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        {cart.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-border/40 transition-all active:scale-[0.98]">
            <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
              <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.name}</h3>
              <p className="text-primary font-black text-base">₹{item.price.toFixed(2)}</p>
              
              <div className="flex items-center mt-2 bg-secondary/30 rounded-lg w-fit p-1">
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-xs font-black">{item.quantity}</span>
                <button 
                  onClick={() => addToCart(item)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                // In a real app, logic to remove all of this item
                for(let i=0; i<item.quantity; i++) removeFromCart(item.id);
              }}
              className="text-muted-foreground hover:text-red-500 p-2"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Order Summary</h2>
          <div className="space-y-2 border-b border-dashed border-border pb-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-bold">₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery Fee</span>
              <span className="font-bold text-green-600">FREE</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxes</span>
              <span className="font-bold">₹{(totalPrice * 0.05).toFixed(2)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-black uppercase italic">Total</span>
            <span className="text-2xl font-black text-primary italic tracking-tight">
              ₹{(totalPrice * 1.05).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Checkout Button */}
      <div className="fixed bottom-20 left-4 right-4 z-20">
        <Button className="w-full h-14 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-between px-6 bg-primary hover:bg-primary/90">
          <div className="flex flex-col items-start">
            <span className="text-[10px] opacity-80 font-bold uppercase tracking-widest">Proceed to</span>
            <span className="text-lg font-black uppercase italic tracking-tighter">Checkout</span>
          </div>
          <ArrowRight className="h-6 w-6" />
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
