
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
  CheckCircle2,
  Sparkles,
  Coins
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, limit, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from '@/components/ui/switch';

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
  const [useCoins, setUseCoins] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [customerState, setCustomerState] = useState('Uttar Pradesh');

  // Fetch coordinates from local storage
  const [coords, setCoords] = useState<{lat: number | null, lng: number | null}>({ lat: null, lng: null });

  // 1. Fetch Economy Settings (for coin value)
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);
  const coinValue = branding?.coinValue || 0.5;

  // 2. Fetch User Profile for current coins
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);
  const availableCoins = profile?.coins || 0;

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: allVendors } = useCollection<any>(vendorsQuery);

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges } = useCollection<any>(chargesQuery);

  // CUSTOM DISH SURCHARGE LOGIC
  const customSurchargeTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.customSurcharge) || 0), 0);
  }, [cart]);

  const dynamicCharges = useMemo(() => {
    if (!dbCharges) return [];
    return dbCharges.map(charge => {
      let amount = 0;
      const chargeVal = Number(charge.value) || 0;
      if (charge.type === 'fixed') {
        amount = chargeVal;
      } else if (charge.type === 'percentage') {
        amount = (totalPrice * chargeVal) / 100;
      }
      return { ...charge, calculatedAmount: amount };
    });
  }, [dbCharges, totalPrice]);

  const chargesTotalSum = useMemo(() => {
    return dynamicCharges.reduce((acc, curr) => acc + (Number(curr.calculatedAmount) || 0), 0);
  }, [dynamicCharges]);

  // COIN DISCOUNT CALCULATION
  const coinDiscount = useMemo(() => {
    if (!useCoins || availableCoins <= 0 || coinValue <= 0) return 0;
    const potentialDiscount = availableCoins * coinValue;
    return Math.min(totalPrice, potentialDiscount);
  }, [useCoins, availableCoins, coinValue, totalPrice]);

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + customSurchargeTotal - coinDiscount);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomerName(localStorage.getItem('user_name') || '');
      setCustomerPhone(localStorage.getItem('user_phone') || '');
      setCustomerAddress(localStorage.getItem('user_address_line') || '');
      setCustomerCity(localStorage.getItem('user_city') || 'Ranipur');
      setCustomerPincode(localStorage.getItem('user_pincode') || '');
      
      const plusCode = localStorage.getItem('user_plus_code');
      if (plusCode) {
        const [lat, lng] = plusCode.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          setCoords({ lat, lng });
        }
      }
    }
  }, []);

  const createOrderInFirestore = async () => {
    if (!firestore || isPlacing) return;
    setIsPlacing(true);

    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    const orderRef = doc(firestore, 'orders', orderId);

    const guestUid = 'guest_' + (customerPhone || Date.now());
    const finalUid = user?.uid || guestUid;
    
    const fullFinalAddress = `${customerAddress || ''}, ${customerCity || ''}, ${customerState || ''} - ${customerPincode || ''}`;
    const coinsUsed = (useCoins && coinValue > 0) ? Math.ceil(coinDiscount / coinValue) : 0;

    const orderData = {
      userId: String(finalUid),
      customerName: String(customerName || 'Anonymous'),
      customerPhone: String(customerPhone || ''),
      orderDisplayId: String(orderId),
      items: cart.map(item => ({ 
        id: String(item.id), 
        name: String(item.name), 
        quantity: Number(item.quantity) || 1, 
        price: Number(item.price) || 0, 
        isCustom: !!item.isCustom,
        customSurcharge: Number(item.customSurcharge) || 0,
        vendorId: String(item.vendorId || 'global') 
      })),
      total: Number(grandTotal) || 0,
      status: 'Placed',
      orderType: String(orderType || 'Delivery'),
      paymentMethod: String(paymentMethod || 'cash'),
      paymentStatus: 'Pending',
      address: String(fullFinalAddress),
      pincode: String(customerPincode || ''),
      instructions: String(instructions || ''),
      latitude: coords.lat,
      longitude: coords.lng,
      createdAt: serverTimestamp(),
      vendorId: String(cart[0]?.vendorId || 'global'),
      restaurantName: String(cart[0]?.restaurantName || 'ShopyKart Store'),
      coinsEarned: 10,
      coinsUsed: coinsUsed,
      coinDiscount: coinDiscount
    };

    try {
      await setDoc(orderRef, orderData);
      
      const userRef = doc(firestore, 'users', finalUid);
      const userUpdateData: any = {
        fullName: String(customerName),
        phoneNumber: String(customerPhone),
        address: String(fullFinalAddress),
        city: String(customerCity),
        pincode: String(customerPincode),
        uid: String(finalUid),
        updatedAt: serverTimestamp(),
        coins: increment(10 - coinsUsed) 
      };

      await setDoc(userRef, userUpdateData, { merge: true });
      setShowSuccess(true);
      
      setTimeout(() => {
        clearCart();
        router.push(`/orders/track?id=${orderId}`);
      }, 3000);
    } catch (err) {
      console.error("Order Creation Failed:", err);
      setIsPlacing(false);
      toast({ variant: "destructive", title: "Order Failed", description: "Database connection error." });
    }
  };

  const handleCheckout = async () => {
    if (!firestore || isPlacing) return;
    if (!customerName.trim() || customerPhone.length !== 10 || !customerAddress.trim() || customerPincode.length !== 6) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Please fill all required fields." });
      return;
    }

    if (customerPhone.startsWith('0')) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Phone", 
        description: "any phone number cannot start with zero" 
      });
      return;
    }

    await createOrderInFirestore();
  };

  if (totalItems === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="h-12 w-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <Button onClick={() => router.push('/menu')} className="rounded-xl h-12 px-8 font-bold bg-primary mt-6">BROWSE MENU</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-44">
      <OrderSuccessOverlay isVisible={showSuccess} />

      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Your Cart</h1>
      </div>

      <div className="p-4 space-y-5">
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
                  {item.isCustom && (
                    <div className="absolute top-0 left-0 bg-primary/90 text-white text-[6px] font-black px-1 py-0.5 rounded-br-lg">CUSTOM</div>
                  )}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {availableCoins > 0 && (
          <div className="bg-[#0B0B0B] rounded-[2rem] p-6 shadow-xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 h-full w-24 bg-primary/5 -skew-x-12 translate-x-10" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/20 shadow-inner">
                  <Coins className="h-6 w-6 text-amber-500 fill-amber-500" />
                </div>
                <div>
                   <h3 className="text-sm font-black text-white italic uppercase tracking-tight">Redeem Coins</h3>
                   <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Balance: {availableCoins} Coins (₹{(availableCoins * coinValue).toFixed(2)})</p>
                </div>
              </div>
              <Switch 
                checked={useCoins} 
                onCheckedChange={setUseCoins}
                className="data-[state=checked]:bg-amber-50"
              />
            </div>
          </div>
        )}

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
            
            {customSurchargeTotal > 0 && (
              <div className="flex justify-between font-black text-primary animate-in slide-in-from-left-4">
                <div className="flex items-center gap-1.5">
                   <Sparkles className="h-3 w-3" />
                   <span>Custom Order Surcharge</span>
                </div>
                <span>₹{customSurchargeTotal.toFixed(2)}</span>
              </div>
            )}
            
            {dynamicCharges.map((charge: any) => (
              <div key={charge.id} className="flex justify-between font-bold text-gray-400">
                <span>{charge.name} {charge.type === 'percentage' && `(${charge.value}%)`}</span>
                <span>₹{(Number(charge.calculatedAmount) || 0).toFixed(2)}</span>
              </div>
            ))}

            {useCoins && coinDiscount > 0 && (
              <div className="flex justify-between font-black text-amber-600 animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-1.5">
                   <Zap className="h-3.5 w-3.5 fill-amber-500" />
                   <span>Coins Discount Applied</span>
                </div>
                <span>- ₹{coinDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-lg font-black text-gray-700">Total Payable</span>
            <span className="text-2xl font-black text-primary italic">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <MapPin className="h-5 w-5 text-primary" />
            <div className="flex-1">
               <h2 className="text-sm font-bold text-gray-800">Delivery Address</h2>
               {coords.lat && <p className="text-[8px] font-black text-green-600 uppercase">GPS Location Captured ✅</p>}
            </div>
          </div>
          <div className="space-y-3">
              <Input placeholder="Full Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Pincode *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                <Input placeholder="City *" value={customerCity} onChange={e => setCustomerCity(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>
              <Textarea placeholder="Full Address Line *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="rounded-xl bg-gray-50 border-none font-medium min-h-[80px]" />
              <Input placeholder="Mobile Number *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-6">
              <span className="text-sm">💳</span>
              <h4 className="text-sm font-bold text-gray-800">Pay Using</h4>
           </div>
           <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
              <label className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", paymentMethod === 'online' ? "border-green-500 bg-green-50/30" : "border-gray-100")}>
                <div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded-xl text-green-600"><CreditCard className="h-5 w-5" /></div><div><h5 className="text-xs font-bold text-gray-800">Online on Arrival</h5><p className="text-[9px] text-gray-400">UPI on delivery</p></div></div>
                <RadioGroupItem value="online" />
              </label>
              <label className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", paymentMethod === 'cash' ? "border-green-500 bg-green-50/30" : "border-gray-100")}>
                <div className="flex items-center gap-3"><div className="bg-gray-100 p-2 rounded-xl text-gray-600"><Banknote className="h-5 w-5" /></div><div><h5 className="text-xs font-bold text-gray-800">Pay with Cash</h5><p className="text-[9px] text-gray-400">Cash on delivery</p></div></div>
                <RadioGroupItem value="cash" />
              </label>
           </RadioGroup>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 p-4 pb-safe shadow-2xl">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-6">
           <div className="shrink-0">
              <div className="text-xl font-black text-gray-800 italic">₹{grandTotal.toFixed(2)}</div>
              <span className="text-[8px] font-black uppercase text-gray-400">{paymentMethod === 'online' ? '⚡ UPI' : '💵 Cash'}</span>
           </div>
           <Button disabled={isPlacing} onClick={handleCheckout} className="h-14 px-10 rounded-2xl font-black text-lg bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20">
              {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Place Order"}
           </Button>
        </div>
      </div>
    </div>
  );
}
