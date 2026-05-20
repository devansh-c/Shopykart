'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, ChevronLeft, AlertCircle, Mail, Phone, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  signInAnonymously
} from 'firebase/auth';
import { cn } from '@/lib/utils';
import { EmailAuth } from './EmailAuth';

export function OTPVerification() {
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [billingError, setBillingError] = useState(false);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && auth && !recaptchaVerifierRef.current && authMethod === 'phone') {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        recaptchaVerifierRef.current = verifier;
      } catch (error) {
        console.warn("Recaptcha initialization failed:", error);
      }
    }
    
    return () => {
      if (recaptchaVerifierRef.current) {
        try { recaptchaVerifierRef.current.clear(); } catch(e) {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, [auth, authMethod]);

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      toast({ variant: "destructive", title: "Invalid Number", description: "Enter 10-digit number." });
      return;
    }
    
    if (!auth) return;

    if (!recaptchaVerifierRef.current) {
      toast({ variant: "destructive", title: "Security Error", description: "Recaptcha not ready." });
      return;
    }

    setLoading(true);
    setBillingError(false);
    try {
      const formattedPhone = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      toast({ title: "Verification Sent", description: `OTP pushed to +91 ${phone}` });
    } catch (err: any) {
      if (err.code === 'auth/billing-not-enabled' || err.message.includes('billing')) {
        setBillingError(true);
        toast({ 
          variant: "destructive", 
          title: "SMS Limit", 
          description: "Real SMS requires a paid Firebase plan. Use Demo access." 
        });
      } else {
        toast({ variant: "destructive", title: "Network Error", description: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Premium Access", description: "Logged in via Instant Demo mode." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length < 6 || !confirmationResult) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(code);
      toast({ title: "Access Granted", description: "Welcome to ShopyKart." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "The code entered is incorrect." });
      setOtp(['', '', '', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  if (authMethod === 'email') {
    return (
      <div className="fixed inset-0 z-[110] bg-[#0B0B0B] flex flex-col animate-in fade-in duration-500">
        <div className="p-8">
          <button onClick={() => setAuthMethod('phone')} className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            <ChevronLeft className="h-3 w-3 mr-1" />
            Back to Phone Access
          </button>
        </div>
        <EmailAuth />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-[#0B0B0B] flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div id="recaptcha-container" className="hidden" />
      
      <div className="mt-4 flex justify-between items-center">
        {step === 'otp' ? (
          <button onClick={() => setStep('phone')} className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white transition-all active:scale-90">
            <ChevronLeft className="h-6 w-6" />
          </button>
        ) : <div />}
        
        <button 
          onClick={() => setAuthMethod('email')}
          className="bg-white/5 border border-white/10 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-gray-400 active:scale-95"
        >
          <Mail className="h-3.5 w-3.5" />
          Email Key
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12 py-10">
        <div className="text-left">
          <div className="bg-primary/20 h-16 w-16 rounded-[2rem] flex items-center justify-center text-primary mb-8 border border-primary/20">
            {step === 'phone' ? <Smartphone className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter leading-[0.9] text-white uppercase">
            {step === 'phone' ? <>Fast<br /><span className="text-primary">Access.</span></> : <>Verify<br /><span className="text-primary">Identity.</span></>}
          </h1>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-6 max-w-[200px] leading-relaxed">
            {step === 'phone' ? 'Enter your mobile number to unlock your premium profile.' : `We've pushed a 6-digit code to +91 ${phone}.`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-8">
            <div className="relative group">
              <div className="absolute -left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                 <span className="text-2xl font-black text-gray-600">+91</span>
                 <div className="h-6 w-[1px] bg-white/10" />
              </div>
              <input
                type="tel"
                placeholder="00000 00000"
                value={phone}
                autoFocus
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-transparent border-b-2 border-white/5 py-4 pl-16 text-3xl font-black tracking-tighter text-white focus:outline-none focus:border-primary transition-all placeholder:text-white/5"
              />
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleSendOTP}
                disabled={loading || phone.length < 10}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all text-lg tracking-tighter"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'UNLOCK NOW'}
              </Button>

              {billingError ? (
                <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/5 animate-in slide-in-from-top-4">
                  <div className="flex items-center gap-2 text-amber-500 mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Billing Restricted</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-6 uppercase">
                    Firebase Free Plan detected. Real SMS is disabled. Please use <span className="text-white">Instant Demo Access</span> or switch to <span className="text-white">Email Login</span>.
                  </p>
                  <div className="grid gap-3">
                    <Button
                      onClick={handleDemoLogin}
                      className="w-full h-14 bg-white text-black rounded-2xl font-black text-xs uppercase italic tracking-tighter shadow-xl active:scale-95 transition-all"
                    >
                      ENTER VIA INSTANT DEMO
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setAuthMethod('email')}
                      className="w-full h-12 text-gray-500 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest"
                    >
                      Switch to Email Key
                    </Button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleDemoLogin}
                  className="w-full text-center text-[9px] font-black uppercase tracking-widest text-gray-600 hover:text-primary transition-colors py-2"
                >
                  Skip for testing (Demo Access)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex justify-between gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  autoFocus={idx === 0}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-center text-3xl font-black outline-none focus:border-primary focus:bg-primary/5 transition-all text-white shadow-inner"
                />
              ))}
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all text-lg tracking-tighter"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'GRANT ACCESS'}
              </Button>

              <button 
                onClick={() => setStep('phone')}
                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                Incorrect number? Edit
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-white/10">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">High-End Encryption</p>
          </div>
          <p className="text-[7px] font-black text-white/5 uppercase tracking-widest">ShopyKart Private Limited • All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
