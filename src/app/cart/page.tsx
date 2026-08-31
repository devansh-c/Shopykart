
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
  Check
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, GeoPoint, increment, setDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const UPSELL_ITEMS = [
  { id: 'u1', name: 'Cold Coffee', price: 65, mrp: 66, imageUrl: 'https://picsum.photos/seed/coffee/200/200' },
  { id: 'u2', name: 'Nimbu Pani', price: 32, mrp: 33, imageUrl: 'https://picsum.photos/seed/lemonade/200/200' },
  { id: 'u3', name: 'Lassi', price: 65, mrp: 66, imageUrl: 'https://picsum.photos/seed/lassi/200/200' },
  { id: 'u4', name: 'Milk Shake', price: 98, mrp: 99, imageUrl: 'https://picsum.photos/seed/shake/200/200' },
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
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeAddress = typeof window !== 'undefined' ? localStorage.getItem('user_address') : 'Set Location';
  const activeCustomerName = typeof window !== 'undefined' ? localStorage.getItem('user_name') : 'Guest';

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
        total: totalPrice + 40, // Simulated fixed charges for Toing look
        status: 'Placed',
        paymentMethod: 'online',
        utrNumber,
        customerOrderNumber,
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
    <div className="min-h-screen bg-[#F5F6F8] pb-32 transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />

      {/* TOING STYLE HEADER */}
      <header className="bg-gradient-to-b from-[#00843D] to-[#00843D]/90 pt-8 pb-10 px-4">
        <div className="flex items-start gap-4 mb-2">
          <button onClick={() => router.back()} className="mt-1"><ChevronLeft className="h-6 w-6 text-white" /></button>
          <div className="flex-1">
             <h1 className="text-lg font-bold text-white leading-none mb-1">{cart[0]?.restaurantName || 'Bole To Vadapav'}</h1>
             <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/90">
                <Clock className="h-3 w-3" />
                <span>40-45 mins to {activeCustomerName} | {activeAddress}</span>
                <ChevronDown className="h-3 w-3" />
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="relative -mt-6 bg-[#F5F6F8] rounded-t-[2.5rem] px-4 space-y-4 pt-6">
        
        {/* ORDERING FOR SOMEONE ELSE */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-between border border-border/40 shadow-sm">
           <span className="font-bold text-sm text-gray-800">Ordering for someone else?</span>
           <button className="text-[#E91E63] font-black text-xs uppercase tracking-tight">Add Details</button>
        </div>

        {/* HIGH DEMAND BANNER */}
        <div className="bg-[#F3F4F6] rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden">
           <div className="flex-1">
              <p className="text-[11px] font-medium text-gray-600 leading-tight">
                High demand in your area! Delivery time slightly higher than usual. Thanks for your patience!
              </p>
           </div>
           <div className="shrink-0 relative h-12 w-12">
              <img src="https://picsum.photos/seed/wave/100/100" className="h-full w-full object-contain rounded-full" alt="" />
           </div>
        </div>

        {/* CART ITEMS */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40 space-y-6">
           {cart.map((item, i) => (
             <div key={i} className="space-y-4">
               <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-2">
                     <div className="mt-1 h-3.5 w-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                     <div>
                        <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">Jain, Extra Mayo, Cornflakes, Ex...</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center border border-gray-200 rounded-lg h-8 px-1 shadow-sm">
                        <button onClick={() => removeFromCart(item.id)} className="w-6 flex items-center justify-center text-gray-400"><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                        <button onClick={() => addToCart({...item, quantity: 1})} className="w-6 flex items-center justify-center text-[#00843D]"><Plus className="h-3 w-3" /></button>
                     </div>
                     <span className="text-sm font-bold text-gray-900 w-12 text-right">₹{item.price * item.quantity}</span>
                  </div>
               </div>
             </div>
           ))}

           <div className="flex gap-3 pt-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-gray-200 rounded-xl text-gray-600 text-[10px] font-bold"><Plus className="h-3 w-3" /> Add Items</button>
              <button className="flex-1 flex items-center justify-center gap-1.5 h-10 border border-gray-200 rounded-xl text-gray-600 text-[10px] font-bold"><MessageSquare className="h-3 w-3" /> Cooking requests</button>
              <div className="flex items-center gap-2 px-3 border border-gray-200 rounded-xl">
                 <input type="checkbox" className="h-4 w-4 rounded-md border-gray-300" />
                 <span className="text-[10px] font-bold text-gray-600">Cutlery Needed</span>
              </div>
           </div>
        </div>

        {/* UPSELL SECTION: COMPLETE YOUR MEAL */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40">
           <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Complete your meal</h3>
           <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
              {UPSELL_ITEMS.map((item) => (
                <div key={item.id} className="min-w-[100px] flex flex-col gap-2 relative">
                   <div className="relative h-24 w-24 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                      <button 
                        onClick={() => addToCart({...item, quantity: 1})}
                        className="absolute top-1 right-1 h-6 w-6 bg-white rounded-lg shadow-md flex items-center justify-center text-[#E91E63]"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[4]" />
                      </button>
                   </div>
                   <div className="space-y-0.5 px-1">
                      <div className="flex items-center gap-1"><div className="h-2 w-2 bg-green-600 rounded-full" /><h5 className="text-[10px] font-bold text-gray-800 truncate">{item.name}</h5></div>
                      <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-black">₹{item.price}</span>
                         <span className="text-[8px] text-gray-400 line-through">₹{item.mrp}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* PROMO SECTION */}
        <button className="w-full bg-white rounded-2xl p-5 flex items-center justify-between border border-border/40 shadow-sm group active:scale-[0.98] transition-all">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-[#00843D]">
                 <Ticket className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm text-gray-800">Payment offers & more</span>
           </div>
           <ChevronRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
        </button>

        {/* DELIVERY INSTRUCTIONS ACCORDION */}
        <button className="w-full bg-white rounded-2xl p-5 flex items-center justify-between border border-border/40 shadow-sm group active:scale-[0.98] transition-all">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-[#00843D]">
                 <Utensils className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm text-gray-800">Add Delivery Instructions</span>
           </div>
           <ChevronDown className="h-5 w-5 text-gray-400" />
        </button>

        {/* BILLING ACCORDION */}
        <button className="w-full bg-white rounded-2xl p-5 flex items-center justify-between border border-border/40 shadow-sm group active:scale-[0.98] transition-all mb-10">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-[#00843D]">
                 <Smartphone className="h-5 w-5" />
              </div>
              <span className="font-bold text-sm text-gray-800">To Pay ₹{totalPrice + 40}</span>
           </div>
           <ChevronDown className="h-5 w-5 text-gray-400" />
        </button>

      </main>

      {/* STICKY FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100 px-6 pt-4 pb-8 flex items-center justify-between shadow-[0_-15px_40px_rgba(0,0,0,0.08)]">
         <div className="flex flex-col">
            <span className="text-lg font-black text-gray-900">₹{totalPrice + 40}</span>
            <button className="text-[10px] font-black text-[#00843D] uppercase tracking-tighter underline">View Detailed Bill</button>
         </div>
         <button 
           onClick={handlePlaceOrder}
           disabled={isPlacing}
           className="h-14 px-12 bg-[#00843D] hover:bg-[#006a31] text-white rounded-2xl font-black uppercase text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center"
         >
           {isPlacing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Proceed to Pay'}
         </button>
      </footer>

      {/* UTR DIALOG */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-[2.5rem] max-w-sm p-8 focus:outline-none border-none shadow-3xl bg-white bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="h-20 w-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-[#00843D] border border-green-100 shadow-inner">
                  <CheckCircle2 className="h-10 w-10 animate-pulse" />
               </div>
               <div className="space-y-2">
                 <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Secure Payment</DialogTitle>
                 <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pay ₹{totalPrice + 40} to proceed</DialogDescription>
               </div>
               
               <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 w-full flex flex-col items-center gap-6">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${totalPrice + 40}&cu=INR`)}`} className="h-48 w-48 grayscale contrast-125" alt="QR" />
                  <span className="text-[10px] font-black uppercase text-primary animate-pulse">Scan via any UPI App</span>
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
