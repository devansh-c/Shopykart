'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, MapPin, Building2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Handles zero-OTP quick access with domain error fallback.
 */
export function QuickAccess() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    city: '',
    pincode: '',
  });
  
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (!formData.fullName.trim() || formData.phoneNumber.length !== 10 || !formData.address.trim() || formData.pincode.length !== 6) {
      toast({ variant: "destructive", title: "Incomplete Details" });
      return;
    }

    setLoading(true);
    try {
      let uid = '';
      
      try {
        if (auth) {
          const userCredential = await signInAnonymously(auth);
          uid = userCredential.user.uid;
        }
      } catch (authErr: any) {
        // Fallback for unauthorized domains during development
        uid = 'guest_' + Math.random().toString(36).substr(2, 9);
        console.warn("Auth Domain Restricted. Using Local Identity.");
      }

      await setDoc(doc(firestore, 'users', uid), {
        fullName: formData.fullName.toUpperCase(),
        phoneNumber: formData.phoneNumber,
        address: formData.address.toUpperCase(),
        city: formData.city.toUpperCase(),
        pincode: formData.pincode,
        uid: uid,
        coins: 10,
        createdAt: serverTimestamp(),
        role: 'customer'
      }, { merge: true });

      localStorage.setItem('user_name', formData.fullName.toUpperCase());
      localStorage.setItem('shopykart_session_active', 'true');
      localStorage.setItem('user_location_set', 'true');

      toast({ title: "Welcome to ShopyKart!" });
      window.location.reload();
    } catch (err: any) {
      toast({ variant: "destructive", title: "System Busy", description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col p-8 animate-in fade-in duration-300 overflow-y-auto no-scrollbar pointer-events-auto">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-10 py-10">
        <div className="text-left">
          <div className="bg-primary/20 h-16 w-16 rounded-[2rem] flex items-center justify-center text-primary mb-8 border border-primary/20">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-[0.9] text-white uppercase">
            Premium<br /><span className="text-primary">Access.</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-6 max-w-[240px] leading-relaxed">
            NO OTP REQUIRED. ENTER DETAILS TO UNLOCK THE SHOPYKART NETWORK INSTANTLY.
          </p>
        </div>

        <form onSubmit={handleQuickLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input placeholder="YOUR FULL NAME" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase" required />
            </div>
            <div className="relative group">
              <Phone className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input type="tel" placeholder="10 DIGIT PHONE NUMBER" value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})} className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase" required />
            </div>
            <div className="relative group">
              <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
              <input placeholder="HOUSE NO / STREET" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="CITY" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full bg-transparent border-b border-white/5 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all uppercase" required />
              <input type="tel" placeholder="PINCODE" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})} className="w-full bg-transparent border-b border-white/5 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all uppercase text-center" required />
            </div>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-[0.98] transition-all text-lg tracking-tighter">
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "UNLOCK ACCESS"}
          </Button>
        </form>
      </div>
    </div>
  );
}
