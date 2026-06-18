'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, Minus, SlidersHorizontal, X, Clock, MapPin, Utensils } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { ProductQuickView } from '@/components/product/ProductQuickView';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MenuContent() {
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get('vendor');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recommended');
  const { cart, addToCart, removeFromCart } = useCart();
  
  const firestore = useFirestore();

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: allVendors } = useCollection<any>(vendorsQuery);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !vendorIdParam) return null;
    return doc(firestore, 'vendors', vendorIdParam);
  }, [firestore, vendorIdParam]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const isOffline = vendorProfile?.isOnline === false;

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: dbProducts, loading: dbLoading } = useCollection(productsQuery);

  const filteredAndSortedProducts = useMemo(() => {
    if (!dbProducts || !allVendors) return [];

    let result = dbProducts.filter((product: any) => {
      const matchesSearch = (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesVendor = !vendorIdParam || product.vendorId === vendorIdParam;
      return matchesSearch && matchesCategory && matchesVendor;
    });

    result.sort((a: any, b: any) => {
      const vA = allVendors.find(v => v.id === a.vendorId);
      const vB = allVendors.find(v => v.id === b.vendorId);
      const onlineA = (vA?.isOnline !== false && a.isAvailable !== false) ? 1 : 0;
      const onlineB = (vB?.isOnline !== false && b.isAvailable !== false) ? 1 : 0;

      if (onlineA !== onlineB) return onlineB - onlineA;

      switch (sortBy) {
        case 'price-low': return (a.price || 0) - (b.price || 0);
        case 'price-high': return (b.price || 0) - (a.price || 0);
        case 'name': return (a.name || '').localeCompare(b.name || '');
        default: return 0;
      }
    });

    return result;
  }, [searchQuery, activeCategory, sortBy, dbProducts, vendorIdParam, allVendors]);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'snacks', name: 'Snacks' },
    { id: 'pizza', name: 'Pizza' },
    { id: 'burgers', name: 'Burgers' },
    { id: 'pasta', name: 'Pasta' },
    { id: 'fries', name: 'Fries' },
    { id: 'drinks', name: 'Drinks' },
  ];

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-40">
      {vendorIdParam && (
        <div className="relative h-64 w-full">
          <img 
            src={vendorProfile?.bannerUrl || `https://picsum.photos/seed/${vendorIdParam}/800/400`} 
            className="w-full h-full object-cover" 
            alt="Banner" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6">
            <Link href="/menu" className="absolute top-6 left-6 h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20">
              <X className="h-5 w-5" />
            </Link>
            
            {isOffline && (
               <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center">
                  <span className="text-white font-black text-4xl uppercase italic tracking-tighter">Closed Now</span>
               </div>
            )}

            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary shadow-xl shrink-0">
                <img src={vendorProfile?.imageUrl || `https://picsum.photos/seed/${vendorIdParam}/200/200`} className="h-full w-full object-cover" alt="Logo" />
              </div>
              <div className="flex-1 pb-1 min-w-0">
                <h1 className="text-2xl font-black italic uppercase text-white tracking-tighter leading-none mb-2 truncate">{vendorProfile?.storeName || 'Store Details'}</h1>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-primary italic">
                  <span className="flex items-center gap-1 shrink-0"><Clock className="h-3 w-3" /> {vendorProfile?.deliveryTime || '20 min'}</span>
                  <span className="flex items-center gap-1 text-white/60 truncate"><MapPin className="h-3 w-3" /> {vendorProfile?.address || 'Nearby'}</span>
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
        <div className="flex overflow-x-auto space-x-4 no-scrollbar flex-1 mr-4">
          {categories.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                activeCategory === cat.id ? "bg-primary text-white shadow-lg" : "bg-white text-muted-foreground shadow-sm"
              )}
            >
              {cat.name}
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
        {dbLoading ? null : filteredAndSortedProducts.length > 0 ? (
          filteredAndSortedProducts.map((product: any) => {
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const imageUrl = product.imageUrl || `https://picsum.photos/seed/food/400/300`;
            const vendor = allVendors?.find(v => v.id === product.vendorId);
            const productIsOffline = (vendor?.isOnline === false) || (product.isAvailable === false);

            return (
              <div 
                key={product.id}
                className={cn(
                  "premium-card p-5 flex justify-between items-center bg-white relative overflow-hidden transition-all duration-500",
                  productIsOffline ? "opacity-60 grayscale-[0.4]" : "opacity-100"
                )}
              >
                <div className="flex-1 pr-4 min-w-0">
                  <ProductQuickView product={product}>
                    <button className={cn("block text-left w-full", (productIsOffline || isOffline) && "pointer-events-none")}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-3.5 w-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                        {product.badges?.map((badge: string) => (
                          <span key={badge} className="bg-primary/10 text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{badge}</span>
                        ))}
                      </div>
                      <h3 className="font-black text-xl italic tracking-tight leading-tight mb-1 text-foreground line-clamp-2 uppercase">{product.name}</h3>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2 italic truncate">from {product.restaurantName}</p>
                      <div className="text-2xl font-black text-foreground italic tracking-tighter">₹{(product.price || 0).toFixed(2)}</div>
                    </button>
                  </ProductQuickView>
                </div>
                
                <div className="relative w-28 h-28 flex-shrink-0">
                  <ProductQuickView product={product}>
                    <button className={cn("relative w-full h-full rounded-2xl overflow-hidden bg-muted", (productIsOffline || isOffline) && "pointer-events-none")}>
                      <img 
                        src={imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {(productIsOffline || isOffline) && (
                        <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center text-center p-2">
                          <span className="text-white font-black text-[10px] uppercase italic tracking-tighter leading-tight border border-white/30 px-2 py-1 rounded-md">Unavailable</span>
                        </div>
                      )}
                    </button>
                  </ProductQuickView>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-1.5 z-20">
                    {productIsOffline || isOffline ? (
                      <div className="w-full h-9 bg-gray-100 text-gray-400 border border-gray-200 rounded-xl flex items-center justify-center font-black text-[9px] uppercase shadow-sm">
                        OFFLINE
                      </div>
                    ) : quantity === 0 ? (
                      <ProductQuickView product={product}>
                        <button 
                          className="w-full h-9 bg-white text-primary border-2 border-primary shadow-lg font-black text-[9px] uppercase rounded-xl active:scale-95 transition-all"
                        >
                          ADD
                        </button>
                      </ProductQuickView>
                    ) : (
                      <div className="flex items-center justify-between w-full h-9 bg-primary text-primary-foreground rounded-xl shadow-lg overflow-hidden">
                        <button onClick={() => removeFromCart(product.id)} className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"><Minus className="h-3 w-3" /></button>
                        <span className="text-xs font-black min-w-[20px] text-center">{quantity}</span>
                        <button onClick={() => addToCart({ ...product, imageUrl })} className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"><Plus className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-muted/50">
            <Utensils className="h-12 w-12 mx-auto text-muted-foreground/10 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}