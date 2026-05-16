
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
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';

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
  const [address, setAddress] = useState(typeof window !== 'undefined' ? localStorage.getItem('user_address') || '' : '');

  // Fetch some items for complete meal recommendations
  const prodsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: dbProducts } = useCollection<any>(prodsQuery);

  // Calculate costs
  const packagingFee = 10;
  const gst = totalPrice * 0.05;
  const deliveryFee = orderType === 'Delivery' ? 0 : 0; 
  const grandTotal = totalPrice + packagingFee + gst + deliveryFee;

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

  return (
    <div className="min-h-screen bg-[#F5F6F7] pb-40">
      <OrderSuccessOverlay isVisible={showSuccess} />

      {/* Header */}
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Your Cart</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Order Items Section */}
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

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
               <h3 className="text-sm font-bold text-gray-700">Complete your meal</h3>
            </div>
            <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
              {recommendations.map((prod) => (
                <div key={prod.id} className="min-w-[120px] max-w-[120px] bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                    <Image src={prod.imageUrl || `https://picsum.photos/seed/${prod.id}/200/200`} alt={prod.name} fill className="object-cover" />
                    <button 
                      onClick={() => addToCart({ ...prod, imageUrl: prod.imageUrl || `https://picsum.photos/seed/${prod.id}/200/200` })}
                      className="absolute bottom-1 right-1 h-6 w-6 bg-white rounded-full flex items-center justify-center shadow-md text-red-500"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mb-0.5">
                     <div className="h-2 w-2 bg-green-600 rounded-full" />
                     <span className="text-[10px] font-bold text-gray-800 truncate">{prod.name}</span>
                  </div>
                  <div className="text-[10px] font-bold text-gray-400">₹{prod.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Type */}
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

        {/* Delivery Address */}
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

        {/* Bill Details */}
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

        {/* Pay Using */}
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Pay Using</h3>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => setPaymentMethod('Online')}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                paymentMethod === 'Online' ? "border-green-500 bg-green-50/30" : "border-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-green-500" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-gray-800">Pay Online</h4>
                  <p className="text-[10px] text-gray-400 font-bold">UPI, Debit / Credit Card, Netbanking</p>
                </div>
              </div>
              <div className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                paymentMethod === 'Online' ? "border-green-500" : "border-gray-200"
              )}>
                {paymentMethod === 'Online' && <div className="h-2.5 w-2.5 bg-green-500 rounded-full" />}
              </div>
            </button>

            <button 
              onClick={() => setPaymentMethod('Cash')}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all",
                paymentMethod === 'Cash' ? "border-green-500 bg-green-50/30" : "border-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Banknote className="h-5 w-5 text-gray-400" />
                <div className="text-left">
                  <h4 className="text-xs font-bold text-gray-800">Pay with Cash</h4>
                  <p className="text-[10px] text-gray-400 font-bold">Pay when your order arrives</p>
                </div>
              </div>
              <div className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                paymentMethod === 'Cash' ? "border-green-500" : "border-gray-200"
              )}>
                {paymentMethod === 'Cash' && <div className="h-2.5 w-2.5 bg-green-500 rounded-full" />}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4 max-w-lg mx-auto">
          <div>
            <div className="text-xl font-black text-gray-800">₹{grandTotal.toFixed(2)}</div>
            <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
              ⚡ {paymentMethod === 'Online' ? 'Online' : 'COD'} • incl. taxes
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
