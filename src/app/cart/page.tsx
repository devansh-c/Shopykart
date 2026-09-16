
'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  MapPin, 
  ArrowRight, 
  Navigation, 
  IndianRupee,
  Heart,
  AlertCircle,
  Clock,
  ListTree,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, query } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [recipientForm, setRecipientForm] = useState({ name: '', phone: '', address: '' });
  const [deliveryTip, setDeliveryTip] = useState(0);

  // Interaction States for Laptop/Desktop & Mobile
  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('user_name') || '';
      const savedPhone = localStorage.getItem('user_phone') || '';
      const savedAddress = localStorage.getItem('user_address_line') || '';
      const savedZone = localStorage.getItem('active_zone_id');
      setRecipientForm({ name: savedName, phone: savedPhone, address: savedAddress });
      setActiveZoneId(savedZone);
      
      const syncTime = () => { 
        const now = new Date(); 
        setCurrentMinutes(now.getHours() * 60 + now.getMinutes()); 
      };
      syncTime(); 
      const interval = setInterval(syncTime, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'cart_vendors_check');

  const cartItemsWithStatus = useMemo(() => {
    if (!vendors) return cart.map(item => ({ ...item, isClosed: false }));
    const vMap = new Map(vendors.map(v => [v.id, v]));
    return cart.map(item => {
      const v = vMap.get(item.vendorId || '');
      const isClosed = v ? (v.isOnline === false || !isStoreScheduleOpen(v, currentMinutes)) : false;
      return { ...item, isClosed };
    });
  }, [cart, vendors, currentMinutes]);

  const hasClosedItems = useMemo(() => cartItemsWithStatus.some(it => it.isClosed), [cartItemsWithStatus]);

  const zoneRef = useMemoFirebase(() => (firestore && activeZoneId) ? doc(firestore, 'zones', activeZoneId) : null, [firestore, activeZoneId]);
  const { data: zoneData } = useDoc<any>(zoneRef);
  
  const deliveryFee = zoneData?.deliveryCharge || 0;
  const minOrderValue = zoneData?.minOrder || 0;

  // Minimum Order Value (MOV) Check
  const isMinOrderMet = totalPrice >= minOrderValue;

  const totalPayable = useMemo(() => {
    return Math.max(0, totalPrice + deliveryFee + deliveryTip);
  }, [totalPrice, deliveryFee, deliveryTip]);

  const finalizeOrder = async () => {
    if (!user || !firestore || cart.length === 0 || hasClosedItems || !isMinOrderMet) {
      setSliderOffset(0); 
      return;
    }
    
    if (!recipientForm.name || recipientForm.phone.length !== 10 || !recipientForm.address) {
      setIsAddressModalOpen(true); 
      setSliderOffset(0); 
      return;
    }

    setIsPlacing(true);
    try {
      const orderData = {
        userId: user.uid,
        customerName: recipientForm.name,
        customerPhone: recipientForm.phone,
        address: recipientForm.address,
        items: cart,
        total: totalPayable,
        status: 'Placed',
        createdAt: serverTimestamp(),
        restaurantName: cart[0]?.restaurantName || 'ShopyKart',
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        deliveryFee,
        deliveryTip,
        zoneId: activeZoneId,
        customerOrderNumber: Math.floor(1000 + Math.random() * 9000)
      };
      await addDoc(collection(firestore, 'orders'), orderData);
      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace('/orders'); }, 1500);
    } catch (e) { 
      setIsPlacing(false); 
      setSliderOffset(0); 
      toast({ variant: "destructive", title: "Order Failed", description: "Identity sync error. Try again." });
    }
  };

  // TOUCH EVENTS (Mobile)
  const handleTouchStart = (e: React.TouchEvent) => { if (isPlacing || cart.length === 0 || hasClosedItems || !isMinOrderMet) return; setIsDragging(true); startXRef.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { if (!isDragging || !sliderRef.current) return; const diff = e.touches[0].clientX - startXRef.current; if (diff > 0) setSliderOffset(Math.min(diff, sliderRef.current.offsetWidth - 80)); };
  const handleTouchEnd = () => { if (!isDragging) return; setIsDragging(false); if (sliderOffset > (sliderRef.current?.offsetWidth || 0) * 0.75) finalizeOrder(); else setSliderOffset(0); };

  // MOUSE EVENTS (Laptop/Desktop)
  const handleMouseDown = (e: React.MouseEvent) => { if (isPlacing || cart.length === 0 || hasClosedItems || !isMinOrderMet) return; setIsDragging(true); startXRef.current = e.clientX; };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const diff = e.clientX - startXRef.current;
      if (diff > 0) setSliderOffset(Math.min(diff, sliderRef.current.offsetWidth - 80));
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (sliderOffset > (sliderRef.current?.offsetWidth || 0) * 0.75) finalizeOrder();
      else setSliderOffset(0);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sliderOffset]);

  if (!isMounted) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-20 scale-150" />
           <div className="relative bg-white h-32 w-32 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-2xl">
              <ShoppingBag className="h-14 w-14 text-gray-200" />
           </div>
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Your bag is<br /><span className="text-primary">Empty!</span></h2>
        <button onClick={() => router.push('/')} className="h-16 px-10 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all flex items-center gap-3 mt-10">
          <ArrowLeft className="h-5 w-5" /> START SHOPPING
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 max-w-lg mx-auto border-x border-gray-100 shadow-sm">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-[100] flex items-center gap-4 shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-sm font-black uppercase italic tracking-widest">CHECKOUT</h1>
      </header>

      <main className="px-4 pt-6 space-y-6">
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center text-black"><Navigation className="h-6 w-6" /></div>
                 <div className="min-w-0">
                   <h4 className="text-xs font-black uppercase truncate">{recipientForm.name || 'SET RECIPIENT'}</h4>
                   <p className="text-[9px] font-bold text-gray-400 uppercase truncate leading-tight">{recipientForm.address || 'ENTER DROP ADDRESS'}</p>
                 </div>
              </div>
              <button onClick={() => setIsAddressModalOpen(true)} className="bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 border border-white/5">CHANGE</button>
           </div>
        </section>

        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-6">
           <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">ITEMS IN BAG</h3>
           <div className="space-y-6">
              {cartItemsWithStatus.map((item, idx) => (
                <div key={idx} className={cn("flex gap-4 items-center relative", item.isClosed && "opacity-50")}>
                   <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className={cn("object-cover", item.isClosed && "grayscale")} unoptimized />
                      {item.isClosed && <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center text-[7px] font-black text-white">CLOSED</div>}
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase truncate leading-tight">{item.name}</h4>
                      {item.selectedOption && (
                        <div className="flex items-center gap-1 mt-1 text-amber-400">
                          <ListTree className="h-2 w-2" />
                          <span className="text-[7px] font-black uppercase tracking-widest">{item.selectedOption.name}</span>
                        </div>
                      )}
                      <div className="flex items-center mt-2 bg-white/5 w-fit rounded-lg px-2 py-1">
                         <button onClick={() => removeFromCart(item.id)} className="text-amber-400 active:scale-75"><Minus className="h-3 w-3" /></button>
                         <span className="mx-2 text-[10px] font-black">{item.quantity}</span>
                         <button onClick={() => addToCart({...item, quantity: 1})} className="text-amber-400 active:scale-75"><Plus className="h-3 w-3" /></button>
                      </div>
                   </div>
                   <div className="text-sm font-black italic text-amber-400">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              ))}
           </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl space-y-6 border border-gray-100">
           <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">ORDER SUMMARY</h3>
           <div className="space-y-3 pt-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Items Total</span><span className="text-gray-900">₹{totalPrice.toFixed(0)}</span></div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery Fee</span><span className="text-gray-900">₹{deliveryFee.toFixed(0)}</span></div>
              {deliveryTip > 0 && <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery Tip</span><span className="text-gray-900">₹{deliveryTip}</span></div>}
           </div>
           <div className="pt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
              <div className="flex flex-col"><span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">TOTAL PAYABLE</span><div className="flex items-center gap-1.5 text-4xl font-black italic text-gray-900 tracking-tighter leading-none"><IndianRupee className="h-6 w-6 text-primary" /><span>{totalPayable.toFixed(0)}</span></div></div>
              <span className="text-[10px] font-bold text-gray-400 uppercase italic">INC. ALL TAXES</span>
           </div>
        </section>

        <div className="pt-8 pb-24">
           <div className="space-y-4">
              {hasClosedItems && (
                <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-[9px] font-bold text-red-800 uppercase leading-tight">Some stores in bag are CLOSED. Please remove items to proceed.</p>
                </div>
              )}
              
              {!isMinOrderMet && minOrderValue > 0 && (
                <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <div className="flex flex-col">
                     <p className="text-[9px] font-black text-amber-800 uppercase leading-tight">Min. Order Value required: ₹{minOrderValue}</p>
                     <p className="text-[8px] font-bold text-amber-600 uppercase">Add items worth ₹{minOrderValue - totalPrice} more to place order.</p>
                  </div>
                </div>
              )}

              <div 
                ref={sliderRef} 
                className={cn(
                  "w-full h-24 rounded-[2.5rem] p-3 flex items-center relative shadow-2xl overflow-hidden select-none border-t-4 transition-all duration-300", 
                  (hasClosedItems || !isMinOrderMet) ? "bg-gray-200 border-gray-300 opacity-50 grayscale cursor-not-allowed" : "bg-[#0B0B0B] border-white/5"
                )}
              >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black uppercase italic tracking-[0.4em] text-white/20">
                      {hasClosedItems ? 'STORE CLOSED' : !isMinOrderMet ? 'MIN ORDER REQUIRED' : 'SLIDE TO PLACE ORDER'}
                    </span>
                  </div>
                  <div className="absolute inset-y-0 left-0 opacity-20 pointer-events-none bg-primary" style={{ width: `${sliderOffset + 80}px` }} />
                  <div 
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart} 
                    onTouchMove={handleTouchMove} 
                    onTouchEnd={handleTouchEnd} 
                    style={{ transform: `translateX(${sliderOffset}px)` }} 
                    className={cn(
                      "h-16 w-16 rounded-2xl flex items-center justify-center shadow-xl z-10 transition-transform bg-white text-primary cursor-grab active:cursor-grabbing", 
                      (hasClosedItems || !isMinOrderMet) && "bg-gray-300"
                    )}
                  >
                    <ArrowRight className="h-8 w-8 stroke-[3]" />
                  </div>
                  <div className="flex-1 text-right pr-8 relative z-10"><div className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60">Payable Amount</div><div className="text-3xl font-black italic text-white tracking-tighter leading-none mt-1">₹{totalPayable.toFixed(0)}</div></div>
                  {isPlacing && <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              </div>
           </div>
        </div>
      </main>

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3rem] p-8 border-none shadow-2xl bg-white max-w-sm bottom-0 top-auto translate-y-0 focus:outline-none flex flex-col h-[520px]">
          <DialogHeader className="pb-4 shrink-0"><div className="flex flex-col items-center text-center"><div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3 shadow-inner"><MapPin className="h-7 w-7" /></div><DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">DROP ADDRESS</DialogTitle></div></DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              <Input placeholder="FULL NAME" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase" />
              <Input placeholder="PHONE NUMBER" value={recipientForm.phone} onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs" />
              <textarea placeholder="HOUSE NO / STREET..." value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-24 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase focus:none outline-none" />
          </div>
          <div className="pt-4"><Button onClick={() => { if (!recipientForm.name || recipientForm.phone.length !== 10 || !recipientForm.address) return; localStorage.setItem('user_name', recipientForm.name); localStorage.setItem('user_phone', recipientForm.phone); localStorage.setItem('user_address_line', recipientForm.address); setIsAddressModalOpen(false); }} className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl">SAVE & CONTINUE</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
