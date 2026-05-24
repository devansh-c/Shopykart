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
  Bike, 
  User, 
  FileText,
  PlusCircle,
  MapPin,
  Search,
  ChevronRight,
  Info,
  CreditCard,
  Banknote,
  Utensils,
  Car,
  ShoppingBasket,
  Clock,
  Tag,
  Zap,
  CheckCircle2
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, limit } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderType, setOrderType] = useState('Delivery');
  const [addressType, setAddressType] = useState('Home');
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  
  // Ref to track if we've already started the auto-placement to avoid double triggers
  const hasTriggeredRef = useRef(false);

  // User Details State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [customerState, setCustomerState] = useState('Uttar Pradesh');

  // Fetch Cross-sell Products
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(5));
  }, [firestore]);
  const { data: crossSellProducts } = useCollection<any>(productsQuery);

  // FETCH DYNAMIC CHARGES FROM ADMIN PANEL
  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges } = useCollection<any>(chargesQuery);

  const dynamicCharges = useMemo(() => {
    if (!dbCharges) return [];
    return dbCharges.map(charge => {
      let amount = 0;
      if (charge.type === 'fixed') {
        amount = charge.value;
      } else if (charge.type === 'percentage') {
        amount = (totalPrice * charge.value) / 100;
      }
      return { ...charge, calculatedAmount: amount };
    });
  }, [dbCharges, totalPrice]);

  const chargesTotalSum = useMemo(() => {
    return dynamicCharges.reduce((acc, curr) => acc + curr.calculatedAmount, 0);
  }, [dynamicCharges]);

  const grandTotal = totalPrice + chargesTotalSum;

  // Load from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomerName(localStorage.getItem('user_name') || '');
      setCustomerPhone(localStorage.getItem('user_phone') || '');
      setCustomerAddress(localStorage.getItem('user_address_line') || '');
      setCustomerCity(localStorage.getItem('user_city') || 'Ranipur');
      setCustomerPincode(localStorage.getItem('user_pincode') || '');
    }
  }, []);

  const createOrderInFirestore = async () => {
    if (!firestore || isPlacing || hasTriggeredRef.current) return;
    setIsPlacing(true);
    hasTriggeredRef.current = true;

    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    const orderRef = doc(firestore, 'orders', orderId);

    const guestUid = 'guest_' + customerPhone;
    const finalUid = user?.uid || guestUid;
    
    const fullFinalAddress = `${customerAddress}, ${customerCity}, ${customerState} - ${customerPincode}`;

    const orderData = {
      userId: finalUid,
      customerName,
      customerPhone,
      orderDisplayId: orderId,
      items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price, vendorId: item.vendorId })),
      total: grandTotal,
      status: 'Placed',
      orderType,
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'Paid' : 'Pending',
      address: fullFinalAddress,
      pincode: customerPincode,
      instructions,
      createdAt: serverTimestamp(),
      vendorId: cart[0]?.vendorId || 'unknown',
      restaurantName: cart[0]?.restaurantName || 'a store',
      coinsEarned: 10
    };

    try {
      await setDoc(orderRef, orderData);
      
      const userRef = doc(firestore, 'users', finalUid);
      await setDoc(userRef, {
        fullName: customerName,
        phoneNumber: customerPhone,
        address: fullFinalAddress,
        city: customerCity,
        pincode: customerPincode,
        uid: finalUid,
        updatedAt: serverTimestamp(),
        coins: increment(10)
      }, { merge: true });

      setShowSuccess(true);
      
      setTimeout(() => {
        clearCart();
        router.push(`/orders/track?id=${orderId}`);
      }, 3000);
    } catch (err) {
      setIsPlacing(false);
      hasTriggeredRef.current = false;
      toast({ variant: "destructive", title: "Order Failed", description: "Database connection error." });
    }
  };

  /**
   * AUTOMATIC ORDER PLACEMENT LOGIC
   * Listens for the user returning to the app window after starting payment.
   */
  useEffect(() => {
    const handleWindowFocus = () => {
      if (paymentInitiated && !showSuccess && !isPlacing && !hasTriggeredRef.current) {
        // Short delay to ensure browser state is stable
        setTimeout(() => {
          createOrderInFirestore();
        }, 1500);
      }
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [paymentInitiated, showSuccess, isPlacing]);

  const handleCheckout = async () => {
    if (!firestore || isPlacing) return;

    if (!customerName.trim() || customerPhone.length !== 10 || !customerAddress.trim() || customerPincode.length !== 6) {
      toast({ 
        variant: "destructive", 
        title: "Incomplete Details", 
        description: "Please fill all required address fields." 
      });
      return;
    }

    // Step 1: Initiate UPI Payment (For Online only)
    if (paymentMethod === 'online' && !paymentInitiated) {
      const upiId = "9450355709@axl";
      const payeeName = "ShopyKart";
      const amount = grandTotal.toFixed(2);
      const transactionNote = `ShopyKart Order Verification`;
      
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
      
      // Launch UPI intent
      window.location.href = upiUrl;

      // Update state to listen for return
      setPaymentInitiated(true);
      toast({
        title: "Payment Initiated",
        description: "Order will be placed automatically when you return.",
      });
      return;
    }

    // Step 2: Final Placement (For Online confirmation or Cash immediately)
    await createOrderInFirestore();
  };

  if (totalItems === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="h-12 w-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <Button onClick={() => router.push('/menu')} className="rounded-xl h-12 px-8 font-bold bg-primary mt-6">
          BROWSE MENU
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-44">
      <OrderSuccessOverlay isVisible={showSuccess} />

      {/* Header */}
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Your Cart</h1>
      </div>

      <div className="p-4 space-y-5">
        {/* Automatic Verification Banner */}
        {paymentInitiated && !showSuccess && (
          <div className="bg-green-50 border-2 border-green-200 p-5 rounded-3xl animate-in fade-in zoom-in duration-500">
             <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-500 p-2 rounded-xl text-white">
                   <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <h3 className="text-sm font-black uppercase text-green-800 italic">Waiting for Payment</h3>
             </div>
             <p className="text-xs font-bold text-green-900 leading-relaxed mb-4">
                Jaisa hi aap UPI App se payment karke yahan wapas aayenge, aapka order automatically place ho jayega.
             </p>
             <button 
              onClick={() => setPaymentInitiated(false)}
              className="text-[10px] font-black text-gray-500 uppercase tracking-widest underline underline-offset-4"
             >
                Cancel or Change Method
             </button>
          </div>
        )}

        {/* Your Order Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
             <ShoppingBasket className="h-5 w-5 text-gray-400" />
             <h2 className="text-sm font-bold text-gray-800">Your Order</h2>
             <span className="ml-auto text-[10px] font-bold text-gray-400 uppercase">{totalItems} item</span>
          </div>

          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-100">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="h-3 w-3 border border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 truncate">{item.name}</h3>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-primary text-white rounded-lg h-8 px-1">
                      <button onClick={() => removeFromCart(item.id)} className="h-6 w-6 flex items-center justify-center font-bold text-lg">-</button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="h-6 w-6 flex items-center justify-center font-bold text-lg">+</button>
                    </div>
                    <div className="text-sm font-black text-gray-800">₹{item.price.toFixed(2)}</div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-100 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => router.push('/menu')}
            className="w-full mt-6 py-3 border border-dashed border-primary/40 rounded-xl text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/5"
          >
            <PlusCircle className="h-4 w-4" />
            Add more items
          </button>
        </div>

        {/* Complete Your Meal Section */}
        {crossSellProducts && crossSellProducts.length > 0 && (
          <div className="space-y-3">
             <div className="flex items-center gap-2 px-1">
                <Utensils className="h-4 w-4 text-gray-400" />
                <h3 className="text-xs font-bold uppercase text-gray-500">Complete your meal</h3>
             </div>
             <div className="flex overflow-x-auto gap-4 no-scrollbar pb-2">
                {crossSellProducts.map((p) => (
                  <div key={p.id} className="min-w-[140px] bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-col group">
                     <div className="relative h-24 w-full rounded-xl overflow-hidden mb-2">
                        <Image src={p.imageUrl} alt={p.name} fill className="object-cover" />
                        <button onClick={() => addToCart(p)} className="absolute bottom-1 right-1 bg-white p-1 rounded-lg shadow-md text-primary active:scale-90 transition-transform">
                           <Plus className="h-4 w-4" />
                        </button>
                     </div>
                     <span className="text-[10px] font-bold text-gray-800 truncate mb-0.5">{p.name}</span>
                     <span className="text-[10px] font-black text-gray-500">₹{p.price}</span>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Order Type Tabs */}
        <div className="space-y-3">
           <h3 className="text-xs font-black uppercase text-gray-500 ml-1">Order Type</h3>
           <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'Delivery', icon: Bike, time: 'Express' },
                { id: 'Pickup', icon: ShoppingBag, time: 'Self' },
                { id: 'Dine in', icon: Utensils, time: 'Table' },
                { id: 'In Car', icon: Car, time: 'Valet' }
              ].map((type) => (
                <button 
                  key={type.id}
                  onClick={() => setOrderType(type.id)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95",
                    orderType === type.id ? "bg-green-50 border-green-500 text-green-700" : "bg-white border-gray-100 text-gray-400"
                  )}
                >
                  <type.icon className="h-5 w-5 mb-1" />
                  <span className="text-[8px] font-black uppercase">{type.id}</span>
                </button>
              ))}
           </div>
           <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 ml-1">
             <Clock className="h-3 w-3" /> {orderType === 'Delivery' ? 'Express Delivery' : 'Ready soon'}
           </p>
        </div>

        {/* Delivery Address Form */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-bold text-gray-800">Delivery Address</h2>
          </div>

          <div className="space-y-5">
            <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
               {['Home', 'Work', 'Other'].map((t) => (
                 <button 
                  key={t}
                  onClick={() => setAddressType(t)}
                  className={cn("flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all", addressType === t ? "bg-primary text-white shadow-md" : "text-gray-400")}
                 >
                   {t}
                 </button>
               ))}
            </div>

            <div className="space-y-3">
              <Input placeholder="Full Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Pincode *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                <Input placeholder="City *" value={customerCity} onChange={e => setCustomerCity(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Locate Address" className="h-12 pl-10 rounded-xl bg-gray-50 border-none font-bold" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-red-50 text-primary text-[8px] font-black rounded-lg border border-primary/10">Pin on Map</button>
              </div>

              <Textarea 
                placeholder="Full Address Line *" 
                value={customerAddress}
                onChange={e => setCustomerAddress(e.target.value)}
                className="rounded-xl bg-gray-50 border-none font-medium min-h-[80px]"
              />

              <Input 
                placeholder="Mobile Number *" 
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))}
                className="h-12 rounded-xl bg-gray-50 border-none font-bold"
              />
            </div>
          </div>
        </div>

        {/* Coupons */}
        <button className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between w-full group">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                 <Tag className="h-5 w-5" />
              </div>
              <div className="text-left">
                 <h4 className="text-xs font-bold text-gray-800">View all coupons</h4>
                 <p className="text-[10px] text-green-600 font-bold uppercase">1 offer available</p>
              </div>
           </div>
           <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Special Instructions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">📝</span>
              <h4 className="text-xs font-bold text-gray-800">Special Instructions</h4>
           </div>
           <Input 
            placeholder="Any special requests? (optional)" 
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            className="h-12 rounded-xl bg-gray-50 border-none text-xs font-medium"
           />
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase">Bill Details</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold text-gray-400">
              <span>Item Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            
            {/* DYNAMIC CHARGES FROM ADMIN */}
            {dynamicCharges.map((charge: any) => (
              <div key={charge.id} className="flex justify-between font-bold text-gray-400">
                <span>{charge.name} {charge.type === 'percentage' && `(${charge.value}%)`}</span>
                <span>₹{charge.calculatedAmount.toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-lg font-black text-gray-700">Total Payable</span>
            <span className="text-2xl font-black text-primary italic">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-6">
              <span className="text-sm">💳</span>
              <h4 className="text-sm font-bold text-gray-800">Pay Using</h4>
           </div>
           <RadioGroup value={paymentMethod} onValueChange={(val) => { setPaymentMethod(val); setPaymentInitiated(false); }} className="space-y-4">
              <label className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                paymentMethod === 'online' ? "border-green-500 bg-green-50/30" : "border-gray-100"
              )}>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-xl text-green-600"><CreditCard className="h-5 w-5" /></div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">Pay Online (UPI)</h5>
                    <p className="text-[9px] text-gray-400 font-medium">Safe & Fast via Google Pay, PhonePe, Paytm</p>
                  </div>
                </div>
                <RadioGroupItem value="online" className="border-gray-300 text-green-600" />
              </label>

              <label className={cn(
                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer",
                paymentMethod === 'cash' ? "border-green-500 bg-green-50/30" : "border-gray-100"
              )}>
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-xl text-gray-600"><Banknote className="h-5 w-5" /></div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">Pay with Cash</h5>
                    <p className="text-[9px] text-gray-400 font-medium">Pay when your order arrives</p>
                  </div>
                </div>
                <RadioGroupItem value="cash" className="border-gray-300 text-green-600" />
              </label>
           </RadioGroup>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-gray-100/50 rounded-2xl p-5 border border-gray-100">
           <h5 className="text-[10px] font-black uppercase text-gray-500 mb-1">Cancellation Policy</h5>
           <p className="text-[10px] font-medium text-gray-400 leading-relaxed uppercase">
             Help us reduce food waste by avoiding cancellations after placing your order. Orders once placed cannot be cancelled.
           </p>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-6">
           <div className="shrink-0">
              <div className="text-xl font-black text-gray-800 italic tracking-tighter">₹{grandTotal.toFixed(2)}</div>
              <div className="flex items-center gap-1 text-gray-400">
                 <span className="text-[8px] font-black uppercase italic">{paymentMethod === 'online' ? '⚡ UPI Payment' : '💵 Cash On Delivery'}</span>
                 <span className="text-[8px] text-gray-300">• Incl. taxes</span>
              </div>
           </div>
           
           <div className="flex flex-col items-center gap-1">
              <Button 
                disabled={isPlacing}
                onClick={handleCheckout}
                className={cn(
                  "h-14 px-10 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all",
                  paymentInitiated ? "bg-green-600 hover:bg-green-700 text-white shadow-green-100" : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                )}
              >
                {isPlacing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  paymentMethod === 'online' ? (
                    paymentInitiated ? (
                      <span className="flex items-center gap-2">Processing <Loader2 className="h-5 w-5 animate-spin" /></span>
                    ) : "Pay & Order"
                  ) : "Place Order"
                )}
              </Button>
              <div className="flex items-center gap-1 text-[8px] font-bold text-gray-400">
                 <Bike className="h-2.5 w-2.5 text-amber-500" />
                 {paymentInitiated ? 'Auto-Confirming...' : 'Express'}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
