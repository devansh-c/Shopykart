'use client';

import { useCart } from '@/components/cart/CartProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  PlusCircle, 
  Bike, 
  Store, 
  Utensils, 
  Car, 
  MapPin, 
  ChevronRight, 
  TicketPercent, 
  FileText, 
  Wallet, 
  Banknote,
  History
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';

const BRAND_LOGO_URL = "https://picsum.photos/seed/shopykart-eats/200/200";

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderType, setOrderType] = useState('Delivery');
  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [instructions, setInstructions] = useState('');
  const [address, setAddress] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAddress(localStorage.getItem('user_address') || '');
    }
  }, []);

  const prodsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: dbProducts } = useCollection<any>(prodsQuery);

  const packagingFee = 10;
  const gst = totalPrice * 0.05;
  const deliveryFee = 0; 
  const grandTotal = totalPrice + packagingFee + gst + deliveryFee;

  const handleCheckout = () => {
    if (!user || !firestore || isPlacing) {
      if (!user) toast({ title: "Auth Required", description: "Please sign in.", variant: "destructive" });
      return;
    }

    setIsPlacing(true);
    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    const orderRef = doc(firestore, 'orders', orderId);

    const orderData = {
      userId: user.uid,
      orderDisplayId: orderId,
      items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
      total: grandTotal,
      status: 'Placed',
      orderType,
      paymentMethod,
      instructions,
      address: address || 'Store Pickup',
      createdAt: serverTimestamp(),
      vendorId: cart[0]?.vendorId || 'unknown'
    };

    setShowSuccess(true);

    setDoc(orderRef, orderData)
      .then(() => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then((registration) => {
               registration.showNotification("Order Confirmed! 🚀", {
                 body: "Thank you for ordering with Shopykart!",
                 icon: BRAND_LOGO_URL,
                 badge: BRAND_LOGO_URL
               });
             }).catch(() => {});
        }
        
        setTimeout(() => {
          clearCart();
          router.push(`/orders/${orderId}`);
        }, 1500);
      })
      .catch(async (err: any) => {
        setShowSuccess(false);
        setIsPlacing(false);
        const pErr = new FirestorePermissionError({ 
          path: `orders/${orderId}`, 
          operation: 'create', 
          requestResourceData: orderData 
        });
        errorEmitter.emit('permission-error', pErr);
      });
  };

  const recommendations = dbProducts ? dbProducts.filter((p: any) => !cart.find(c => c.id === p.id)).slice(0, 5) : [];

  if (totalItems === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="h-12 w-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-400 mt-1 mb-8 text-sm">Add something delicious to get started!</p>
        <Button onClick={() => router.push('/menu')} className="rounded-xl h-12 px-8 font-bold bg-[#EF4444]">
          BROWSE MENU
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7] pb-40">
      <OrderSuccessOverlay isVisible={showSuccess} />

      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Your Cart</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold uppercase text-gray-700">Your Order</h2>
            </div>
            <span className="text-xs font-bold text-gray-400">{totalItems} items</span>
          </div>

          <div className="space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3.5 w-3.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 truncate">{item.name}</h3>
                  </div>
                  <div className="text-sm font-black text-gray-800 mt-6">₹{item.price.toFixed(2)}</div>
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center bg-[#EF4444] text-white rounded-lg h-9 w-24">
                      <button onClick={() => removeFromCart(item.id)} className="flex-1 flex items-center justify-center font-bold text-xl">-</button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="flex-1 flex items-center justify-center font-bold text-xl">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="bg-pink-50 p-2 rounded-lg text-[#EF4444] hover:bg-pink-100 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => router.push('/menu')}
            className="w-full mt-6 py-3 border-2 border-dashed border-[#EF4444]/30 rounded-xl text-[#EF4444] font-bold text-sm flex items-center justify-center gap-2 hover:bg-pink-50/50 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Add more items
          </button>
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Utensils className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold uppercase text-gray-700">Complete your meal</h2>
            </div>
            <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
              {recommendations.map((prod) => (
                <div key={prod.id} className="min-w-[140px] bg-white rounded-2xl p-2 shadow-sm border border-gray-50 flex flex-col">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden mb-2 bg-gray-50">
                    <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover" />
                    <button 
                      onClick={() => addToCart(prod)}
                      className="absolute bottom-1 right-1 h-6 w-6 bg-white rounded-full shadow-lg flex items-center justify-center text-[#EF4444] active:scale-90 transition-transform"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                    </button>
                  </div>
                  <div className="px-1">
                    <div className="h-3 w-3 border border-green-600 rounded-sm flex items-center justify-center p-0.5 mb-1">
                       <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                    <h4 className="text-[11px] font-bold text-gray-800 line-clamp-1">{prod.name}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5">₹{prod.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Order Type</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'Delivery', icon: Bike, label: 'Delivery' },
              { id: 'Pickup', icon: Store, label: 'Pickup' },
              { id: 'Dine In', icon: Utensils, label: 'Dine In' },
              { id: 'In Car', icon: Car, label: 'In Car' },
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setOrderType(type.id)}
                className={cn(
                  "flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition-all",
                  orderType === type.id ? "border-green-500 bg-green-50/30" : "border-gray-50 bg-white"
                )}
              >
                <div className={cn("p-1.5 rounded-lg", orderType === type.id ? "text-green-600" : "text-gray-400")}>
                  <type.icon className="h-5 w-5" />
                </div>
                <span className={cn("text-[10px] font-bold", orderType === type.id ? "text-green-700" : "text-gray-500")}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 px-1">
             <History className="h-3 w-3" />
             <span>~20 min - Free</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#EF4444]" />
            <h3 className="text-sm font-bold text-gray-800">Delivery Address</h3>
          </div>
          {address ? (
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between group">
              <div className="flex-1 truncate pr-4">
                <span className="text-[10px] font-bold text-[#EF4444] uppercase">Home</span>
                <p className="text-xs font-bold text-gray-700 truncate mt-0.5">{address}</p>
              </div>
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))} className="text-blue-500 text-[10px] font-bold uppercase">Change</button>
            </div>
          ) : (
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}
              className="w-full py-3 border-2 border-dashed border-[#EF4444]/30 rounded-xl text-[#EF4444] font-bold text-sm flex items-center justify-center gap-2 hover:bg-pink-50/50"
            >
              <PlusCircle className="h-4 w-4" />
              Add delivery address
            </button>
          )}
        </div>

        <button className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all">
          <div className="flex items-center gap-3">
             <div className="bg-pink-50 p-2 rounded-xl text-[#EF4444]">
               <TicketPercent className="h-5 w-5" />
             </div>
             <div className="text-left">
               <h4 className="text-sm font-bold text-gray-800">View all coupons</h4>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">2 offers available</p>
             </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-[#EF4444] transition-colors" />
        </button>

        <div className="space-y-3">
           <div className="flex items-center gap-2 px-1">
             <FileText className="h-4 w-4 text-gray-400" />
             <h2 className="text-sm font-bold uppercase text-gray-700">Special Instructions</h2>
           </div>
           <Textarea 
             placeholder="Any special requests? (kam mirchi, extra sauce...)" 
             className="rounded-xl bg-white border-none shadow-sm h-14 text-sm font-medium focus-visible:ring-1 focus-visible:ring-[#EF4444]/20"
             value={instructions}
             onChange={(e) => setInstructions(e.target.value)}
           />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 uppercase">Bill Details</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold text-gray-500">
              <span>Item Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-green-600">
              <span>Delivery Fee</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-gray-500">
              <span>Packaging Fee</span>
              <span>₹{packagingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-500">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
            <span className="text-base font-black text-gray-700">Total Payable</span>
            <span className="text-xl font-black text-[#EF4444]">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-gray-100 rounded-2xl p-4 border border-gray-200/50">
           <h4 className="text-[10px] font-black uppercase text-gray-600 mb-1 tracking-wider">Cancellation Policy</h4>
           <p className="text-[10px] font-medium text-gray-500 leading-relaxed">
             Help us reduce food waste by avoiding cancellations after placing your order. Orders once placed cannot be cancelled.
           </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto">
           <div className="flex items-center justify-between mb-3 px-1">
              <div>
                 <div className="text-lg font-black text-gray-800">₹{grandTotal.toFixed(2)}</div>
                 <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
                   {paymentMethod === 'Online' ? '⚡ Online Payment' : '💵 Cash'} • incl. taxes
                 </p>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                 <Bike className="h-4 w-4 text-amber-500" />
                 <span className="text-[10px] font-bold">~20 min</span>
              </div>
           </div>
           <Button 
            disabled={(!address && orderType === 'Delivery') || isPlacing}
            onClick={handleCheckout}
            className="w-full h-14 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-lg shadow-xl shadow-red-100 active:scale-[0.98] transition-all"
          >
            {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
