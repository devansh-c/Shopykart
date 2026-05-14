
"use client"

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BottomNav } from '@/components/shared/BottomNav';
import { Search, Plus, Minus, Send, Sparkles, Loader2, SlidersHorizontal, X, Store, Clock, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function MenuContent() {
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get('vendor');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const [requestText, setRequestText] = useState('');
  const { cart, addToCart, removeFromCart, addCustomRequest } = useCart();
  const { toast } = useToast();
  
  const firestore = useFirestore();

  // Fetch Vendor Profile for real-time store details
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !vendorIdParam) return null;
    return doc(firestore, 'vendors', vendorIdParam);
  }, [firestore, vendorIdParam]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  // Fetch Products
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: dbProducts, loading } = useCollection(productsQuery);

  const filteredAndSortedProducts = useMemo(() => {
    // Fallback to mock data if Firestore is empty
    const baseProducts = (dbProducts && dbProducts.length > 0) 
      ? dbProducts 
      : require('@/lib/mock-data').allProducts;

    let result = baseProducts.filter((product: any) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesVendor = !vendorIdParam || product.vendorId === vendorIdParam;
      return matchesSearch && matchesCategory && matchesVendor;
    });

    switch (sortBy) {
      case 'price-low': result.sort((a: any, b: any) => a.price - b.price); break;
      case 'price-high': result.sort((a: any, b: any) => b.price - a.price); break;
      case 'name': result.sort((a: any, b: any) => a.name.localeCompare(b.name)); break;
      default: break;
    }

    return result;
  }, [searchQuery, activeCategory, sortBy, dbProducts, vendorIdParam]);

  const handleCustomRequest = () => {
    if (!requestText.trim()) return;
    addCustomRequest(requestText);
    setRequestText('');
    toast({
      title: "Request Sent",
      description: "Custom Veg dish added to your cart with ₹20 delivery charge.",
    });
  };

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'snacks', name: 'Snacks', badge: '🥟' },
    { id: 'pizza', name: 'Pizza', badge: '🍕' },
    { id: 'burgers', name: 'Burgers', badge: '🍔' },
    { id: 'pasta', name: 'Pasta', badge: '🍝' },
    { id: 'fries', name: 'Fries', badge: '🍟' },
    { id: 'drinks', name: 'Drinks', badge: '🥤' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-40">
      {/* Dynamic Store Header */}
      {vendorIdParam && vendorProfile && (
        <div className="relative h-64 w-full">
          <img 
            src={vendorProfile.bannerUrl || `https://picsum.photos/seed/${vendorIdParam}/800/400`} 
            className="w-full h-full object-cover" 
            alt="Banner" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
            <Link href="/menu" className="absolute top-6 left-6 h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
              <X className="h-5 w-5" />
            </Link>
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary shadow-xl shrink-0">
                <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="Logo" />
              </div>
              <div className="flex-1 pb-1">
                <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none mb-2">{vendorProfile.storeName}</h1>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary italic">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {vendorProfile.deliveryTime || '20 min'}</span>
                  <span className="flex items-center gap-1 text-white/60"><MapPin className="h-3 w-3" /> {vendorProfile.address || 'Nearby'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pt-12 pb-4 flex items-center justify-between">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Menu</h1>
      </div>

      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search items...' 
            className="pl-12 h-14 bg-white border-none rounded-full text-lg shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-6 mb-4">
        <div className="flex overflow-x-auto space-x-6 no-scrollbar flex-1 mr-4">
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className="flex flex-col items-center space-y-2 min-w-[70px] relative"
            >
              <div className={cn(
                "relative h-16 w-16 rounded-full overflow-hidden border-2 transition-all duration-300",
                activeCategory === cat.id ? "border-primary scale-110 shadow-lg" : "border-transparent bg-white shadow-sm"
              )}>
                <img
                  src={`https://picsum.photos/seed/${cat.id}/100/100`}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                activeCategory === cat.id ? "text-primary" : "text-muted-foreground"
              )}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        <div className="shrink-0">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px] h-10 rounded-xl bg-white border-none shadow-sm font-black text-[10px] uppercase tracking-widest focus:ring-1 focus:ring-primary/20">
              <SlidersHorizontal className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="recommended" className="text-[10px] font-black uppercase">Recommended</SelectItem>
              <SelectItem value="price-low" className="text-[10px] font-black uppercase">Price: Low-High</SelectItem>
              <SelectItem value="price-high" className="text-[10px] font-black uppercase">Price: High-Low</SelectItem>
              <SelectItem value="name" className="text-[10px] font-black uppercase">Name: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          filteredAndSortedProducts.map((product: any) => {
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;

            return (
              <div 
                key={product.id}
                className="premium-card p-5 flex justify-between items-center bg-white"
              >
                <Link href={`/product/${product.id}`} className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                    {product.badges?.map((badge: string) => (
                      <span key={badge} className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {badge}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-black text-xl italic tracking-tight leading-tight mb-1 text-foreground">{product.name}</h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 italic">from {product.restaurantName}</p>
                  <div className="text-2xl font-black text-foreground italic tracking-tighter">₹{product.price.toFixed(2)}</div>
                </Link>
                
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Link href={`/product/${product.id}`} className="block w-full h-full rounded-2xl overflow-hidden bg-muted">
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-2 z-20">
                    {quantity === 0 ? (
                      <button 
                        onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl })}
                        className="w-full h-10 bg-white text-primary border-2 border-primary shadow-lg font-black text-[10px] uppercase tracking-widest rounded-xl active:scale-95 transition-all"
                      >
                        ADD TO BAG
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full h-10 bg-primary text-primary-foreground rounded-xl shadow-lg overflow-hidden">
                        <button 
                          onClick={() => removeFromCart(product.id)}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-black min-w-[20px] text-center">{quantity}</span>
                        <button 
                          onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl })}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed">
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No items found</p>
          </div>
        )}
      </div>

      <div className="px-6 mt-12 mb-10">
        <div className="bg-gradient-to-br from-[#0B0B0B] to-[#1A1A1A] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">Can't find it?</h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6 leading-relaxed">
              Tell us your favorite <span className="text-primary italic">Veg Dish</span> & we'll bring it to you!
            </p>
            
            <div className="flex gap-2">
              <Input 
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Type your veg dish name..." 
                className="h-14 bg-white/10 border-none rounded-2xl px-6 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-primary/50"
              />
              <Button 
                onClick={handleCustomRequest}
                disabled={!requestText.trim()}
                className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center justify-center shrink-0"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <MenuContent />
    </Suspense>
  );
}
