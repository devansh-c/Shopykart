'use client';

import { useCart } from '@/components/cart/CartProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  MapPin, 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  ShoppingBasket, 
  Coins, 
  Map as MapIcon, 
  Tag, 
  Ticket, 
  X, 
  ChevronUp, 
  QrCode, 
  Smartphone, 
  ShieldCheck,
  CheckCircle2,
  Hash,
  Heart,
  Package,
  MessageSquareQuote,
  AlertCircle,
  Store,
  ArrowRight,
  Crown,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef, useCallback, memo, Suspense } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

function CartContent() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [useCoins, setUseCoins] = useState(false);
  const [premiumPackaging, setPremiumPackaging] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const [deliveryTip, setDeliveryTip] = useState<number>(0);
  const [customTipInput, setCustomTipInput] = useState('');
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'utr'>('selection');

  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);
  const coinValue = settings?.coinValue || 0.5;

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);
  const availableCoins = profile?.coins || 0;

  const isPremium = useMemo(() => {
    if (!profile?.isPremium || !profile?.premiumExpiry) return false;
    const expiry = new Date(profile.premiumExpiry).getTime();
    return expiry > Date.now();
  }, [profile]);

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges, loading: chargesLoading } = useCollection<any>(chargesQuery);

  const customSurchargeTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.customSurcharge) || 0), 0);
  }, [cart]);

  const blockedVendorNames = useMemo(() => {
    if (!vendors || cart.length === 0) return [];
    const offlineVendors = new Set<string>();
    cart.forEach(item => {
      const v = vendors.find(v => v.id === item.vendorId);
      if (v && v.isOnline === false) {
        offlineVendors.add(v.storeName || 'Store');
      }
    });
    return Array.from(offlineVendors);
  }, [cart, vendors]);

  const dynamic_charges = useMemo(() => {
    if (!dbCharges || profileLoading || chargesLoading) return [];
    
    const activeZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    const relevantCharges = dbCharges.filter(charge => {
      if (!charge.zoneId || charge.zoneId === 'global') return true;
      return charge.zoneId === activeZoneId;
    });

    return relevantCharges.map(charge => {
      let amount = 0;
      const chargeVal = Number(charge.value) || 0;
      const isWaived = isPremium;

      if (isWaived) {
        amount = 0;
      } else {
        if (charge.type === 'fixed') amount = chargeVal;
        else if (charge.type === 'percentage') amount = (totalPrice * chargeVal) / 100;
      }

      return { ...charge, calculatedAmount: amount, isWaived };
    });
  }, [dbCharges, totalPrice, isPremium, profileLoading, chargesLoading]);

  const chargesTotalSum = useMemo(() => {
    return dynamic_charges.reduce((acc, curr) => acc + (Number(curr.calculatedAmount) || 0), 0);
  }, [dynamic_charges]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const discountStr = appliedCoupon.discount || '0';
    if (discountStr.includes('%')) {
      const percentage = parseFloat(discountStr.replace(/[^0-9.]/g, ''));
      return (totalPrice * percentage) / 100;
    } else {
      return parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
    }
  }, [appliedCoupon, totalPrice]);

  const coinDiscount = useMemo(() => {
    if (!useCoins || availableCoins <= 0 || coinValue <= 0) return 0;
    const remainingTotal = Math.max(0, totalPrice - couponDiscount);
    return Math.min(remainingTotal, availableCoins * coinValue);
  }, [useCoins, availableCoins, coinValue, totalPrice, couponDiscount]);

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + customSurchargeTotal + deliveryTip + (premiumPackaging ? 10 : 0) - coinDiscount - couponDiscount);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedName = localStorage.getItem('user_name') || localStorage.getItem('last_customer_name');
    const savedPhone = localStorage.getItem('user_phone') || localStorage.getItem('last_customer_phone');
    const savedAddress = localStorage.getItem('user_address_line') || localStorage.getItem('last_customer_address');
    const savedCity = localStorage.getItem('user_city');
    const savedPincode = localStorage.getItem('user_pincode');

    setCustomerName(profile?.fullName || savedName || '');
    setCustomerPhone(profile?.phoneNumber || savedPhone || '');
    setCustomerAddress(profile?.address || savedAddress || '');
    setCustomerCity(profile?.city || savedCity || '');
    setCustomerPincode(profile?.pincode || savedPincode || '');
    
    const savedPlusCode = localStorage.getItem('user_plus_code');
    if (savedPlusCode) {
      const [lat, lng] = savedPlusCode.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) { setLatitude(lat); setLongitude(lng); }
    }
  }, [profile]);

  if (!isMounted) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-white">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-800 italic uppercase tracking-tighter">Secure Checkout</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto transform-gpu pb-20">
        
        {isPremium && !profileLoading && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2rem] p-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
             <div className="h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Crown className="h-6 w-6 fill-white" />
             </div>
             <div>
                <h4 className="font-black italic uppercase text-amber-900 text-sm">Elite Privilege Active</h4>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">
                   Unlimited Free Delivery & Taxes waived for you!
                </p>
             </div>
          </div>
        )}

        {blockedVendorNames.length > 0 && (
          <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] p-6 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-6 w-6 animate-pulse" />
                <h4 className="font-black italic uppercase text-sm">Store is Closed</h4>
             </div>
             <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed">
                Currently <b>{blockedVendorNames.join(', ')}</b> is not accepting orders. Please remove their products to proceed.
             </p>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><ShoppingBasket className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase tracking-widest italic">Items In Bag</h2></div>
          <div className="space-y-4">
            {cart.map((item) => {
              const vendor = vendors?.find(v => v.id === item.vendorId);
              const isItemOffline = vendor?.isOnline === false;

              return (
                <div key={item.id + (item.selectedOption?.name || '')} className={cn("flex gap-4 items-start transition-opacity", isItemOffline && "opacity-60")}>
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm mt-1">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                    {isItemOffline && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <X className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <h3 className="font-bold text-xs text-gray-800 truncate uppercase">{item.name}</h3>
                       {isItemOffline && (
                         <span className="text-[7px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase animate-pulse">Closed</span>
                       )}
                    </div>
                    {item.selectedOption && <p className="text-[8px] font-black text-primary uppercase italic">{item.selectedOption.name}</p>}
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg h-7 px-1">
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-full flex items-center justify-center font-bold text-gray-500">-</button>
                        <span className="w-5 text-center text-[10px] font-black">{item.quantity}</span>
                        <button onClick={() => !isItemOffline && addToCart(item)} disabled={isItemOffline} className={cn("w-6 h-full flex items-center justify-center font-bold text-gray-500", isItemOffline && "opacity-20 cursor-not-allowed")}>+</button>
                      </div>
                      <div className={cn("text-sm font-black text-gray-900 italic", !isMounted && "invisible")}>₹{item.price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Delivery Spot</h2></div>
          <div className="space-y-4">
              <button type="button" onClick={() => setIsMapOpen(true)} className="w-full h-11 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all"><MapIcon className="h-4 w-4" /> PIN ON GOOGLE MAP</button>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Full Name</label>
                      <Input placeholder="E.G. RAHUL SINGH *" value={customerName} onChange={e => setCustomerName(e.target.value.toUpperCase())} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Pincode</label>
                      <Input placeholder="PINCODE *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold text-center" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">City</label>
                      <Input placeholder="CITY *" value={customerCity} readOnly className="h-12 rounded-xl bg-gray-50 border-none font-bold opacity-60 text-center" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Mobile Number</label>
                   <Input placeholder="10 DIGIT PHONE NUMBER *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                </div>
              </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-7 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4 transition-all hover:shadow-lg">
          <h3 className="text-sm font-black text-gray-800 uppercase italic">Billing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between font-bold text-[11px] text-gray-500 uppercase tracking-widest"><span>Item Total</span><span className={cn(!isMounted && "invisible")}>₹{totalPrice.toFixed(2)}</span></div>
            {chargesLoading || profileLoading ? (
              <div className="flex justify-between font-bold text-[11px] text-gray-300 uppercase tracking-widest animate-pulse">
                <span>Calculating Taxes...</span>
                <span>--</span>
              </div>
            ) : (
              dynamic_charges.map((charge: any) => (
                <div key={charge.id} className="flex justify-between font-bold text-[11px] text-gray-400 uppercase tracking-widest">
                  <span>{charge.name}</span>
                  {charge.isWaived ? (
                    <span className="text-green-600 font-black flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> FREE (Elite)</span>
                  ) : (
                    <span>₹{charge.calculatedAmount.toFixed(2)}</span>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="pt-5 border-t border-dashed border-gray-100 flex justify-between items-center"><span className="text-base font-black text-gray-800 uppercase italic tracking-tighter">Total Payable</span><span className={cn("text-3xl font-black text-primary italic tracking-tighter", !isMounted && "invisible")}>₹{grandTotal.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <CartContent />
    </Suspense>
  );
}
