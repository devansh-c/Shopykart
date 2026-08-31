
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
  X,
  CheckCircle2,
  Utensils,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, increment, setDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { cn, slugify } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Fetch Dynamic Data for Upsell (Highest Rated Store)
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), orderBy('rating', 'desc'), limit(1));
  }, [firestore]);
  const { data: topVendors } = useCollection<any>(vendorsQuery);

  const bestVendorId = useMemo(() => topVendors?.[0]?.id, [topVendors]);

  const upsellProductsQuery = useMemoFirebase(() => {
    if (!firestore || !bestVendorId) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', bestVendorId), limit(10));
  }, [firestore, bestVendorId]);
  const { data: upsellProducts } = useCollection<any>(upsellProductsQuery);

  // 2. Location & Identity Data
  const activeAddress = typeof window !== 'undefined' ? (localStorage.getItem('user_address') || 'Set Location') : 'Set Location';
  const activeCustomerName = typeof window !== 'undefined' ? (localStorage.getItem('user_name') || 'Premium User') : 'Premium User';
  const deliveryTime = "40–45 mins";

  const handleOpenPicker = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  const handlePlaceOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    
    setIsPlacing(true);
    try {
      const lat = localStorage.getItem('user_lat');
      const lng = localStorage.getItem('user_lng');
      
      const q = query(collection(firestore!, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const customerOrderNumber = countSnap.data().count + 1;

      const orderData = {
        userId: user.uid,
        customerName: activeCustomerName.toUpperCase(),
        address: localStorage.getItem('user_address_line') || activeAddress,
        customerLat: lat ? parseFloat(lat) : null,
        customerLng: lng ? parseFloat(lng) : null,
        items: cart,
        total: totalPrice + 45, // Adding fees
        status: 'Placed',
        paymentMethod: 'UPI',
        customerOrderNumber,
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        pickupOTP: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        restaurantName: cart[0]?.restaurantName || 'ShopyKart'
      };

      await addDoc(collection(firestore!, 'orders'), orderData);
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
    <div className="min-h-screen bg-[#F3F4F6] pb-32 transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />

      {/* 1. STICKY GREEN NAVIGATION BAR (AS REQUESTED) */}
      <header className="bg-[#00843D] text-white pt-6 pb-6 px-4 sticky top-0 z-[100] shadow-lg rounded-b-[2rem] transition-all transform-gpu">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-black/10 active:scale-90 transition-all">
            <ChevronLeft className="h-7 w-7 text-white stroke-[3]" />
          </button>
          <div className="flex-1 min-w-0" onClick={handleOpenPicker}>
            <h1 className="text-lg font-black uppercase tracking-tight truncate leading-tight italic">
               {cart[0]?.restaurantName || 'ShopyKart Store'}
            </h1>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-white/80 uppercase tracking-widest mt-1 truncate">
               <Navigation className="h-3 w-3 text-white/60 shrink-0" />
               <span className="truncate">{deliveryTime} to {activeCustomerName} | {activeAddress}</span>
               <ChevronDown className="h-3 w-3 text-white/60 shrink-0 ml-0.5" />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 pt-5 space-y-4">
        
        {/* 2. GIFTING / RECIPIENT CARD */}
        <section className="bg-white rounded-[2.5rem] p-6 flex items-center justify-between border border-gray-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
              <Gift className="h-20 w-20 -rotate-12" />
           </div>
           <div className="flex-1 pr-4 relative z-10">
              <div className="flex items-center gap-2 mb-1">
                 <h4 className="font-black text-sm text-gray-900 uppercase tracking-tight italic">Recipient: {activeCustomerName} 🎁</h4>
              </div>
              <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed">Notifications will be sent for tracking. Delivery details verified.</p>
           </div>
           <button onClick={handleOpenPicker} className="bg-[#E91E63] text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl shadow-lg active:scale-95 transition-all shrink-0 relative z-10">
              EDIT
           </button>
        </section>

        {/* 3. DYNAMIC STATUS BANNER */}
        <section className="bg-white rounded-[2rem] p-4 flex items-center justify-between border border-gray-100 shadow-sm relative overflow-hidden">
           <div className="flex-1 pr-10">
              <div className="flex items-center gap-1.5 text-amber-600 mb-1">
                 <AlertCircle className="h-3.5 w-3.5" />
                 <span className="text-[10px] font-black uppercase tracking-tighter">High demand detected!</span>
              </div>
              <p className="text-[9px] font-bold text-gray-500 uppercase leading-tight">Delivery time is slightly higher due to rush in your area.</p>
           </div>
           <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 shrink-0">
              <Truck className="h-8 w-8 text-gray-200" />
           </div>
        </section>

        {/* 4. ITEMISED CART CARD */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 space-y-6">
           <div className="space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                   <div className="pt-1 shrink-0">
                      <div className="h-3.5 w-3.5 border border-green-600 p-0.5 rounded-sm flex items-center justify-center">
                         <div className="h-full w-full bg-green-600 rounded-full" />
                      </div>
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-gray-900 uppercase tracking-tighter leading-tight italic">{item.name}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-1">₹{item.price} {item.selectedOption && `• ${item.selectedOption.name}`}</p>
                      
                      <div className="flex items-center gap-2 mt-4">
                         <button onClick={() => router.push('/')} className="text-[8px] font-black text-gray-400 uppercase border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 active:scale-95 transition-all">+ ADD ITEMS</button>
                         <button className="text-[8px] font-black text-gray-400 uppercase border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 active:scale-95 transition-all">REQUESTS</button>
                         <button className="text-[8px] font-black text-gray-400 uppercase border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 active:scale-95 transition-all">CUTLERY</button>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center bg-gray-50 rounded-xl h-10 px-1 border border-gray-200 shadow-inner">
                         <button onClick={() => removeFromCart(item.id)} className="w-8 h-full flex items-center justify-center text-gray-400"><Minus className="h-3 w-3 stroke-[3]" /></button>
                         <span className="w-4 text-center text-[10px] font-black italic">{item.quantity}</span>
                         <button onClick={() => addToCart({...item, quantity: 1})} className="w-8 h-full flex items-center justify-center text-gray-900"><Plus className="h-3 w-3 stroke-[3]" /></button>
                      </div>
                      <span className="text-sm font-black text-gray-900 italic">₹{item.price * item.quantity}</span>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* 5. UP-SELL SECTION (DYNAMIC TOP RATED) */}
        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 italic">COMPLETE YOUR MEAL</h3>
              <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black px-2 py-0.5 uppercase tracking-tighter">BEST RATED</Badge>
           </div>
           
           <div className="flex overflow-x-auto space-x-4 no-scrollbar pb-2">
              {(upsellProducts && upsellProducts.length > 0 ? upsellProducts : []).map((product: any) => (
                <div key={product.id} className="min-w-[140px] max-w-[140px] bg-white rounded-[2rem] border border-gray-100 p-2 shadow-sm flex flex-col group transition-all transform-gpu active:scale-95">
                   <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-muted mb-2 border border-gray-50">
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                      <button 
                        onClick={() => addToCart({...product, quantity: 1})}
                        className="absolute bottom-2 right-2 h-7 w-7 bg-[#E91E63] text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-2 border-white"
                      >
                         <Plus className="h-4 w-4 stroke-[3]" />
                      </button>
                   </div>
                   <div className="px-1.5 pb-2">
                      <h5 className="text-[10px] font-black text-gray-900 truncate uppercase leading-tight italic">{product.name}</h5>
                      <div className="flex items-center gap-1.5 mt-1">
                         <span className="text-[11px] font-black text-[#00843D] italic">₹{product.price}</span>
                         <span className="text-[8px] font-bold text-gray-300 line-through">₹{Math.round(product.price * 1.2)}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </section>

        {/* 6. ACTIONABLE UTILITY ROWS */}
        <section className="space-y-3">
           <button className="w-full bg-white rounded-2xl p-5 flex items-center justify-between border border-gray-100 shadow-sm active:scale-[0.98] transition-all group">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                    <Tag className="h-5 w-5" />
                 </div>
                 <span className="text-xs font-black text-gray-800 uppercase tracking-tight italic text-left">Payment offers & more</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300" />
           </button>

           <button className="w-full bg-white rounded-2xl p-5 flex items-center justify-between border border-gray-100 shadow-sm active:scale-[0.98] transition-all group">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <MapPin className="h-5 w-5" />
                 </div>
                 <span className="text-xs font-black text-gray-800 uppercase tracking-tight italic text-left">Add Delivery Instructions</span>
              </div>
              <ChevronDown className="h-5 w-5 text-gray-300" />
           </button>
        </section>

        {/* 7. BILL SUMMARY */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 space-y-4">
           <h3 className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Financials</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                 <span>Item Total</span>
                 <span className="text-gray-900 font-black">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-gray-600 uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                    <span>Delivery Fee</span>
                    <Badge className="bg-green-50 text-green-700 border-none text-[8px] font-black uppercase">FREE</Badge>
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
           </div>
        </section>

        {/* TRUST SIGNALS */}
        <div className="flex flex-col items-center justify-center py-10 opacity-30 gap-4">
           <div className="flex items-center gap-8">
              <ShieldCheck className="h-8 w-8 text-gray-400" />
              <ShoppingBag className="h-8 w-8 text-gray-400" />
              <Truck className="h-8 w-8 text-gray-400" />
           </div>
           <p className="text-[8px] font-black uppercase tracking-[0.5em]">ShopyKart Enterprise Secured</p>
        </div>

      </main>

      {/* 7. FIXED BOTTOM ACTION BAR */}
      <footer className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 px-6 pt-4 pb-12 shadow-[0_-20px_60px_rgba(0,0,0,0.05)] flex items-center transform-gpu">
         <div className="flex-1 flex flex-col justify-center">
            <span className="text-2xl font-black italic text-gray-900 tracking-tighter leading-none">₹{totalPrice + 45}</span>
            <button className="text-[9px] font-black text-[#00843D] uppercase tracking-widest mt-1 text-left">View Detailed Bill</button>
         </div>
         
         <button 
           onClick={handlePlaceOrder}
           disabled={isPlacing}
           className="h-16 px-10 bg-[#00843D] hover:bg-[#007033] text-white rounded-[1.25rem] font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
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
    </div>
  );
}
