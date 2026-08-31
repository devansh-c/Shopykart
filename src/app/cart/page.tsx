
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
  Navigation,
  User,
  Truck,
  ArrowRight,
  Package,
  Phone,
  ShieldCheck,
  Tag,
  PlusCircle,
  Star,
  Clock,
  Search,
  Gift,
  Info,
  CreditCard,
  Wallet,
  Banknote,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, increment, setDoc, query, where, limit } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';

const tipOptions = [
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
  { label: '20%', value: 20 },
  { label: 'Custom', value: 0 },
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
  const [gateCode, setGateCode] = useState('');
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [utrNumber, setUtrNumber] = useState('');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeAddress = typeof window !== 'undefined' ? (localStorage.getItem('user_address') || 'Set Location') : 'Set Location';
  const activeCustomerName = typeof window !== 'undefined' ? (localStorage.getItem('user_name') || 'Premium User') : 'Premium User';
  const activeCustomerPhone = typeof window !== 'undefined' ? (localStorage.getItem('user_phone') || '---') : '---';

  const tipAmount = useMemo(() => {
    if (!selectedTip) return 0;
    return Math.round((totalPrice * selectedTip) / 100);
  }, [totalPrice, selectedTip]);

  const finalTotal = useMemo(() => {
    return totalPrice + 40 + 5 + tipAmount; // Base + Delivery + Platform + Tip
  }, [totalPrice, tipAmount]);

  const handleOpenPicker = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  const handlePlaceOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    
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
        gateCode,
        items: cart,
        total: finalTotal, 
        status: 'Placed',
        paymentMethod: selectedPayment,
        customerOrderNumber,
        deliveryTip: tipAmount,
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
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Your bag is<br /><span className="text-primary">starving!</span></h2>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-4 mb-10 max-w-[200px]">Fill it with the best gourmet flavors in town.</p>
        <Button onClick={() => router.push('/')} className="w-full max-w-[240px] h-16 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-xl">START SHOPPING</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-44 transform-gpu text-[#0B0B0B]">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />

      {/* 1. STICKY HEADER */}
      <header className="bg-white border-b border-border/50 px-6 py-4 sticky top-0 z-[100] flex items-center justify-between shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-black uppercase tracking-tight italic">Checkout</h1>
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-emerald-600 uppercase tracking-widest">
              <Clock className="h-2.5 w-2.5" /> 25-35 MINS REMAINING
            </div>
          </div>
        </div>
        <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
           <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="max-w-md mx-auto space-y-6 pt-6 px-4">
        
        {/* 2. DELIVERY ADDRESS MODULE */}
        <section className="bg-white rounded-[2.5rem] overflow-hidden border border-border/60 shadow-sm transition-all hover:shadow-md">
           {/* Mini Map Preview */}
           <div className="h-32 w-full bg-muted relative group">
              <img src="https://picsum.photos/seed/map/600/200" className="w-full h-full object-cover grayscale opacity-80" alt="Delivery Spot" />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <div className="h-10 w-10 bg-emerald-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-xl animate-bounce">
                    <MapPin className="h-5 w-5 fill-white" />
                 </div>
              </div>
           </div>

           <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                 <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] block mb-1">Delivering To</span>
                    <h4 className="font-black text-lg text-gray-900 leading-tight uppercase italic">{activeCustomerName}</h4>
                    <p className="text-xs font-bold text-muted-foreground mt-1 line-clamp-1">{activeAddress}</p>
                 </div>
                 <button onClick={handleOpenPicker} className="bg-gray-50 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl border border-border shrink-0 active:scale-95 transition-all">EDIT</button>
              </div>

              <div className="relative group">
                 <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                 <Input 
                   placeholder="GATE CODE / DELIVERY INSTRUCTIONS" 
                   value={gateCode}
                   onChange={e => setGateCode(e.target.value.toUpperCase())}
                   className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold text-[10px] tracking-widest placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-emerald-500/20"
                 />
              </div>

              <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100/50">
                 <Clock className="h-5 w-5 text-emerald-600" />
                 <div>
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none block">Estimated Arrival</span>
                    <p className="text-sm font-black italic text-emerald-700">25 - 35 MINUTES</p>
                 </div>
              </div>
           </div>
        </section>

        {/* 3. ORDER SUMMARY (Collapsible) */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-border/60 overflow-hidden">
           <Accordion type="single" collapsible defaultValue="items">
              <AccordionItem value="items" className="border-none">
                 <AccordionTrigger className="px-8 py-6 hover:no-underline group">
                    <div className="flex items-center gap-4 text-left">
                       <div className="h-10 w-10 bg-[#0B0B0B] rounded-xl flex items-center justify-center text-white">
                          <ShoppingBag className="h-5 w-5" />
                       </div>
                       <div>
                          <h3 className="text-sm font-black uppercase tracking-tight italic">Order Summary</h3>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">{cart.length} ITEMS SELECTED</p>
                       </div>
                    </div>
                 </AccordionTrigger>
                 <AccordionContent className="px-8 pb-8 space-y-6">
                    {cart.map((item, i) => (
                      <div key={i} className="flex gap-4 items-center">
                         <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted border border-border/50 shrink-0">
                            <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-black uppercase tracking-tighter truncate leading-none">{item.name}</h4>
                            <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase italic">
                               {item.quantity} x ₹{item.price} {item.selectedOption && `• ${item.selectedOption.name}`}
                            </p>
                         </div>
                         <div className="flex items-center bg-gray-50 rounded-xl h-10 px-1 border border-border/40">
                            <button onClick={() => removeFromCart(item.id)} className="w-8 h-full flex items-center justify-center text-gray-400 hover:text-red-500"><Minus className="h-3 w-3 stroke-[3]" /></button>
                            <span className="w-4 text-center text-[10px] font-black italic">{item.quantity}</span>
                            <button onClick={() => addToCart({...item, quantity: 1})} className="w-8 h-full flex items-center justify-center text-gray-900 hover:text-emerald-500"><Plus className="h-3 w-3 stroke-[3]" /></button>
                         </div>
                      </div>
                    ))}
                    <button onClick={() => router.push('/')} className="w-full h-12 border-2 border-dashed border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2 hover:bg-gray-50 transition-all active:scale-95">
                       <PlusCircle className="h-4 w-4 text-emerald-500" /> ADD MORE ITEMS
                    </button>
                 </AccordionContent>
              </AccordionItem>
           </Accordion>
        </section>

        {/* 4. OFFERS & PROMO CODES */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-border/60 space-y-4">
           <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600 border border-emerald-100"><Tag className="h-5 w-5" /></div>
              <div>
                 <h4 className="text-sm font-black uppercase tracking-tight italic">Coupons & Offers</h4>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase">SAVE EXTRA ON THIS ORDER</p>
              </div>
           </div>

           <div className="flex gap-3">
              <div className="relative flex-1 group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
                 <input placeholder="APPLY PROMO CODE" className="w-full h-12 bg-gray-50 border border-border/50 rounded-xl pl-10 pr-4 text-[10px] font-black tracking-[0.2em] focus:outline-none focus:border-emerald-500/50 transition-all uppercase" />
              </div>
              <button className="bg-[#0B0B0B] text-white px-6 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">APPLY</button>
           </div>
           
           <div className="bg-emerald-50/50 px-4 py-3 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Badge className="bg-emerald-600 text-white border-none text-[7px] px-1.5 py-0 rounded uppercase font-black">Best Value</Badge>
                 <span className="text-[9px] font-bold text-emerald-700 uppercase">Welcome 10 Reward Applied</span>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
           </div>
        </section>

        {/* 5. TIP SELECTOR */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-border/60 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
              <Truck className="h-24 w-24" />
           </div>
           <div className="flex items-center gap-4 mb-6">
              <div className="bg-amber-100 p-3 rounded-2xl text-amber-600 border border-amber-200/50 shadow-inner"><Truck className="h-6 w-6" /></div>
              <div>
                 <h4 className="text-base font-black uppercase text-gray-900 tracking-tight italic">Support Your Partner</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">100% of this tip goes to the rider</p>
              </div>
           </div>
           <div className="flex gap-3 relative z-10">
              {tipOptions.map((tip) => (
                <button 
                  key={tip.label}
                  onClick={() => setSelectedTip(selectedTip === tip.value ? null : tip.value)}
                  className={cn(
                    "flex-1 h-14 rounded-2xl border-2 font-black italic text-xs transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm",
                    selectedTip === tip.value && tip.label !== 'Custom'
                      ? "bg-[#0B0B0B] border-[#0B0B0B] text-white shadow-2xl scale-105" 
                      : "bg-white border-gray-100 text-gray-600 hover:border-emerald-200"
                  )}
                >
                  {tip.label}
                </button>
              ))}
           </div>
           <p className="text-[8px] font-bold text-gray-400 uppercase text-center mt-6 tracking-widest leading-relaxed">
             Riders rely on your generous support for fuel and maintenance. 💚
           </p>
        </section>

        {/* 6. BILL DETAILS */}
        <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-border/60 space-y-6">
           <h3 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.5em] mb-4 text-center">FINANCIALS</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                 <span>Item Total</span>
                 <span className="text-gray-900 font-black">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                    <span>Delivery Fee</span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[8px] font-black uppercase tracking-tighter">ELITE FREE</Badge>
                 </div>
                 <span className="line-through text-gray-400">₹40</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                 <span>Taxes & Handling</span>
                 <span className="text-gray-900 font-black">₹40</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                 <span>Platform Fee</span>
                 <span className="text-gray-900 font-black">₹5</span>
              </div>
              {selectedTip !== null && selectedTip > 0 && (
                <div className="flex justify-between items-center text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                   <span>Rider Contribution</span>
                   <span className="text-emerald-600 font-black italic">₹{tipAmount}</span>
                </div>
              )}
              
              <div className="pt-8 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">TOTAL PAYABLE</span>
                    <span className="text-4xl font-black italic text-gray-900 tracking-tighter leading-none">₹{finalTotal}</span>
                 </div>
                 <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-600 uppercase leading-tight italic">Saved ₹40 today!</p>
                 </div>
              </div>
           </div>
        </section>

        {/* 7. PAYMENT METHOD SELECTOR */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-border/60 space-y-6">
           <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">PAYMENT CHOICE</h4>
              <Badge className="bg-[#0B0B0B] text-white border-none text-[8px] font-black uppercase tracking-widest">SECURE</Badge>
           </div>
           
           <div className="space-y-3">
              {[
                { id: 'upi', label: 'UPI / Google Pay', icon: Wallet, desc: 'Recommended', color: 'text-blue-500' },
                { id: 'card', label: 'Credit / Debit Cards', icon: CreditCard, desc: 'Visa, Master, Amex', color: 'text-purple-500' },
                { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Service charges apply', color: 'text-amber-600' }
              ].map((method) => (
                <button 
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={cn(
                    "w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all active:scale-[0.98] group",
                    selectedPayment === method.id ? "bg-emerald-50/50 border-emerald-500 shadow-inner" : "bg-gray-50 border-transparent hover:border-gray-200"
                  )}
                >
                   <div className="flex items-center gap-4 text-left">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                        selectedPayment === method.id ? "bg-emerald-500 text-white shadow-lg" : "bg-white text-gray-400 group-hover:text-emerald-500"
                      )}>
                         <method.icon className="h-6 w-6" />
                      </div>
                      <div>
                         <span className="text-sm font-black uppercase italic tracking-tight block leading-none">{method.label}</span>
                         <span className="text-[9px] font-bold text-muted-foreground uppercase">{method.desc}</span>
                      </div>
                   </div>
                   {selectedPayment === method.id && (
                     <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center text-white animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-4 w-4" />
                     </div>
                   )}
                </button>
              ))}
           </div>
        </section>

        {/* TRUST SIGNALS */}
        <div className="flex items-center justify-center gap-8 py-8 opacity-40 grayscale">
           <ShieldCheck className="h-8 w-8 text-emerald-600" />
           <ShoppingBag className="h-8 w-8 text-emerald-600" />
           <Truck className="h-8 w-8 text-emerald-600" />
        </div>

      </main>

      {/* 8. FIXED BOTTOM CTA */}
      <footer className="fixed bottom-0 left-0 right-0 z-[10000] bg-white/80 backdrop-blur-2xl border-t border-border/50 px-6 pt-5 pb-12 flex items-center justify-between shadow-[0_-25px_60px_rgba(0,0,0,0.1)]">
         <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
               <span className="text-2xl font-black italic text-gray-900 tracking-tighter">₹{finalTotal}</span>
               <span className="text-[9px] font-bold text-gray-400 uppercase">Total Bill</span>
            </div>
            <button className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1 underline underline-offset-4 decoration-emerald-200">View Detailed Bill</button>
         </div>
         
         <button 
           onClick={handlePlaceOrder}
           disabled={isPlacing}
           className="h-16 px-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[2rem] font-black uppercase italic text-sm shadow-[0_15px_30px_rgba(16,185,129,0.3)] active:scale-95 active:translate-y-1 transition-all flex items-center justify-center gap-3 transform-gpu border-b-4 border-emerald-800"
         >
           {isPlacing ? (
             <div className="flex items-center gap-3">
               <Loader2 className="h-5 w-5 animate-spin" />
               <span>Securing...</span>
             </div>
           ) : (
             <div className="flex items-center gap-3">
               <span>Place Order</span>
               <ArrowRight className="h-5 w-5 animate-pulse" />
             </div>
           )}
         </button>
      </footer>
    </div>
  );
}
