'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  ShoppingBag, 
  Loader2, 
  MapPin, 
  ChevronDown,
  Info,
  Utensils,
  PlusCircle,
  MessageSquare,
  Ticket,
  Clock,
  CheckCircle2,
  Package,
  Bike,
  Smartphone,
  Check,
  Phone,
  BellOff,
  AlertCircle,
  Pencil,
  Tag,
  ChevronUp,
  Navigation,
  ShieldCheck,
  Zap,
  Coins,
  History,
  Star,
  User,
  Truck,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, GeoPoint, increment, setDoc, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { cn, slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const deliveryInstructions = [
  { id: 'no_bell', label: 'No Bell', icon: BellOff },
  { id: 'leave_door', label: 'Door Drop', icon: Package },
  { id: 'avoid_call', label: 'Quiet Mode', icon: Phone },
  { id: 'guard', label: 'Security', icon: ShieldCheck },
];

const tipOptions = [20, 30, 50, 100];

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [deliveryTime, setDeliveryTime] = useState('25-30 MIN');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // WORLD-CLASS: Real-time Distance Matrix Calculation
  useEffect(() => {
    if (typeof window === 'undefined' || cart.length === 0) return;

    const userLat = localStorage.getItem('user_lat');
    const userLng = localStorage.getItem('user_lng');

    if (!userLat || !userLng) return;

    const calculateLogistics = async () => {
      if (typeof google === 'undefined' || !google.maps) return;

      const service = new google.maps.DistanceMatrixService();
      const origin = new google.maps.LatLng(parseFloat(userLat), parseFloat(userLng));
      
      const vendorIds = Array.from(new Set(cart.map(item => item.vendorId).filter(Boolean)));
      if (vendorIds.length === 0) return;

      const destinationCoords: google.maps.LatLng[] = [];
      
      for (const vId of vendorIds.slice(0, 5)) {
        try {
          const vSnap = await getDoc(doc(firestore!, 'vendors', vId as string));
          if (vSnap.exists()) {
            const vData = vSnap.data();
            if (vData.lat && vData.lng) {
              destinationCoords.push(new google.maps.LatLng(vData.lat, vData.lng));
            }
          }
        } catch (e) {}
      }

      if (destinationCoords.length === 0) return;

      service.getDistanceMatrix({
        origins: [origin],
        destinations: destinationCoords,
        travelMode: google.maps.TravelMode.DRIVING,
      }, (response, status) => {
        if (status === 'OK' && response && response.rows[0]) {
          let maxMins = 0;
          response.rows[0].elements.forEach((element) => {
            if (element.status === 'OK') {
              const mins = Math.ceil(element.duration.value / 60);
              if (mins > maxMins) maxMins = mins;
            }
          });
          
          if (maxMins > 0) {
            const totalMins = maxMins + 12; // 12 min prep time
            setDeliveryTime(`${totalMins}-${totalMins + 5} MIN`);
          }
        }
      });
    };

    const timer = setTimeout(calculateLogistics, 1500);
    return () => clearTimeout(timer);
  }, [cart, isMounted, firestore]);

  // SMART ENGINE: Fetch Highest Rated Store for Upsell
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), where('isOnline', '==', true), orderBy('rating', 'desc'), limit(5));
  }, [firestore]);
  const { data: topVendors } = useCollection<any>(vendorsQuery);

  const bestVendorId = useMemo(() => topVendors?.[0]?.id || null, [topVendors]);

  const upsellQuery = useMemoFirebase(() => {
    if (!firestore || !bestVendorId) return null;
    return query(
      collection(firestore, 'products'), 
      where('vendorId', '==', bestVendorId),
      where('isAvailable', '==', true),
      limit(10)
    );
  }, [firestore, bestVendorId]);
  const { data: upsellProducts } = useCollection<any>(upsellQuery);

  const generalProductsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('isAvailable', '==', true), limit(15));
  }, [firestore]);
  const { data: generalProducts } = useCollection<any>(generalProductsQuery);

  const displayUpsell = useMemo(() => {
    if (upsellProducts && upsellProducts.length > 0) return upsellProducts;
    return generalProducts || [];
  }, [upsellProducts, generalProducts]);

  const activeAddress = typeof window !== 'undefined' ? (localStorage.getItem('user_address') || 'Set Location') : 'Set Location';
  const activeCustomerName = typeof window !== 'undefined' ? (localStorage.getItem('user_name') || 'Premium User') : 'Premium User';
  const activeCustomerPhone = typeof window !== 'undefined' ? (localStorage.getItem('user_phone') || '---') : '---';

  const finalTotal = useMemo(() => {
    return totalPrice + 40 + (selectedTip || 0);
  }, [totalPrice, selectedTip]);

  const handleOpenPicker = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  const handlePlaceOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    if (!utrNumber) { setIsPaymentDialogOpen(true); return; }

    setIsPlacing(true);
    try {
      const lat = localStorage.getItem('user_lat');
      const lng = localStorage.getItem('user_lng');
      const pincode = localStorage.getItem('active_zone_pincode') || '284205';
      
      const q = query(collection(firestore!, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const customerOrderNumber = countSnap.data().count + 1;

      const orderData = {
        userId: user.uid,
        customerName: activeCustomerName.toUpperCase(),
        customerPhone: activeCustomerPhone,
        address: localStorage.getItem('user_address_line') || activeAddress,
        customerLat: lat ? parseFloat(lat) : null,
        customerLng: lng ? parseFloat(lng) : null,
        pincode: pincode,
        items: cart,
        total: finalTotal, 
        status: 'Placed',
        paymentMethod: 'online',
        utrNumber,
        customerOrderNumber,
        deliveryTip: selectedTip || 0,
        instructions: selectedInstructions,
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        pickupOTP: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        restaurantName: cart[0]?.restaurantName || 'ShopyKart'
      };

      await addDoc(collection(firestore!, 'orders'), orderData);
      await setDoc(doc(firestore!, 'users', user.uid), { coins: increment(10) }, { merge: true });

      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace(`/order/track/#${customerOrderNumber}`); }, 1500);
    } catch (e) {
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacing(false);
    }
  };

  if (!isMounted) return null;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20 scale-150" />
           <div className="relative h-32 w-32 bg-gray-50 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-2xl">
              <ShoppingBag className="h-14 w-14 text-gray-200" />
           </div>
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Your cart is<br /><span className="text-primary">starving!</span></h2>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-4 mb-10 max-w-[200px]">Fill it with the best gourmet flavors in town.</p>
        <Button onClick={() => router.push('/')} className="w-full max-w-[240px] h-16 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-xl shadow-gray-200">START SHOPPING</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-44 transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />

      {/* WORLD-CLASS GLASSMORPHIC HEADER */}
      <header className="bg-gradient-to-br from-[#00843D] via-[#006a31] to-[#004d1f] pt-10 pb-12 px-6 sticky top-0 z-[100] shadow-[0_20px_50px_rgba(0,132,61,0.2)]">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 h-12 w-12 flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 active:scale-90 transition-all">
            <ChevronLeft className="h-7 w-7 text-white" />
          </button>
          <div className="flex-1 min-w-0">
             <button 
               onClick={handleOpenPicker}
               className="text-left w-full active:opacity-70 transition-opacity focus:outline-none"
             >
                <h1 className="text-2xl font-black text-white leading-none uppercase tracking-tighter truncate drop-shadow-lg">
                  Deliver to <span className="text-primary-foreground underline underline-offset-4 decoration-white/30">{activeCustomerName}</span>
                </h1>
                <div className="flex items-center gap-2 text-[10px] font-black text-white/80 uppercase tracking-widest italic mt-2">
                   <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                      <Clock className="h-3 w-3 text-white" />
                      <span>{deliveryTime}</span>
                   </div>
                   <span className="truncate flex-1">{activeAddress}</span>
                   <ChevronDown className="h-3 w-3 text-white/60 shrink-0" />
                </div>
             </button>
          </div>
        </div>
      </header>

      <main className="relative -mt-6 bg-[#F9FAFB] rounded-t-[3rem] px-4 space-y-5 pt-8">
        
        {/* RECIPIENT IDENTITY CARD */}
        <div className="bg-white rounded-[2.5rem] p-6 flex items-center justify-between border border-border/60 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <User className="h-20 w-20 -rotate-12" />
           </div>
           <div className="flex-1 pr-8 relative z-10">
              <h4 className="font-black text-base text-gray-900 uppercase tracking-tight italic">Recipient: {activeCustomerName} 🎁</h4>
              <p className="text-[10px] font-bold text-muted-foreground leading-tight mt-1 uppercase tracking-widest">
                Status updates will be sent to {activeCustomerPhone}
              </p>
           </div>
           <button onClick={handleOpenPicker} className="bg-rose-50 text-[#E91E63] font-black text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl border border-rose-100 shrink-0 active:scale-95 transition-all shadow-sm">EDIT</button>
        </div>

        {/* LOGISTICS STATUS BANNER */}
        <div className="bg-white rounded-[2.5rem] p-5 flex items-center gap-5 relative border border-border/60 shadow-sm overflow-hidden">
           <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-inner">
              <Navigation className="h-8 w-8 text-blue-600 animate-pulse" />
           </div>
           <div className="flex-1">
              <p className="text-xs font-black text-gray-700 leading-tight uppercase italic opacity-90">
                High demand in your zone! Our elite fleet is prioritizing fresh deliveries. 🚀
              </p>
           </div>
           <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 opacity-10">
              <Truck className="h-24 w-24 text-gray-300" />
           </div>
        </div>

        {/* ELITE ITEMS CONTAINER */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-border/60 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.4em]">YOUR SELECTION</h3>
              <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[8px]">{cart.length} ITEMS</Badge>
           </div>
           
           {cart.map((item, i) => (
             <div key={i} className="flex items-start justify-between gap-6 pb-6 border-b border-gray-50 last:border-0 last:pb-0 group">
                <div className="flex gap-4 flex-1">
                   <div className="mt-1 h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 shrink-0"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                   <div className="min-w-0">
                      <h4 className="font-black text-lg text-gray-900 uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">{item.name}</h4>
                      <p className="text-[10px] font-black text-muted-foreground mt-2 line-clamp-1 italic uppercase tracking-widest">{item.selectedOption?.name || 'Chef Default'} <ChevronDown className="h-3 w-3 inline ml-0.5 opacity-50" /></p>
                   </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                   <div className="flex items-center bg-gray-50 border-2 border-gray-100 rounded-2xl h-11 px-1 shadow-inner">
                      <button onClick={() => removeFromCart(item.id)} className="w-10 h-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"><Minus className="h-4 w-4 stroke-[3]" /></button>
                      <span className="w-6 text-center text-sm font-black italic">{item.quantity}</span>
                      <button onClick={() => addToCart({...item, quantity: 1})} className="w-10 h-full flex items-center justify-center text-gray-900 hover:text-green-600 transition-colors"><Plus className="h-4 w-4 stroke-[3]" /></button>
                   </div>
                   <span className="text-base font-black text-gray-900 italic tracking-tighter">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
             </div>
           ))}

           <div className="flex gap-3 pt-4">
              <button onClick={() => router.push('/')} className="flex-1 h-14 border-2 border-gray-100 rounded-2xl text-gray-900 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"><PlusCircle className="h-4 w-4 text-primary" /> Add More</button>
              <button className="flex-1 h-14 border-2 border-gray-100 rounded-2xl text-gray-900 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"><Pencil className="h-4 w-4 text-primary" /> Notes</button>
           </div>
        </div>

        {/* INTELLIGENT UPSELL: COMPLETE YOUR MEAL */}
        {displayUpsell.length > 0 && (
          <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-border/60">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.4em]">COMPLETE YOUR MEAL</h3>
              <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                 <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                 <span className="text-[8px] font-black text-amber-700 uppercase">Top Rated Choice</span>
              </div>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {displayUpsell.map((item: any) => (
                  <div key={item.id} className="min-w-[120px] flex flex-col gap-3 relative">
                    <div className="relative h-28 w-28 rounded-[2rem] overflow-hidden border-2 border-gray-50 bg-muted shadow-md group">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                        <button 
                          onClick={() => {
                            addToCart({ ...item, quantity: 1 });
                            toast({ title: "Added to Bag" });
                          }}
                          className="absolute bottom-2 right-2 h-9 w-9 bg-white rounded-full shadow-2xl flex items-center justify-center text-[#E91E63] active:scale-90 transition-all border border-pink-50"
                        >
                          <Plus className="h-5 w-5 stroke-[4]" />
                        </button>
                    </div>
                    <div className="px-1">
                        <h5 className="text-[11px] font-black text-gray-800 truncate uppercase tracking-tighter italic">{item.name}</h5>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className="text-xs font-black text-gray-900 italic">₹{item.price}</span>
                           <span className="text-[9px] font-bold text-gray-300 line-through">₹{item.price + 20}</span>
                        </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* LOGISTICS INSTRUCTIONS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-border/60 overflow-hidden">
           <div className="p-6 flex items-center justify-between border-b border-gray-50">
              <div className="flex items-center gap-4">
                 <div className="bg-primary/5 p-3 rounded-2xl text-primary border border-primary/10"><Navigation className="h-5 w-5" /></div>
                 <h4 className="text-sm font-black uppercase tracking-tight text-gray-900 italic">Drop-off Instructions</h4>
              </div>
           </div>
           <div className="px-6 py-8">
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {deliveryInstructions.map((inst) => (
                  <button 
                    key={inst.id}
                    onClick={() => {
                      setSelectedInstructions(prev => 
                        prev.includes(inst.id) ? prev.filter(i => i !== inst.id) : [...prev, inst.id]
                      );
                    }}
                    className={cn(
                      "min-w-[100px] h-28 rounded-3xl border-2 flex flex-col items-center justify-center gap-4 transition-all active:scale-95 transform-gpu",
                      selectedInstructions.includes(inst.id) 
                        ? "bg-primary/5 border-primary text-primary shadow-xl shadow-primary/5" 
                        : "bg-gray-50 border-transparent text-gray-400"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                      selectedInstructions.includes(inst.id) ? "bg-primary text-white" : "bg-white text-gray-300"
                    )}>
                       <inst.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-center leading-tight tracking-[0.1em]">{inst.label}</span>
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* RIDER GRATITUDE TIP */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-border/60 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
              <Bike className="h-24 w-24" />
           </div>
           <div className="flex items-center gap-4 mb-8">
              <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 border border-amber-200/50 shadow-inner"><Bike className="h-6 w-6" /></div>
              <div>
                 <h4 className="text-base font-black uppercase text-gray-900 tracking-tight italic">Support Your Partner</h4>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">100% of this tip goes to the rider</p>
              </div>
           </div>
           <div className="flex gap-4 relative z-10">
              {tipOptions.map((tip) => (
                <button 
                  key={tip}
                  onClick={() => setSelectedTip(selectedTip === tip ? null : tip)}
                  className={cn(
                    "flex-1 h-14 rounded-2xl border-2 font-black italic text-sm transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm",
                    selectedTip === tip 
                      ? "bg-[#0B0B0B] border-[#0B0B0B] text-white shadow-2xl scale-105" 
                      : "bg-white border-gray-100 text-gray-600 hover:border-amber-200"
                  )}
                >
                  ₹{tip}
                </button>
              ))}
           </div>
        </div>

        {/* TRUST & SAFETY STACK */}
        <div className="bg-[#0B0B0B] rounded-[3rem] p-8 shadow-2xl border border-white/5 space-y-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 h-full w-32 bg-white/5 -skew-x-12 translate-x-10 pointer-events-none" />
           <div className="flex items-center gap-4 relative z-10">
              <div className="bg-green-500/20 p-2.5 rounded-xl border border-green-500/20"><ShieldCheck className="h-6 w-6 text-green-500" /></div>
              <h4 className="text-sm font-black uppercase italic text-white tracking-widest">ShopyKart Safety Standard</h4>
           </div>
           <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-bold text-gray-400 uppercase">Temp. Checks</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[9px] font-bold text-gray-400 uppercase">Daily Sanitized</span>
              </div>
           </div>
        </div>

        {/* FINANCIAL SUMMARY */}
        <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-border/60 space-y-6">
           <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.5em] mb-4 text-center">FINANCIALS</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-widest">
                 <span>Item Total</span>
                 <span className="text-gray-900 font-black">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                    <span>Logistics Fee</span>
                    <Badge className="bg-green-50 text-green-700 border-none text-[8px] font-black uppercase tracking-tighter">ELITE FREE</Badge>
                 </div>
                 <span className="line-through text-gray-400">₹40</span>
              </div>
              {selectedTip && (
                <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-widest">
                   <span>Partner Gratitude</span>
                   <span className="text-amber-600 font-black italic">₹{selectedTip}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase tracking-widest">
                 <span>Taxes & Handling</span>
                 <span className="text-gray-900 font-black">₹40</span>
              </div>
              
              <div className="pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">TOTAL PAYABLE</span>
                    <span className="text-4xl font-black italic text-gray-900 tracking-tighter leading-none">₹{finalTotal}</span>
                 </div>
                 <div className="bg-green-50 px-4 py-2 rounded-2xl border border-green-100">
                    <p className="text-[9px] font-black text-green-600 uppercase leading-tight italic">Saved ₹40 on this order!</p>
                 </div>
              </div>
           </div>
        </div>

      </main>

      {/* WORLD-CLASS STICKY ACTION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-[10000] bg-white/80 backdrop-blur-2xl border-t border-gray-100 px-6 pt-5 pb-12 flex items-center justify-between shadow-[0_-25px_60px_rgba(0,0,0,0.1)]">
         <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black italic text-gray-900 tracking-tighter">₹{finalTotal}</span>
               <span className="text-[9px] font-bold text-gray-400 uppercase">all incl.</span>
            </div>
            <button className="text-[10px] font-black text-[#E91E63] uppercase tracking-widest mt-1 underline underline-offset-4 decoration-pink-200">View Detailed Bill</button>
         </div>
         
         <button 
           onClick={handlePlaceOrder}
           disabled={isPlacing}
           className="h-16 px-14 bg-[#00843D] hover:bg-[#006a31] text-white rounded-[2rem] font-black uppercase italic text-sm shadow-[0_15px_30px_rgba(0,132,61,0.3)] active:scale-95 active:translate-y-1 transition-all flex items-center justify-center gap-3 transform-gpu border-b-4 border-[#004d1f]"
         >
           {isPlacing ? (
             <div className="flex items-center gap-3">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span>Securing...</span>
             </div>
           ) : (
             <div className="flex items-center gap-3">
               <span>Proceed to Pay</span>
               <ArrowRight className="h-5 w-5 animate-pulse" />
             </div>
           )}
         </button>
      </footer>

      {/* LUXURY PAYMENT OVERLAY */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-t-[3.5rem] sm:rounded-[3.5rem] max-w-sm p-0 overflow-hidden border-none shadow-3xl bg-white bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2 focus:outline-none">
            <div className="h-2 w-full bg-[#00843D]" />
            <div className="p-10 space-y-8 flex flex-col items-center text-center">
               <div className="relative">
                  <div className="absolute inset-0 bg-green-50 rounded-[2.5rem] animate-pulse scale-110" />
                  <div className="relative h-24 w-24 bg-white rounded-[2.5rem] flex items-center justify-center text-[#00843D] border-4 border-green-50 shadow-2xl">
                    <ShieldCheck className="h-12 w-12" />
                  </div>
               </div>
               
               <div className="space-y-2">
                 <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Complete<br />Security.</DialogTitle>
                 <DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground pt-1">Verify payment to release order</DialogDescription>
               </div>
               
               <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 w-full flex flex-col items-center gap-6 shadow-inner relative group">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${finalTotal}&cu=INR`)}`} 
                    className="h-52 w-52 grayscale contrast-125 group-hover:scale-105 transition-transform duration-500" 
                    alt="Scan UPI" 
                    crossOrigin="anonymous" 
                  />
                  <div className="absolute inset-0 border-4 border-[#00843D]/5 rounded-[2.5rem] pointer-events-none" />
                  <span className="text-[10px] font-black uppercase text-[#00843D] animate-pulse tracking-widest italic">Wait for payment screen</span>
               </div>

               <div className="w-full space-y-6">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Unique Transaction ID (12 Digit UTR)</label>
                     <Input 
                      placeholder="0000 0000 0000" 
                      value={utrNumber}
                      onChange={e => setOtpValue(e.target.value.replace(/\D/g,'').slice(0,12))}
                      className="h-16 rounded-2xl bg-gray-50 border-none font-black text-3xl text-center tracking-[0.2em] italic focus-visible:ring-1 focus-visible:ring-green-500/20"
                     />
                  </div>
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={utrNumber.length !== 12 || isPlacing}
                    className="w-full h-20 bg-[#0B0B0B] hover:bg-[#00843D] text-white rounded-[2rem] font-black uppercase italic text-xl shadow-2xl active:scale-95 transition-all border-b-4 border-gray-800"
                  >
                    {isPlacing ? <Loader2 className="h-7 w-7 animate-spin" /> : 'AUTHENTICATE & PAY'}
                  </Button>
               </div>
               
               <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">ShopyKart Secure Gateway</p>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function setOtpValue(val: string) {
  // Helper for input handler to prevent scoping issues
  const el = document.querySelector('input[placeholder="0000 0000 0000"]') as HTMLInputElement;
  if(el) {
    const event = new Event('input', { bubbles: true });
    el.value = val;
    el.dispatchEvent(event);
  }
}
