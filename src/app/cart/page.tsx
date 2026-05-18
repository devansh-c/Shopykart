"use client"

import { useCart } from '@/components/cart/CartProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ShoppingBag, 
  X, 
  Loader2, 
  PlusCircle, 
  Bike, 
  Store, 
  Utensils, 
  Car, 
  MapPin, 
  ChevronRight, 
  TicketPercent, 
  Star, 
  FileText, 
  Wallet, 
  Banknote,
  CheckCircle2,
  Info
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
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart, customRequest } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderType, setOrderType] = useState('Delivery');
  const [paymentMethod, setPaymentMethod] = useState('Online');
  const [instructions, setInstructions] = useState('');
  const [address, setAddress] = useState('');

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

  const showLocalNotification = (title: string, body: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: body,
            icon: BRAND_LOGO_URL,
            badge: BRAND_LOGO_URL,
            tag: 'order-success'
          });
        }).catch(() => {
          try {
            new Notification(title, { body, icon: BRAND_LOGO_URL });
          } catch(e) {}
        });
      } else {
        try {
          new Notification(title, { body, icon: BRAND_LOGO_URL });
        } catch(e) {}
      }
    }
  };

  const handleCheckout = () => {
    if (!user || !firestore) {
      toast({ title: "Auth Error", description: "Please sign in to place order.", variant: "destructive" });
      return;
    }

    const ordersCol = collection(firestore, 'orders');
    const newOrderRef = doc(ordersCol);
    const orderId = newOrderRef.id;

    const orderData = {
      userId: user.uid,
      items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
      customRequest: customRequest || null,
      total: grandTotal,
      status: 'Placed',
      orderType,
      paymentMethod,
      instructions,
      address: address || 'Store Pickup',
      createdAt: serverTimestamp(),
      vendorId: cart[0]?.vendorId || 'unknown'
    };

    setDoc(newOrderRef, orderData)
      .then(() => {
        showLocalNotification(
          "Order Confirmed! 🚀", 
          "Thank You For Ordering Shopykart Your Order Has Been Delivered After 15 Minutes"
        );
      })
      .catch(async (err) => {
        const pErr = new FirestorePermissionError({ 
          path: `orders/${orderId}`, 
          operation: 'create', 
          requestResourceData: orderData 
        });
        errorEmitter.emit('permission-error', pErr);
      });

    setShowSuccess(true);
    
    setTimeout(() => {
      clearCart();
      router.push(`/orders/${orderId}`);
    }, 2500);
  };

  const handleAddAddress = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  const recommendations = dbProducts ? dbProducts.filter((p: any) => !cart.find(c => c.id === p.id)).slice(0, 5) : [];

  if (totalItems === 0 && !showSuccess) {
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
    <div className="min-h-screen bg-[#F5F6F7] pb-40">
      <OrderSuccessOverlay isVisible={showSuccess} />

      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Your Cart</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold uppercase tracking-tight text-gray-700">Your Order</h2>
            </div>
            <span className="text-xs font-bold text-gray-400">{totalItems} items</span>
          </div>

          <div className="space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3.5 w-3.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 truncate">{item.name}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center bg-red-500 text-white rounded-lg p-0.5 h-8">
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-full flex items-center justify-center font-bold text-lg">-</button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-8 h-full flex items-center justify-center font-bold text-lg">+</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-red-200 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {customRequest && (
               <div className="flex gap-4 bg-muted/20 p-3 rounded-xl border border-dashed">
                 <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black uppercase text-[10px]">VEG</div>
                 <div className="flex-1">
                    <h3 className="font-bold text-sm text-gray-800">Custom: {customRequest}</h3>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">₹20 Preparation Charge</p>
                 </div>
               </div>
            )}
          </div>

          <button 
            onClick={() => router.push('/menu')}
            className="w-full mt-6 py-3 border-2 border-dashed border-red-200 rounded-xl text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            Add more items
          </button>
        </div>

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
                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                  orderType === type.id ? "border-green-500 bg-green-50/50" : "border-gray-100 bg-white"
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
        </div>

        {/* Restore Payment Method Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'Online', icon: Wallet, label: 'Pay Online' },
              { id: 'COD', icon: Banknote, label: 'Cash on Delivery' },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                  paymentMethod === method.id ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
                )}
              >
                <div className={cn("p-2 rounded-lg", paymentMethod === method.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400")}>
                  <method.icon className="h-5 w-5" />
                </div>
                <span className={cn("text-xs font-bold", paymentMethod === method.id ? "text-primary" : "text-gray-500")}>
                  {method.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-bold text-gray-800">Delivery Address</h3>
          </div>
          {address ? (
            <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between group">
              <div className="flex-1 truncate pr-4">
                <span className="text-[10px] font-black text-primary uppercase">Deliver to</span>
                <p className="text-xs font-bold text-gray-700 truncate">{address}</p>
              </div>
              <button onClick={handleAddAddress} className="text-blue-500 text-[10px] font-bold">CHANGE</button>
            </div>
          ) : (
            <button 
              onClick={handleAddAddress}
              className="w-full py-3 border-2 border-dashed border-red-200 rounded-xl text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50"
            >
              <PlusCircle className="h-4 w-4" />
              Add delivery address
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Bill Details</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold text-gray-600">
              <span>Item Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-green-600">
              <span>Delivery Fee</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold text-gray-600">
              <span>Packaging Fee</span>
              <span>₹{packagingFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-600">
              <span>GST (5%)</span>
              <span>₹{gst.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
            <span className="text-base font-black text-gray-800">Total Payable</span>
            <span className="text-xl font-black text-red-500">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <div className="text-xl font-black text-gray-800">₹{grandTotal.toFixed(2)}</div>
            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
              {paymentMethod === 'Online' ? '⚡ Online' : '💵 Cash'} • incl. taxes
            </p>
          </div>
          
          <div className="flex-1 flex flex-col items-end gap-2">
            <Button 
              disabled={!address && orderType === 'Delivery'}
              onClick={handleCheckout}
              className="w-full h-14 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-lg shadow-xl shadow-red-200 active:scale-[0.98] transition-all"
            >
              Place Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
