
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
  FileText 
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';

const BRAND_LOGO_URL = "https://picsum.photos/seed/shopykart-eats/200/200";

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  // User Details State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');

  // Fetch Dynamic Charges from Admin Panel
  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges } = useCollection<any>(chargesQuery);

  // Load from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCustomerName(localStorage.getItem('user_name') || '');
      setCustomerPhone(localStorage.getItem('user_phone') || '');
      setCustomerAddress(localStorage.getItem('user_address_line') || '');
      setCustomerCity(localStorage.getItem('user_city') || 'Ranipur');
      setCustomerPincode(localStorage.getItem('user_pincode') || '');
    }
  }, []);

  // Sync back to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_name', customerName);
      localStorage.setItem('user_phone', customerPhone);
      localStorage.setItem('user_address_line', customerAddress);
      localStorage.setItem('user_city', customerCity);
      localStorage.setItem('user_pincode', customerPincode);
    }
  }, [customerName, customerPhone, customerAddress, customerCity, customerPincode]);

  // Calculate dynamic totals
  const calculatedCharges = useMemo(() => {
    if (!dbCharges) return [];
    return dbCharges.map(charge => {
      const amount = charge.type === 'percentage' 
        ? totalPrice * (charge.value / 100) 
        : charge.value;
      return { ...charge, calculatedAmount: amount };
    });
  }, [dbCharges, totalPrice]);

  const chargesTotal = calculatedCharges.reduce((acc, curr) => acc + curr.calculatedAmount, 0);
  const grandTotal = totalPrice + chargesTotal;

  const handleCheckout = () => {
    if (!firestore || isPlacing) return;

    // Validation
    if (!customerName.trim() || customerPhone.length !== 10 || !customerAddress.trim() || customerPincode.length !== 6) {
      toast({ 
        variant: "destructive", 
        title: "Incomplete Details", 
        description: "Please provide your Name, 10-digit Phone, and Full Address to proceed." 
      });
      return;
    }

    setIsPlacing(true);
    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    const orderRef = doc(firestore, 'orders', orderId);

    // Identity Logic: Essential for History Visibility
    const guestUid = 'guest_' + customerPhone;
    const finalUid = user?.uid || guestUid;
    
    // Crucial: Save this UID to local storage so /orders page can fetch history
    localStorage.setItem('guest_uid', finalUid);
    localStorage.setItem('guest_name', customerName);

    const fullFinalAddress = `${customerAddress}, ${customerCity} - ${customerPincode}`;

    const orderData = {
      userId: finalUid,
      customerName: customerName,
      customerPhone: customerPhone,
      orderDisplayId: orderId,
      items: cart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
      chargesApplied: calculatedCharges.map(c => ({ name: c.name, amount: c.calculatedAmount })),
      total: grandTotal,
      status: 'Placed',
      instructions,
      address: fullFinalAddress,
      createdAt: serverTimestamp(),
      vendorId: cart[0]?.vendorId || 'unknown',
      restaurantName: cart[0]?.restaurantName || 'a store',
      coinsEarned: Math.floor(grandTotal * 0.5),
      coinsUsed: 0
    };

    setShowSuccess(true);

    // 1. Create Order
    setDoc(orderRef, orderData)
      .then(async () => {
        // 2. Update/Create User Profile for Admin Directory
        const userRef = doc(firestore, 'users', finalUid);
        await setDoc(userRef, {
          fullName: customerName,
          phoneNumber: customerPhone,
          address: fullFinalAddress,
          city: customerCity,
          pincode: customerPincode,
          uid: finalUid,
          updatedAt: serverTimestamp(),
          role: 'customer'
        }, { merge: true });

        // Notifications
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && 'serviceWorker' in navigator) {
             navigator.serviceWorker.ready.then((registration) => {
               registration.showNotification("Order Confirmed! 🚀", {
                 body: `Thank you ${customerName}! Your order is being prepared.`,
                 icon: BRAND_LOGO_URL,
                 badge: BRAND_LOGO_URL
               });
             }).catch(() => {});
        }
        
        setTimeout(() => {
          clearCart();
          router.push(`/orders/track?id=${orderId}`);
        }, 1500);
      })
      .catch((err: any) => {
        setShowSuccess(false);
        setIsPlacing(false);
        toast({ variant: "destructive", title: "Order Failed", description: "Database error. Please try again." });
      });
  };

  if (totalItems === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <ShoppingBag className="h-12 w-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <p className="text-gray-400 mt-1 mb-8 text-sm">Add something delicious to get started!</p>
        <Button onClick={() => router.push('/menu')} className="rounded-xl h-12 px-8 font-bold bg-[#EF4444]">
          BROWSE MENU
        </Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F7] pb-44">
      <OrderSuccessOverlay isVisible={showSuccess} />

      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Review Order</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-primary/10">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-sm font-black uppercase text-gray-700 italic">Delivery Identity</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Your Full Name</label>
              <Input 
                placeholder="E.g. Rahul Sharma" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-12 rounded-xl bg-gray-50 border-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone Number (10 Digits)</label>
              <Input 
                type="tel"
                placeholder="E.g. 9876543210" 
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))}
                className="h-12 rounded-xl bg-gray-50 border-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Full Delivery Address</label>
              <Textarea 
                placeholder="House No, Building, Street Name, Landmark..." 
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="rounded-xl bg-gray-50 border-none font-medium min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">City</label>
                <Input 
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="h-12 rounded-xl bg-gray-50 border-none font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pincode</label>
                <Input 
                  placeholder="284205"
                  value={customerPincode}
                  onChange={(e) => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))}
                  className="h-12 rounded-xl bg-gray-50 border-none font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold uppercase text-gray-700">Order Items ({totalItems})</h2>
            </div>
          </div>

          <div className="space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start">
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-3.5 w-3.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                    <h3 className="font-bold text-sm text-gray-800 truncate">{item.name}</h3>
                  </div>
                  <div className="text-sm font-black text-gray-800 mt-2">₹{item.price.toFixed(2)}</div>
                  
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center bg-[#EF4444] text-white rounded-lg h-9 w-24">
                      <button onClick={() => removeFromCart(item.id)} className="flex-1 flex items-center justify-center font-bold text-xl">-</button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="flex-1 flex items-center justify-center font-bold text-xl">+</button>
                    </div>
                  </div>
                </div>
                <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-50 p-1.5 rounded-lg">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-800 uppercase">Bill Details</h3>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold text-gray-500">
              <span>Item Total</span>
              <span>₹{totalPrice.toFixed(2)}</span>
            </div>
            
            {/* Dynamic Admin Charges */}
            {calculatedCharges.map((charge) => (
              <div key={charge.id} className="flex justify-between font-bold text-gray-500">
                <span>{charge.name} {charge.type === 'percentage' ? `(${charge.value}%)` : ''}</span>
                <span>₹{charge.calculatedAmount.toFixed(2)}</span>
              </div>
            ))}

            <div className="flex justify-between font-bold text-green-600">
              <span>Delivery Fee</span>
              <span>Free</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
            <span className="text-base font-black text-gray-700">Total Payable</span>
            <span className="text-xl font-black text-[#EF4444]">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto">
           <div className="flex items-center justify-between mb-3 px-1">
              <div>
                 <div className="text-lg font-black text-gray-800">₹{grandTotal.toFixed(2)}</div>
                 <p className="text-[10px] font-bold text-gray-400 uppercase">⚡ Cash on Delivery / Online</p>
              </div>
              <div className="flex items-center gap-1.5 text-gray-400">
                 <Bike className="h-4 w-4 text-amber-500" />
                 <span className="text-[10px] font-bold">~25 min</span>
              </div>
           </div>
           <Button 
            disabled={isPlacing}
            onClick={handleCheckout}
            className="w-full h-14 rounded-2xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-black text-lg shadow-xl active:scale-[0.98] transition-all"
          >
            {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : "Confirm & Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
