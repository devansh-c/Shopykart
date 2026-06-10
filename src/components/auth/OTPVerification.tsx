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
 * @fileOverview OTP Verification with permanent session logic.
 * Code: 788911
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
    // Simulate sending and show notification
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
      toast({ 
        title: "OTP SENT! 📩", 
        description: "Your ShopyKart verification code is 788911",
        duration: 5000 
      });
    }, 1000);
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
      
      // Step 1: Anonymous Auth for identity
      if (auth) {
        const userCredential = await signInAnonymously(auth);
        uid = userCredential.user.uid;
      } else {
        uid = 'user_' + Date.now();
      }

      // Step 2: Save Permanent Data to Firestore
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

      // Step 3: Set Persistent Local Flag
      localStorage.setItem('user_name', formData.fullName.toUpperCase());
      localStorage.setItem('user_phone', formData.phoneNumber);
      localStorage.setItem('shopykart_session_active', 'true');
      localStorage.setItem('user_location_set', 'true');
      localStorage.setItem('show_welcome_bonus', 'true');

      toast({ title: "Verification Successful!", description: "Welcome to ShopyKart." });
      
      // Phase 4: Reload to clear overlay and sync app state
      setTimeout(() => {
        window.location.reload();
      }, 500);

    } catch (err: any) {
      console.error("Auth Error:", err);
      toast({ variant: "destructive", title: "Backend Error", description: "Could not save profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] bg-[#0B0B0B] flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-10 py-10">
        
        <div className="text-left">
          <div className="bg-primary/20 h-16 w-16 rounded-[2rem] flex items-center justify-center text-primary mb-8 border border-primary/20">
            {step === 'details' ? <Sparkles className="h-8 w-8" /> : <KeyRound className="h-8 w-8 animate-pulse" />}
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-[0.9] text-white uppercase">
            {step === 'details' ? 'Elite\n' : 'Verify\n'}<span className="text-primary">{step === 'details' ? 'Access.' : 'Identity.'}</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em] mt-6 max-w-[240px] leading-relaxed">
            {step === 'details' 
              ? 'ENTER YOUR CREDENTIALS TO UNLOCK THE SHOPYKART NETWORK INSTANTLY.' 
              : 'ENTER THE 6-DIGIT CODE SENT TO YOUR MOBILE NUMBER FOR SECURITY.'}
          </p>
        </div>

        {step === 'details' ? (
          <form onSubmit={handleRequestOTP} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input
                  placeholder="YOUR FULL NAME"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase"
                  required
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
                  required
                />
              </div>

              <div className="relative group">
                <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input
                  placeholder="HOUSE NO / AREA / STREET"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-8 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary transition-all uppercase"
                  required
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
                    required
                  />
                </div>
                <div className="relative group">
                  <input
                    type="tel"
                    placeholder="PINCODE"
                    value={formData.pincode}
                    onChange={(e) => setFormData({...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6)})}
                    className="w-full bg-transparent border-b border-white/5 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary transition-all uppercase text-center"
                    required
                  />
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic shadow-xl shadow-primary/20 active:scale-[0.98] transition-all text-lg"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  REQUEST OTP
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
             <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                   <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Verification Code</span>
                   <button type="button" onClick={() => setStep('details')} className="text-[10px] font-black text-primary uppercase tracking-widest">Edit Details</button>
                </div>
                <input
                  type="tel"
                  placeholder="••••••"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white/5 border-2 border-white/5 rounded-3xl py-6 text-center text-4xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-primary transition-all"
                  required
                  autoFocus
                />
                <p className="text-[9px] text-gray-600 font-bold text-center uppercase tracking-widest mt-4">
                  Check your notifications for the code.
                </p>
             </div>

             <Button
                type="submit"
                disabled={loading || otpValue.length !== 6}
                className="w-full h-16 bg-white text-black hover:bg-gray-100 rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-[0.98] transition-all text-lg"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFY & JOIN'}
              </Button>
          </form>
        )}
      </div>

      <div className="mt-auto text-center pb-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-white/10">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">Identity Secured System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
