"use client"

import { useState } from 'react';
import { 
  ShoppingCart, 
  ShoppingBag, 
  Search, 
  User, 
  Heart, 
  ChevronRight, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Instagram, 
  Twitter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/components/cart/CartProvider';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function ShopyKartWebsite() {
  const [searchQuery, setSearchQuery] = useState('');
  const { totalItems } = useCart();
  const firestore = useFirestore();
  const router = useRouter();

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);

  const { data: products } = useCollection(productsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: vendors } = useCollection(vendorsQuery);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">
      {/* --- CACHE BUSTER BANNER --- */}
      <div className="bg-yellow-400 text-black py-2 px-6 text-center text-xs font-black tracking-widest border-b-4 border-black">
        SYSTEM UPDATED TO VERSION 2000.0 | IF YOU SEE THIS, THE WEBSITE IS LIVE!
      </div>

      {/* --- TOP BAR --- */}
      <div className="bg-slate-900 text-white py-2 px-6 text-center text-xs font-bold tracking-widest hidden md:block">
        FREE DELIVERY ON ALL ORDERS ABOVE ₹500
      </div>

      {/* --- MAIN NAVIGATION --- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary p-2 rounded-xl rotate-3 group-hover:rotate-0 transition-transform">
              <ShoppingBag className="text-white h-6 w-6" />
            </div>
            <span className="text-2xl font-black italic tracking-tighter">SHOPYKART</span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <Input 
              placeholder="Search for restaurants, dishes or groceries..." 
              className="w-full h-12 pl-12 pr-4 rounded-full bg-slate-100 border-none focus-visible:ring-2 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6">
            <Link href="/profile" className="flex flex-col items-center text-slate-600 hover:text-primary transition-colors">
              <User className="h-6 w-6" />
              <span className="text-[10px] font-bold mt-1 uppercase">Account</span>
            </Link>
            <Link href="/wishlist" className="hidden sm:flex flex-col items-center text-slate-600 hover:text-primary transition-colors">
              <Heart className="h-6 w-6" />
              <span className="text-[10px] font-bold mt-1 uppercase">Wishlist</span>
            </Link>
            <Link href="/cart" className="relative flex flex-col items-center text-slate-600 hover:text-primary transition-colors">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-[10px] font-bold mt-1 uppercase">Cart</span>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* --- HERO SECTION --- */}
      <section className="relative h-[500px] flex items-center bg-slate-900 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop"
          alt="Hero"
          fill
          className="object-cover opacity-50"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-xl text-center md:text-left">
            <Badge className="bg-primary/20 text-primary border-primary/50 mb-4 px-4 py-1 rounded-full text-xs font-black uppercase">
              Now serving in Ranipur & Mauranipur
            </Badge>
            <h1 className="text-5xl md:text-7xl font-black text-white italic leading-[1.1] mb-6">
              Gourmet Food,<br />Delivered <span className="text-primary italic underline underline-offset-8">Fast.</span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 font-medium">
              Experience the finest cuisine from top-rated local restaurants delivered to your doorstep in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button onClick={() => router.push('/menu')} size="lg" className="h-14 px-8 rounded-2xl bg-primary hover:bg-red-600 text-lg font-black uppercase italic">
                Order Now
              </Button>
              <Button variant="outline" size="lg" className="h-14 px-8 rounded-2xl border-white text-white bg-transparent hover:bg-white hover:text-black text-lg font-black uppercase italic">
                View Stores
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* --- CATEGORIES --- */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Explore Categories</h2>
          <Link href="/menu" className="text-primary font-bold flex items-center gap-1 hover:underline">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
          {['Snacks', 'Pizza', 'Burgers', 'Pasta', 'Fries', 'Drinks', 'Dessert'].map((cat, i) => (
            <Link href={`/menu?category=${cat.toLowerCase()}`} key={i} className="group">
              <div className="bg-slate-50 rounded-[2rem] p-6 text-center border border-transparent group-hover:border-primary/20 group-hover:bg-white group-hover:shadow-xl transition-all">
                <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:rotate-6 transition-transform">
                   <img src={`https://picsum.photos/seed/${cat}/100/100`} className="w-10 h-10 object-contain" alt={cat} />
                </div>
                <span className="font-black text-xs uppercase tracking-widest text-slate-700">{cat}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --- FEATURED STORES --- */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-10 text-center">Top Rated Stores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vendors && vendors.length > 0 ? (
              vendors.slice(0, 3).map((vendor: any) => (
                <div key={vendor.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-2xl transition-all border border-slate-100 group">
                  <div className="relative h-48">
                    <img src={vendor.bannerUrl || `https://picsum.photos/seed/${vendor.id}/600/300`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={vendor.storeName} />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-sm">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        <span className="font-black text-sm">{vendor.rating || '4.5'}</span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-2xl font-black italic uppercase mb-2">{vendor.storeName}</h3>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {vendor.town}</span>
                        <span className="flex items-center gap-1">Fast Delivery</span>
                    </div>
                    <Button onClick={() => router.push(`/menu?vendor=${vendor.id}`)} className="w-full h-14 rounded-2xl bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic">
                        Explore Menu
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-slate-400 font-bold uppercase italic">
                Updating store list...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-[#0B0B0B] text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/5 pb-16">
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-6">
                <div className="bg-primary p-2 rounded-xl">
                  <ShoppingBag className="text-white h-5 w-5" />
                </div>
                <span className="text-xl font-black italic tracking-tighter">SHOPYKART</span>
             </div>
             <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
               Providing the fastest food delivery service in local towns. Quality and speed at your doorstep.
             </p>
             <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"><Facebook className="h-5 w-5" /></div>
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"><Instagram className="h-5 w-5" /></div>
                <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-primary transition-colors cursor-pointer"><Twitter className="h-5 w-5" /></div>
             </div>
          </div>

          <div>
             <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-primary">Explore</h4>
             <ul className="space-y-4 text-gray-400 text-sm font-bold uppercase tracking-widest">
                <li><Link href="/menu" className="hover:text-white transition-colors">Menu</Link></li>
                <li><Link href="/orders" className="hover:text-white transition-colors">Track Orders</Link></li>
                <li><Link href="/rewards" className="hover:text-white transition-colors">Rewards</Link></li>
             </ul>
          </div>

          <div>
             <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-primary">Legal</h4>
             <ul className="space-y-4 text-gray-400 text-sm font-bold uppercase tracking-widest">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Refund Policy</a></li>
             </ul>
          </div>

          <div>
             <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-primary">Contact</h4>
             <ul className="space-y-4 text-gray-400 text-sm font-medium">
                <li className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> support@shopykart.co.in</li>
                <li className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +91 XXXX XXXX XX</li>
                <li className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Ranipur, UP, India</li>
             </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-10 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.3em]">
           © 2024 SHOPYKART - ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  );
}
