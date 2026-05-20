'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, MapPin, Building2, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export function OTPVerification() {
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
    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "System Initializing", description: "Please wait a moment." });
      return;
    }

    // Manual Validation for better UX in custom overlay
    if (!formData.fullName.trim()) {
      toast({ variant: "destructive", title: "Missing Name", description: "Please enter your full name." });
      return;
    }
    if (formData.phoneNumber.length !== 10) {
      toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter 10 digits." });
      return;
    }
    if (!formData.address.trim()) {
      toast({ variant: "destructive", title: "Missing Address", description: "Please enter your area/street." });
      return;
    }
    if (formData.pincode.length !== 6) {
      toast({ variant: "destructive", title: "Invalid Pincode", description: "Please enter 6 digits." });
      return;
    }

    setLoading(true);
    try {
      // Create a persistent session
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Save complete profile to ROOT 'users' collection for Admin visibility
      await setDoc(doc(firestore, 'users', user.uid), {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        city: formData.city,
        pincode: formData.pincode,
        uid: user.uid,
        coins: 10, // Welcome Bonus
        createdAt: serverTimestamp(),
        role: 'customer'
      }, { merge: true });

      // Save locally for persistence across sessions
      localStorage.setItem('user_address', `${formData.address}, ${formData.city} - ${formData.pincode}`);
      localStorage.setItem('user_location_set', 'true');

      toast({ title: "Welcome to ShopyKart!", description: "Access granted successfully." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Login Failed", description: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar pointer-events-auto">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-10 py-10">
        <div className="text-left">
          <div className="bg-primary/20 h-16 w-16 rounded-[2rem] flex items-center justify-center text-primary mb-8 border border-primary/20">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-[0.9] text-white uppercase">
            Premium<br /><span className="text-primary">Access.</span>
          </h1>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-6 max-w-[240px] leading-relaxed">
            Enter your details below to unlock the ShopyKart network instantly.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <User className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input
                placeholder="YOUR FULL NAME"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase"
              />
            </div>

            <div className="relative group">
              <Phone className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input
                type="tel"
                placeholder="10 DIGIT PHONE NUMBER"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase"
              />
            </div>

            <div className="relative group">
              <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input
                placeholder="HOUSE NO / AREA / STREET"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <Building2 className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input
                  placeholder="CITY"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full bg-transparent border-b border-white/5 py-3 pl-6 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all uppercase"
                />
              </div>
              <div className="relative group">
                <input
                  type="tel"
                  placeholder="PINCODE"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  className="w-full bg-transparent border-b border-white/5 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all uppercase text-center"
                />
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleQuickLogin}
            disabled={loading}
            className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all text-lg tracking-tighter z-10"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
              <span className="flex items-center gap-2">
                UNLOCK ACCESS
                <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </Button>
        </div>
      </div>

      <div className="mt-auto text-center pb-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-white/10">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">Identity Verified Log</p>
          </div>
          <p className="text-[7px] font-black text-white/5 uppercase tracking-widest">ShopyKart Private Limited • All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
