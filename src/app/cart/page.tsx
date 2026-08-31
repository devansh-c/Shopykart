
'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
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
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, GeoPoint, increment, setDoc, query, where, orderBy, limit } from 'firebase/firestore';
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
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Fetch Vendors to find the top rated one
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), where('isOnline', '==', true), orderBy('rating', 'desc'), limit(5));
  }, [firestore]);
  const { data: topVendors } = useCollection<any>(vendorsQuery);

  const bestVendorId = useMemo(() => topVendors?.[0]?.id || null, [topVendors]);

  // 2. Fetch products from the best rated vendor
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

  // 3. Fallback products if top rated vendor has none
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

  const finalTotal = useMemo(() => {
    return totalPrice + 40 + (selectedTip || 0);
  }, [totalPrice, selectedTip]);

  const toggleInstruction = (id: string) => {
    setSelectedInstructions(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePlaceOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    if (!utrNumber) { setIsPaymentDialogOpen(true); return; }

    setIsPlacing(true);
    try {
      const lat = localStorage.getItem('user_lat');
      const lng = localStorage.getItem('user_lng');
      
      const q = query(collection(firestore!, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const customerOrderNumber = countSnap.data().count + 1;

      const orderData = {
        userId: user.uid,
        customerName: activeCustomerName?.toUpperCase() || 'PREMIUM USER',
        address: localStorage.getItem('user_address_line') || 'No Address',
        customerLocation: lat ? new GeoPoint(parseFloat(lat), parseFloat(lng || '0')) : null,
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

      <header className="bg-gradient-to-b from-[#00843D] to-[#00843D]/90 pt-8 pb-10 px-4 sticky top-0 z-[100]">
        <div className="flex items-start gap-4 mb-2">
          <button onClick={() => router.back()} className="mt-1"><ChevronLeft className="h-6 w-6 text-white" /></button>
          <div className="flex-1">
             <h1 className="text-lg font-bold text-white leading-none mb-1">{cart[0]?.restaurantName || 'ShopyKart Gourmet'}</h1>
             <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/90">
                <Clock className="h-3 w-3" />
                <span>40-45 mins to {activeCustomerName} | {activeAddress}</span>
                <ChevronDown className="h-3 w-3" />
             </div>
          </div>
        </div>
      </header>

      <main className="relative -mt-6 bg-[#F5F6F8] rounded-t-[2.5rem] px-4 space-y-4 pt-6">
        
        <div className="bg-white rounded-3xl p-5 flex items-center justify-between border border-border/40 shadow-sm">
           <span className="font-bold text-sm text-gray-800">Ordering for someone else?</span>
           <button className="text-[#E91E63] font-black text-xs uppercase tracking-tight">Add Details</button>
        </div>

        <div className="bg-[#F3F4F6] rounded-3xl p-4 flex items-center gap-4 relative overflow-hidden border border-border/40">
           <div className="flex-1">
              <p className="text-[11px] font-medium text-gray-600 leading-tight">
                High demand in your area! Delivery time slightly higher than usual. Thanks for your patience!
              </p>
           </div>
           <div className="shrink-0 relative h-12 w-12">
              <img src="https://picsum.photos/seed/wave/100/100" className="h-full w-full object-contain rounded-full" alt="" />
           </div>
        </div>

        {/* ITEMS LIST */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/40 space-y-6">
           {cart.map((item, i) => (
             <div key={i} className="space-y-4">
               <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-2">
                     <div className="mt-1 h-3.5 w-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                     <div>
                        <h4 className="font-bold text-sm text-gray-900 uppercase tracking-tight">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 italic">Customizations: {item.selectedOption?.name || 'Default'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center border border-gray-200 rounded-xl h-9 px-1 shadow-sm bg-white">
                        <button onClick={() => removeFromCart(item.id)} className="w-8 h-full flex items-center justify-center text-gray-400"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                        <button onClick={() => addToCart({...item, quantity: 1})} className="w-8 h-full flex items-center justify-center text-[#00843D]"><Plus className="h-3.5 w-3.5" /></button>
                     </div>
                     <span className="text-sm font-black text-gray-900 w-12 text-right">₹{item.price * item.quantity}</span>
                  </div>
               </div>
             </div>
           ))}

           <div className="flex gap-3 pt-2">
              <button onClick={() => router.push('/')} className="flex-1 flex items-center justify-center gap-1.5 h-11 border border-gray-100 rounded-2xl text-gray-600 text-[10px] font-black uppercase tracking-widest bg-gray-50"><Plus className="h-3 w-3" /> Add Items</button>
              <button className="flex-1 flex items-center justify-center gap-1.5 h-11 border border-gray-100 rounded-2xl text-gray-600 text-[10px] font-black uppercase tracking-widest bg-gray-50"><MessageSquare className="h-3 w-3" /> Cooking Notes</button>
           </div>
        </div>

        {/* COMPLETE YOUR MEAL - DYNAMIC TOP RATED PRODUCTS */}
        {displayUpsell.length > 0 && (
          <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-border/40 animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-5">
               <div>
                  <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Complete your meal</h3>
                  {bestVendorId && <p className="text-[8px] font-bold text-[#E91E63] uppercase mt-0.5 tracking-widest italic">Featured: {topVendors?.[0]?.storeName}</p>}
               </div>
            </div>
            <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                {displayUpsell.map((item: any) => (
                  <div key={item.id} className="min-w-[110px] flex flex-col gap-2 relative group">
                    <div className="relative h-28 w-28 rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-muted">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                        <button 
                          onClick={() => {
                            addToCart({ ...item, quantity: 1 });
                            toast({ title: "Added to cart" });
                          }}
                          className="absolute bottom-2 right-2 h-8 w-8 bg-white rounded-xl shadow-xl flex items-center justify-center text-[#E91E63] active:scale-90 transition-all border border-pink-50"
                        >
                          <Plus className="h-4 w-4 stroke-[4]" />
                        </button>
                    </div>
                    <div className="space-y-0.5 px-1">
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 bg-green-600 rounded-full" />
                          <h5 className="text-[10px] font-black text-gray-800 truncate uppercase tracking-tighter">{item.name}</h5>
                        </div>
                        <span className="text-[11px] font-black text-gray-900 italic">₹{item.price}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* DELIVERY INSTRUCTIONS */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-border/40">
           <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4 ml-1">Delivery Instructions</h3>
           <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {deliveryInstructions.map((inst) => {
                const isSelected = selectedInstructions.includes(inst.id);
                return (
                  <button 
                    key={inst.id}
                    onClick={() => toggleInstruction(inst.id)}
                    className={cn(
                      "min-w-[100px] p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95",
                      isSelected ? "bg-pink-50 border-[#E91E63] text-[#E91E63]" : "bg-gray-50 border-transparent text-gray-400"
                    )}
                  >
                    <inst.icon className="h-5 w-5" />
                    <span className="text-[9px] font-black uppercase text-center leading-tight tracking-tighter">{inst.label}</span>
                  </button>
                );
              })}
           </div>
        </div>

        {/* RIDER TIP */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-border/40">
           <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-2 rounded-xl"><Bike className="h-5 w-5 text-amber-600" /></div>
              <div>
                 <h3 className="text-sm font-black uppercase italic tracking-tighter">Tip your rider</h3>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">100% of the tip goes to your delivery partner</p>
              </div>
           </div>
           <div className="flex gap-3">
              {[10, 20, 30, 50].map((amount) => (
                <button 
                  key={amount}
                  onClick={() => setSelectedTip(selectedTip === amount ? null : amount)}
                  className={cn(
                    "flex-1 h-12 rounded-2xl border-2 font-black italic transition-all active:scale-95 flex items-center justify-center gap-1",
                    selectedTip === amount ? "bg-amber-50 border-amber-500 text-amber-700 shadow-inner" : "bg-gray-50 border-transparent text-gray-400"
                  )}
                >
                  <Plus className="h-3 w-3" /> ₹{amount}
                </button>
              ))}
           </div>
        </div>

        {/* BILL SUMMARY */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-border/40 space-y-6">
           <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2">Detailed Bill Summary</h3>
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
              {selectedTip && (
                <div className="flex justify-between items-center text-xs font-black text-amber-600 uppercase">
                   <span>Rider Tip</span>
                   <span>₹{selectedTip}</span>
                </div>
              )}
              <div className="pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                 <span className="text-xl font-black italic uppercase tracking-tighter">Grand Total</span>
                 <span className="text-2xl font-black italic text-[#00843D] tracking-tighter">₹{finalTotal}</span>
              </div>
           </div>
        </div>

        {/* SAFETY BADGES */}
        <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white space-y-6 relative overflow-hidden shadow-2xl">
           <div className="flex items-center gap-4 relative z-10">
              <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20 shadow-inner">
                <CheckCircle2 className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                 <h4 className="text-lg font-black italic uppercase tracking-tighter">Trust & Safety</h4>
                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Verified Premium Partners Only</p>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4 relative z-10">
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Sanitized Kitchens</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Temperature Checks</span>
              </div>
           </div>
           <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-12" />
        </div>

      </main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t border-gray-100 px-6 pt-4 pb-10 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className="flex flex-col">
            <span className="text-2xl font-black italic text-gray-900 leading-none">₹{finalTotal}</span>
            <button className="text-[8px] font-black text-[#00843D] uppercase tracking-widest underline underline-offset-4 mt-2">View Detailed Bill</button>
         </div>
         <button 
           onClick={handlePlaceOrder}
           disabled={isPlacing}
           className="h-16 px-12 bg-[#00843D] hover:bg-[#006a31] text-white rounded-[1.5rem] font-black uppercase italic text-sm shadow-xl shadow-green-200 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-[#005c26]"
         >
           {isPlacing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
             <>
               Proceed to Pay
               <ChevronRight className="h-5 w-5 stroke-[4]" />
             </>
           )}
         </button>
      </footer>

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
