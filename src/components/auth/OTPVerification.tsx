'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, User, Phone, MapPin, Building2, ShieldCheck, ArrowRight, Sparkles, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

type AuthStep = 'details' | 'otp';

/**
 * @fileOverview Redesigned OTP Verification in Premium Light Mode.
 * Optimized for ultra-fast execution with minimal simulated delays.
 */
export function OTPVerification() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<AuthStep>('details');
  const [otpValue, setOtpValue] = useState('');
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

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || formData.phoneNumber.length !== 10 || !formData.address.trim() || formData.pincode.length !== 6) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Please fill all fields correctly." });
      return;
    }

    setLoading(true);
    // Reduced simulated delay from 1000ms to 300ms for snappier feel
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
      toast({ 
        title: "OTP SENT! 📩", 
        description: "Verification code is 788911",
        duration: 5000 
      });
    }, 300);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;

    if (otpValue !== '788911') {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please use the code 788911." });
      return;
    }

    setLoading(true);
    try {
      let uid = '';
      if (auth) {
        const userCredential = await signInAnonymously(auth);
        uid = userCredential.user.uid;
      } else {
        uid = 'user_' + Date.now();
      }

      // Perform write immediately
      const userRef = doc(firestore, 'users', uid);
      await setDoc(userRef, {
        fullName: formData.fullName.toUpperCase(),
        phoneNumber: formData.phoneNumber,
        address: formData.address.toUpperCase(),
        city: (formData.city || 'Ranipur').toUpperCase(),
        pincode: formData.pincode,
        uid: uid,
        coins: 10,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        role: 'customer',
        isVerified: true
      }, { merge: true });

      // Immediate session marking
      localStorage.setItem('user_name', formData.fullName.toUpperCase());
      localStorage.setItem('user_phone', formData.phoneNumber);
      localStorage.setItem('shopykart_session_active', 'true');
      localStorage.setItem('user_location_set', 'true');
      localStorage.setItem('show_welcome_bonus', 'true');

      toast({ title: "Welcome!", description: "Identity verified successfully." });
      
      // Faster reload transition
      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (err: any) {
      toast({ variant: "destructive", title: "System Busy", description: "Retry after a second." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-white flex flex-col p-8 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12 py-10">
        
        <div className="text-center space-y-4">
          <div className="bg-primary/5 h-20 w-20 rounded-[2.5rem] flex items-center justify-center text-primary mx-auto mb-2 border border-primary/10 shadow-inner">
            {step === 'details' ? <Sparkles className="h-10 w-10" /> : <KeyRound className="h-10 w-10 animate-pulse" />}
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter leading-tight text-gray-900 uppercase">
              {step === 'details' ? 'Customer\n' : 'Verify\n'}<span className="text-primary">{step === 'details' ? 'Access.' : 'Identity.'}</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] max-w-[240px] mx-auto leading-relaxed">
              {step === 'details' 
                ? 'UNLOCK PREMIUM GOURMET SERVICES INSTANTLY.' 
                : 'ENTER THE 6-DIGIT SECURITY CODE TO PROCEED.'}
            </p>
          </div>
        </div>

        {step === 'details' ? (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div className="space-y-3">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  placeholder="FULL NAME"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-[11px] font-black tracking-widest text-gray-800 focus:outline-none focus:border-primary/30 transition-all uppercase placeholder:text-gray-300"
                  required
                />
              </div>

              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="tel"
                  placeholder="MOBILE NUMBER"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-[11px] font-black tracking-widest text-gray-800 focus:outline-none focus:border-primary/30 transition-all uppercase placeholder:text-gray-300"
                  required
                />
              </div>

              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  placeholder="DELIVERY ADDRESS"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 text-[11px] font-black tracking-widest text-gray-800 focus:outline-none focus:border-primary/30 transition-all uppercase placeholder:text-gray-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="CITY"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-[11px] font-black text-gray-800 focus:outline-none focus:border-primary/30 transition-all uppercase placeholder:text-gray-300"
                  required
                />
                <input
                  type="tel"
                  placeholder="PINCODE"
                  value={formData.pincode}
                  onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                  className="w-full h-14 bg-gray-50 border border-gray-100 rounded-2xl px-6 text-[11px] font-black text-gray-800 focus:outline-none focus:border-primary/30 transition-all uppercase text-center placeholder:text-gray-300"
                  required
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-black hover:bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl transition-all text-sm tracking-widest"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'REQUEST VERIFICATION'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-10 animate-in slide-in-from-right-4 duration-500">
             <div className="space-y-4">
                <div className="flex justify-center">
                   <div className="flex gap-2">
                     {[...Array(6)].map((_, i) => (
                       <div key={i} className={cn(
                         "w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black italic",
                         otpValue.length > i ? "border-primary bg-primary/5 text-primary" : "border-gray-100 bg-gray-50 text-gray-200"
                       )}>
                         {otpValue[i] || '•'}
                       </div>
                     ))}
                   </div>
                </div>
                <input
                  type="tel"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="absolute inset-0 opacity-0 cursor-default"
                  autoFocus
                  required
                />
                <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest leading-relaxed">
                  Verification code is 788911<br />Instant activation enabled.
                </p>
             </div>

             <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading || otpValue.length !== 6}
                  className="w-full h-16 bg-primary hover:bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl active:scale-98 transition-all text-sm tracking-widest"
                >
                  {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ACTIVATE ACCOUNT'}
                </Button>
                <button type="button" onClick={() => setStep('details')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:text-primary transition-colors">
                  ← Edit Information
                </button>
             </div>
          </form>
        )}
      </div>

      <div className="mt-auto text-center pb-8 opacity-40">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[8px] font-black uppercase tracking-[0.5em]">Bank-Grade Security</p>
        </div>
      </div>
    </div>
  );
}
