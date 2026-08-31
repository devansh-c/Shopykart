
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
  Navigation
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, GeoPoint, increment, setDoc, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const deliveryInstructions = [
  { id: 'no_bell', label: 'Avoid ringing bell', icon: BellOff },
  { id: 'leave_door', label: 'Leave at the door', icon: Package },
  { id: 'avoid_call', label: 'Avoid calling', icon: Phone },
];

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
  const [deliveryTime, setDeliveryTime] = useState('40-45 MIN');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // REAL-TIME DISTANCE CALCULATION FOR CART
  useEffect(() => {
    if (typeof window === 'undefined' || cart.length === 0) return;

    const userLat = localStorage.getItem('user_lat');
    const userLng = localStorage.getItem('user_lng');

    if (!userLat || !userLng) return;

    const calculateRealTimes = async () => {
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
        unitSystem: google.maps.UnitSystem.METRIC,
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
            setDeliveryTime(`${totalMins} MIN`);
          }
        }
      });
    };

    const timer = setTimeout(calculateRealTimes, 2000);
    return () => clearTimeout(timer);
  }, [cart, isMounted, firestore]);

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
    return query(collection(firestore, 'products'), where('isAvailable', '==', true), limit(10));
  }, [firestore]);
  const { data: generalProducts } = useCollection<any>(generalProductsQuery);

  const displayUpsell = useMemo(() => {
    if (upsellProducts && upsellProducts.length > 0) return upsellProducts;
    return generalProducts || [];
  }, [upsellProducts, generalProducts]);

  const activeAddress = typeof window !== 'undefined' ? localStorage.getItem('user_address') : 'Set Location';
  const activeCustomerName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : 'Guest';
  const activeCustomerPhone = typeof window !== 'undefined' ? localStorage.getItem('user_phone') : '---';

  const finalTotal = useMemo(() => {
    return totalPrice + 40 + (selectedTip || 0);
  }, [totalPrice, selectedTip]);

  const toggleInstruction = (id: string) => {
    setSelectedInstructions(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

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
        customerName: activeCustomerName?.toUpperCase() || 'PREMIUM USER',
        address: localStorage.getItem('user_address_line') || localStorage.getItem('user_address') || 'No Address',
        customerLocation: lat ? new GeoPoint(parseFloat(lat), parseFloat(lng || '0')) : null,
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
      <div className="min-h-screen bg-[#F5F6F8] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-6">
           <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto"><ShoppingBag className="h-10 w-10 text-gray-300" /></div>
           <h2 className="text-2xl font-black italic uppercase text-gray-800">Your bag is empty</h2>
           <Button onClick={() => router.push('/')} className="w-full h-14 bg-[#00843D] rounded-2xl font-black uppercase italic">EXPLORE MENU</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-44 transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />

      {/* PIXEL-PERFECT HEADER MATCH */}
      <header className="bg-gradient-to-b from-[#00843D] to-[#00843D]/95 pt-8 pb-10 px-4 sticky top-0 z-[100] shadow-lg">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="mt-1 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-90 transition-transform">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <div className="flex-1 min-w-0">
             <button 
               onClick={handleOpenPicker}
               className="text-left w-full active:opacity-70 transition-opacity focus:outline-none"
             >
                <div className="flex items-center gap-1.5 mb-1">
                  <h1 className="text-lg font-black text-white leading-none uppercase tracking-tight truncate">{cart[0]?.restaurantName || 'ShopyKart'}</h1>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-white/80 uppercase tracking-widest italic">
                   <Navigation className="h-3 w-3 text-white/60" />
                   <span>{deliveryTime} to {activeCustomerName} | {activeAddress}</span>
                   <ChevronDown className="h-3 w-3 text-white/60 ml-0.5" />
                </div>
             </button>
          </div>
        </div>
      </header>

      <main className="relative -mt-6 bg-[#F5F6F8] rounded-t-[2.5rem] px-4 space-y-4 pt-6">
        
        {/* ORDERING FOR SOMEONE ELSE CARD */}
        <div className="bg-white rounded-[1.75rem] p-5 flex items-center justify-between border border-border/40 shadow-sm relative overflow-hidden">
           <div className="flex-1 pr-10">
              <h4 className="font-black text-sm text-gray-800 uppercase tracking-tight">You are ordering for {activeCustomerName} 🎁</h4>
              <p className="text-[10px] font-medium text-gray-500 leading-tight mt-1">
                We will share order tracking and delivery <br />communication on {activeCustomerPhone}
              </p>
           </div>
           <button className="text-[#E91E63] font-black text-xs uppercase tracking-widest shrink-0 active:scale-95 transition-all">EDIT</button>
        </div>

        {/* HIGH DEMAND BANNER */}
        <div className="bg-white rounded-[1.75rem] p-4 pr-20 flex items-center gap-4 relative border border-border/40 shadow-sm">
           <div className="flex-1">
              <p className="text-[11px] font-black text-gray-500 leading-tight uppercase italic opacity-80">
                High demand in your area! Delivery time slightly higher than usual. Thanks for your patience!
              </p>
           </div>
           <div className="absolute right-4 top-1/2 -translate-y-1/2 h-14 w-14">
              <img src="https://picsum.photos/seed/delivery/200/200" className="h-full w-full object-contain" alt="" />
           </div>
        </div>

        {/* ITEMS LIST */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/40 space-y-6">
           {cart.map((item, i) => (
             <div key={i} className="flex items-start justify-between gap-4">
                <div className="flex gap-2">
                   <div className="mt-1 h-3.5 w-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 shrink-0"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                   <div>
                      <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight leading-tight">{item.name}</h4>
                      <p className="text-[9px] font-bold text-gray-400 mt-1 line-clamp-1 italic uppercase">{item.selectedOption?.name || 'Default Configuration'} <ChevronDown className="h-2.5 w-2.5 inline ml-0.5" /></p>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center border-2 border-gray-100 rounded-xl h-9 px-1 bg-gray-50/30">
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-full flex items-center justify-center text-gray-400"><Minus className="h-3 w-3 stroke-[3]" /></button>
                      <span className="w-6 text-center text-xs font-black italic">{item.quantity}</span>
                      <button onClick={() => addToCart({...item, quantity: 1})} className="w-8 h-full flex items-center justify-center text-gray-900"><Plus className="h-3 w-3 stroke-[3]" /></button>
                   </div>
                   <span className="text-sm font-black text-gray-900 w-10 text-right italic">₹{item.price * item.quantity}</span>
                </div>
             </div>
           ))}

           <div className="flex gap-3 pt-2">
              <button onClick={() => router.push('/')} className="flex-1 h-11 border-2 border-gray-100 rounded-2xl text-gray-800 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm flex items-center justify-center gap-1.5"><Plus className="h-3 w-3" /> Add Items</button>
              <button className="flex-1 h-11 border-2 border-gray-100 rounded-2xl text-gray-800 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm flex items-center justify-center gap-1.5"><Pencil className="h-3 w-3" /> Cooking requests</button>
           </div>
        </div>

        {/* COMPLETE YOUR MEAL */}
        {displayUpsell.length > 0 && (
          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/40">
            <h3 className="text-[11px] font-black uppercase text-gray-400 tracking-[0.2em] mb-5">COMPLETE YOUR MEAL</h3>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                {displayUpsell.map((item: any) => (
                  <div key={item.id} className="min-w-[100px] flex flex-col gap-2 relative group">
                    <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-gray-100 bg-muted">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                        <button 
                          onClick={() => {
                            addToCart({ ...item, quantity: 1 });
                            toast({ title: "Added" });
                          }}
                          className="absolute top-1 right-1 h-7 w-7 bg-white rounded-full shadow-lg flex items-center justify-center text-[#E91E63] active:scale-90 transition-all"
                        >
                          <Plus className="h-4 w-4 stroke-[4]" />
                        </button>
                    </div>
                    <div className="px-0.5">
                        <div className="flex items-center gap-1 mb-0.5">
                          <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                          <h5 className="text-[10px] font-black text-gray-800 truncate uppercase tracking-tighter">{item.name}</h5>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <span className="text-[10px] font-black text-gray-900 italic">₹{item.price}</span>
                           <span className="text-[8px] font-bold text-gray-300 line-through">₹{item.price + 20}</span>
                        </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* OFFERS ACCORDION */}
        <div className="bg-white rounded-[1.75rem] p-5 flex items-center justify-between border border-border/40 shadow-sm cursor-pointer active:bg-gray-50 transition-colors">
           <div className="flex items-center gap-4">
              <div className="bg-green-600 p-2 rounded-lg"><Tag className="h-5 w-5 text-white" /></div>
              <span className="text-sm font-black uppercase tracking-tight text-gray-800">Payment offers & more</span>
           </div>
           <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>

        {/* DELIVERY INSTRUCTIONS ACCORDION */}
        <div className="bg-white rounded-[1.75rem] shadow-sm border border-border/40 overflow-hidden">
           <div className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="bg-green-600 p-2 rounded-lg text-white"><Pencil className="h-5 w-5" /></div>
                 <span className="text-sm font-black uppercase tracking-tight text-gray-800">Add Delivery Instructions</span>
              </div>
              <ChevronUp className="h-5 w-5 text-gray-400" />
           </div>
           <div className="px-5 pb-6">
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {deliveryInstructions.map((inst) => (
                  <button 
                    key={inst.id}
                    onClick={() => toggleInstruction(inst.id)}
                    className={cn(
                      "min-w-[100px] h-24 rounded-3xl border-2 flex flex-col items-center justify-center gap-3 transition-all active:scale-95",
                      selectedInstructions.includes(inst.id) ? "bg-green-50 border-green-600 text-green-700" : "bg-gray-50 border-transparent text-gray-400"
                    )}
                  >
                    <inst.icon className="h-6 w-6" />
                    <span className="text-[9px] font-black uppercase text-center leading-tight tracking-tighter">{inst.label}</span>
                  </button>
                ))}
              </div>
           </div>
        </div>

        {/* BILL SUMMARY */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-border/40 space-y-5">
           <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em] mb-4">Detailed Bill Summary</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                 <span>Item Total</span>
                 <span>₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                 <div className="flex items-center gap-2">
                    <span>Delivery Fee</span>
                    <Badge className="bg-green-50 text-green-600 border-none text-[8px] font-black uppercase">FREE</Badge>
                 </div>
                 <span className="line-through">₹40</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-gray-600 uppercase">
                 <span>Handling Charges</span>
                 <span>₹40</span>
              </div>
              <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                 <span className="text-xl font-black italic uppercase tracking-tighter">Grand Total</span>
                 <span className="text-2xl font-black italic text-gray-900 tracking-tighter">₹{finalTotal}</span>
              </div>
           </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 px-6 pt-4 pb-10 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className="flex flex-col">
            <span className="text-2xl font-black italic text-gray-900 leading-none">₹{finalTotal}</span>
            <button className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">View Detailed Bill</button>
         </div>
         <button 
           onClick={handlePlaceOrder}
           disabled={isPlacing}
           className="h-16 px-12 bg-[#00843D] hover:bg-[#006a31] text-white rounded-[1.5rem] font-black uppercase italic text-sm shadow-xl shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-3"
         >
           {isPlacing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Proceed to Pay'}
         </button>
      </footer>

      {/* PAYMENT DIALOG */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-[2.5rem] max-w-sm p-8 focus:outline-none border-none shadow-3xl bg-white bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="h-20 w-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-[#00843D] border border-green-100 shadow-inner">
                  <CheckCircle2 className="h-10 w-10 animate-pulse" />
               </div>
               <div className="space-y-2">
                 <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Secure Payment</DialogTitle>
                 <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pay ₹{finalTotal} to proceed</DialogDescription>
               </div>
               
               <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 w-full flex flex-col items-center gap-6">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${finalTotal}&cu=INR`)}`} className="h-48 w-48 grayscale contrast-125" alt="QR" />
                  <span className="text-[10px] font-black uppercase text-[#00843D] animate-pulse">Scan via any UPI App</span>
               </div>

               <div className="w-full space-y-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-gray-400 uppercase ml-1">Enter 12-Digit UTR</label>
                     <Input 
                      placeholder="0000 0000 0000" 
                      value={utrNumber}
                      onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0,12))}
                      className="h-16 rounded-2xl bg-gray-50 border-none font-black text-2xl text-center tracking-[0.2em] italic"
                     />
                  </div>
                  <Button 
                    onClick={handlePlaceOrder}
                    disabled={utrNumber.length !== 12 || isPlacing}
                    className="w-full h-16 bg-black hover:bg-[#00843D] text-white rounded-2xl font-black uppercase italic text-lg shadow-xl"
                  >
                    {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFY & PAY'}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
