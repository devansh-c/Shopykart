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
  Coins,
  LocateFixed,
  Map as MapIcon,
  Heart,
  Navigation,
  Crosshair,
  MapIcon as MapPinIcon
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, limit, updateDoc, where } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

function isPointInPolygon(lat: number, lng: number, vs: any[]) {
  if (!vs || !Array.isArray(vs) || vs.length < 3) return false;
  const x = Number(lat);
  const y = Number(lng);
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = Number(vs[i].lat);
    const yi = Number(vs[i].lng);
    const xj = Number(vs[j].lat);
    const yj = Number(vs[j].lng);
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [useCoins, setUseCoins] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isValidatingLocation, setIsValidatingLocation] = useState(false);

  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false);
  const [customTipValue, setCustomTipValue] = useState('');

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);
  const coinValue = branding?.coinValue || 0.5;

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);
  const availableCoins = profile?.coins || 0;

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges } = useCollection<any>(chargesQuery);

  const customSurchargeTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.customSurcharge) || 0), 0);
  }, [cart]);

  const dynamic_charges = useMemo(() => {
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
    return dynamic_charges.reduce((acc, curr) => acc + (Number(curr.calculatedAmount) || 0), 0);
  }, [dynamic_charges]);

  const coinDiscount = useMemo(() => {
    if (!useCoins || availableCoins <= 0 || coinValue <= 0) return 0;
    const potentialDiscount = availableCoins * coinValue;
    return Math.min(totalPrice, potentialDiscount);
  }, [useCoins, availableCoins, coinValue, totalPrice]);

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + customSurchargeTotal + Number(deliveryTip) - coinDiscount);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomerName(profile?.fullName || localStorage.getItem('user_name') || '');
      setCustomerPhone(profile?.phoneNumber || localStorage.getItem('user_phone') || '');
      setCustomerAddress(profile?.address || localStorage.getItem('user_address_line') || '');
      setCustomerCity(profile?.city || localStorage.getItem('user_city') || '');
      setCustomerPincode(profile?.pincode || localStorage.getItem('user_pincode') || '');
      if (profile?.latitude) setLatitude(profile.latitude);
      if (profile?.longitude) setLongitude(profile.longitude);
    }
  }, [profile]);

  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Not Supported", description: "Your device does not support high accuracy location." });
      return;
    }

    setIsValidatingLocation(true);
    
    // HIGH ACCURACY GPS OPTIONS
    const gpsOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0 // No cached data
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        validateAndSetCoords(lat, lng);
      },
      (error) => {
        setIsValidatingLocation(false);
        let errorMsg = "Permission Denied. Please enable location access in browser settings.";
        if (error.code === 2) errorMsg = "GPS is disabled. Please turn on location services.";
        if (error.code === 3) errorMsg = "GPS signal timeout. Please try again outside or near a window.";
        
        toast({ 
          variant: "destructive", 
          title: "Location Error", 
          description: errorMsg 
        });
      },
      gpsOptions
    );
  };

  const validateAndSetCoords = (lat: number, lng: number) => {
    const matchedZone = zones?.find(zone => isPointInPolygon(lat, lng, zone.boundary || []));
    
    if (matchedZone) {
      setLatitude(lat);
      setLongitude(lng);
      setCustomerCity(matchedZone.city || 'Local');
      setCustomerAddress(prev => prev || matchedZone.name);
      toast({ title: "Location Verified!", description: `Precision detected at ${matchedZone.name}` });
    } else {
      toast({ 
        variant: "destructive", 
        title: "Service Unavailable", 
        description: "Your live GPS position is outside our delivery area." 
      });
    }
    setIsValidatingLocation(false);
    setIsMapOpen(false);
  };

  const createOrderInFirestore = async () => {
    if (!firestore || isPlacing) return;
    setIsPlacing(true);

    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    const orderRef = doc(firestore, 'orders', orderId);

    const finalUid = user?.uid;
    if (!finalUid) {
      toast({ variant: "destructive", title: "Auth Error", description: "Please sign in again." });
      setIsPlacing(false);
      return;
    }
    
    const fullFinalAddress = `${customerAddress || ''}, ${customerCity || ''} - ${customerPincode || ''}`;
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
      deliveryTip: Number(deliveryTip) || 0,
      status: 'Placed',
      orderType: 'Delivery',
      paymentMethod: String(paymentMethod || 'online'),
      paymentStatus: 'Pending',
      address: String(fullFinalAddress),
      pincode: String(customerPincode || ''),
      instructions: String(instructions || ''),
      latitude: latitude,
      longitude: longitude,
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
        address: String(customerAddress),
        city: String(customerCity),
        pincode: String(customerPincode),
        latitude: latitude,
        longitude: longitude,
        updatedAt: serverTimestamp(),
        coins: increment(10 - coinsUsed) 
      };

      await updateDoc(userRef, userUpdateData);
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
    
    // Strict Manual Validation
    if (!customerName.trim()) {
      toast({ variant: "destructive", title: "Missing Name", description: "Please enter your full name." });
      return;
    }
    if (customerPhone.length !== 10 || customerPhone.startsWith('0')) {
      toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter a valid 10-digit number." });
      return;
    }
    if (!customerAddress.trim()) {
      toast({ variant: "destructive", title: "Missing Address", description: "Building and street details are required." });
      return;
    }
    if (!customerCity.trim()) {
      toast({ variant: "destructive", title: "Missing City", description: "Please enter your city." });
      return;
    }
    if (customerPincode.length !== 6) {
      toast({ variant: "destructive", title: "Invalid Pincode", description: "Please enter a valid 6-digit pincode." });
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
                    <div className="h-3.5 w-3.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5">
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

        {/* DELIVERY ADDRESS FORM WITH MAP PRECISION */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-bold text-gray-800">Delivery Details</h2>
            </div>
            {latitude && (
               <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                  <Navigation className="h-2.5 w-2.5 text-green-600" />
                  <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">GPS VERIFIED</span>
               </div>
            )}
          </div>

          <div className="space-y-4">
              <div className="flex gap-2">
                 <button 
                  onClick={handleUseGPS}
                  disabled={isValidatingLocation}
                  className="flex-1 h-12 bg-primary/5 border-2 border-primary/10 rounded-xl flex items-center justify-center gap-2 text-primary font-black uppercase text-[10px] active:scale-95 transition-all"
                 >
                   {isValidatingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                   USE HIGH ACCURACY GPS
                 </button>
                 <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                    <DialogTrigger asChild>
                      <button className="flex-1 h-12 bg-black/5 border-2 border-black/5 rounded-xl flex items-center justify-center gap-2 text-gray-700 font-black uppercase text-[10px] active:scale-95 transition-all">
                        <MapIcon className="h-4 w-4" />
                        PICK ON MAP
                      </button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm h-[500px] p-0 overflow-hidden border-none shadow-2xl">
                       <DialogHeader className="sr-only">
                          <DialogTitle>Select Delivery Location</DialogTitle>
                       </DialogHeader>
                       <MapPicker onConfirm={validateAndSetCoords} />
                    </DialogContent>
                 </Dialog>
              </div>

              <div className="space-y-3">
                <Input 
                  placeholder="Receiver's Full Name *" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                  className="h-12 rounded-xl bg-gray-50 border-none font-bold" 
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input 
                    placeholder="Pincode *" 
                    value={customerPincode} 
                    onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} 
                    className="h-12 rounded-xl bg-gray-50 border-none font-bold" 
                  />
                  <Input 
                    placeholder="City *" 
                    value={customerCity} 
                    onChange={e => setCustomerCity(e.target.value)} 
                    className="h-12 rounded-xl bg-gray-50 border-none font-bold" 
                  />
                </div>
                <Textarea 
                  placeholder="Flat / House / Building Details *" 
                  value={customerAddress} 
                  onChange={e => setCustomerAddress(e.target.value)} 
                  className="rounded-xl bg-gray-50 border-none font-medium min-h-[80px]" 
                />
                <Input 
                  placeholder="10 Digit Phone Number *" 
                  value={customerPhone} 
                  onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} 
                  className="h-12 rounded-xl bg-gray-50 border-none font-bold" 
                />
              </div>
          </div>
        </div>

        {/* DELIVERY TIP SECTION */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Bike className="h-5 w-5 text-primary" />
            <h4 className="text-sm font-bold text-gray-800">Add Delivery Tip</h4>
          </div>
          <p className="text-[10px] text-gray-500 mb-4 font-medium uppercase tracking-tight">Your tip goes directly to the delivery partner to support them.</p>
          <div className="flex flex-wrap gap-2">
            {[10, 20, 30, 40].map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setDeliveryTip(amount);
                  setIsCustomTipOpen(false);
                  setCustomTipValue('');
                }}
                className={cn(
                  "px-4 py-2 rounded-xl border-2 font-black text-xs transition-all active:scale-95",
                  deliveryTip === amount && !isCustomTipOpen ? "border-primary bg-primary/5 text-primary" : "border-gray-100 bg-gray-50 text-gray-600"
                )}
              >
                ₹{amount}
              </button>
            ))}
            <button
              onClick={() => {
                setIsCustomTipOpen(true);
                setDeliveryTip(0);
              }}
              className={cn(
                "px-4 py-2 rounded-xl border-2 font-black text-xs transition-all active:scale-95",
                isCustomTipOpen ? "border-primary bg-primary/5 text-primary" : "border-gray-100 bg-gray-50 text-gray-600"
              )}
            >
              Other
            </button>
            {deliveryTip > 0 && (
              <button 
                onClick={() => {
                  setDeliveryTip(0);
                  setIsCustomTipOpen(false);
                  setCustomTipValue('');
                }}
                className="ml-auto text-[10px] font-black text-red-500 uppercase tracking-widest"
              >
                Remove
              </button>
            )}
          </div>
          
          {isCustomTipOpen && (
            <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-black text-gray-400">₹</span>
                <Input 
                  type="number"
                  placeholder="Min ₹5"
                  value={customTipValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomTipValue(val);
                    const numVal = Number(val);
                    if (numVal >= 5) {
                      setDeliveryTip(numVal);
                    } else {
                      setDeliveryTip(0);
                    }
                  }}
                  className="pl-7 h-12 rounded-xl bg-gray-50 border-none font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
              {Number(customTipValue) > 0 && Number(customTipValue) < 5 && (
                <p className="text-[8px] text-red-500 font-black uppercase mt-1 ml-1">Minimum tip amount is ₹5</p>
              )}
            </div>
          )}
        </div>

        {/* BILL DETAILS SECTION */}
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
            
            {dynamic_charges.map((charge: any) => (
              <div key={charge.id} className="flex justify-between font-bold text-gray-400">
                <span>{charge.name} {charge.type === 'percentage' && `(${charge.value}%)`}</span>
                <span>₹{(Number(charge.calculatedAmount) || 0).toFixed(2)}</span>
              </div>
            ))}

            {Number(deliveryTip) > 0 && (
              <div className="flex justify-between font-black text-primary animate-in slide-in-from-bottom-2">
                <div className="flex items-center gap-1.5">
                   <Bike className="h-3.5 w-3.5" />
                   <span>Delivery Tip</span>
                </div>
                <span>₹{Number(deliveryTip).toFixed(2)}</span>
              </div>
            )}

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

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-6">
              <span className="text-sm">💳</span>
              <h4 className="text-sm font-bold text-gray-800">Pay Using</h4>
           </div>
           <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
              <label className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", paymentMethod === 'online' ? "border-green-500 bg-green-50/30" : "border-gray-100")}>
                <div className="flex items-center gap-3"><div className="bg-green-100 p-2 rounded-xl text-green-600"><CreditCard className="h-5 w-5" /></div><div><h5 className="text-xs font-bold text-gray-800">Online on Arrival</h5><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">UPI on delivery</p></div></div>
                <RadioGroupItem value="online" />
              </label>
              <label className={cn("flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer", paymentMethod === 'cash' ? "border-green-500 bg-green-50/30" : "border-gray-100")}>
                <div className="flex items-center gap-3"><div className="bg-gray-100 p-2 rounded-xl text-gray-600"><Banknote className="h-5 w-5" /></div><div><h5 className="text-xs font-bold text-gray-800">Pay with Cash</h5><p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Cash on delivery</p></div></div>
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
