
"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, ChevronLeft, AlertCircle, Mail, Phone } from 'lucide-react';
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
    if (auth && !recaptchaVerifierRef.current && authMethod === 'phone') {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        recaptchaVerifierRef.current = verifier;
      } catch (error) {
        console.error("Recaptcha initialization failed:", error);
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
    
    if (!auth) {
      toast({ variant: "destructive", title: "Config Error", description: "Firebase Auth not ready." });
      return;
    }

    if (!recaptchaVerifierRef.current) {
      toast({ variant: "destructive", title: "Recaptcha Error", description: "Recaptcha not initialized." });
      return;
    }

    setLoading(true);
    setBillingError(false);
    try {
      const formattedPhone = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      toast({ title: "OTP Sent", description: `Sent to +91 ${phone}` });
    } catch (err: any) {
      if (err.code === 'auth/billing-not-enabled' || err.message.includes('billing')) {
        setBillingError(true);
        toast({ 
          variant: "destructive", 
          title: "SMS Billing Required", 
          description: "Firebase Spark plan doesn't support real SMS. Use Email or Demo Access." 
        });
      } else {
        toast({ variant: "destructive", title: "Error", description: err.message });
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Demo Mode", description: "Logged in via anonymous access." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
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
    } catch (err: any) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Code is incorrect." });
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
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  if (authMethod === 'email') {
    return (
      <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in fade-in duration-500">
        <div className="p-8">
          <button onClick={() => setAuthMethod('phone')} className="flex items-center text-primary text-[10px] font-black uppercase tracking-widest mb-6">
            <ChevronLeft className="h-3 w-3 mr-1" />
            Back to Phone Auth
          </button>
        </div>
        <EmailAuth />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-in fade-in duration-500">
      <div id="recaptcha-container" className="hidden" />
      
      <div className="mt-4 flex justify-between items-center">
        {step === 'otp' ? (
          <button onClick={() => setStep('phone')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
        ) : <div />}
        
        <button 
          onClick={() => setAuthMethod('email')}
          className="bg-muted px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          <Mail className="h-3 w-3" />
          Use Email
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12">
        <div className="text-left">
          <h1 className="text-4xl font-black italic tracking-tighter leading-tight text-foreground">
            {step === 'phone' ? 'Premium Access.' : 'Confirm Identity.'}
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-3">
            {step === 'phone' ? 'Enter your mobile number to begin' : `Verification code sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-6">
            <div className="relative border-b-2 border-muted focus-within:border-primary transition-colors pb-4">
              <div className="flex items-center">
                <span className="text-2xl font-black text-muted-foreground mr-4">+91</span>
                <input
                  type="tel"
                  placeholder="00000 00000"
                  value={phone}
                  autoFocus
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-transparent border-none text-2xl font-black tracking-tight focus:outline-none placeholder:text-muted"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleSendOTP}
                disabled={loading || phone.length < 10}
                className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 active:scale-[0.98] transition-all text-lg tracking-tighter"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
              </Button>

              {billingError ? (
                <div className="p-5 bg-red-50 rounded-[2rem] border border-red-100 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-red-700 mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Free Plan Limitation</span>
                  </div>
                  <p className="text-[10px] text-red-600/70 font-medium leading-relaxed mb-4 uppercase">
                    Firebase Free Plan par real SMS nahi jaate. Aap <span className="font-black">Email Login</span> use karein ya <span className="font-black">Demo Mode</span> se enter karein.
                  </p>
                  <div className="grid gap-2">
                    <Button
                      onClick={handleDemoLogin}
                      className="w-full h-12 bg-black text-white rounded-xl font-black text-xs uppercase italic tracking-tighter shadow-lg"
                    >
                      Enter via Demo Mode (Instant)
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setAuthMethod('email')}
                      className="w-full h-12 border-red-200 text-red-700 hover:bg-red-100 rounded-xl font-black text-xs uppercase"
                    >
                      <Mail className="h-3 w-3 mr-2" />
                      Switch to Email Login
                    </Button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleDemoLogin}
                  className="w-full text-center text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  Skip for testing (Demo Access)
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
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
                  className="w-full h-14 border-b-2 border-muted text-center text-3xl font-black outline-none focus:border-primary transition-all text-foreground"
                />
              ))}
            </div>
            
            <Button
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length < 6}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 active:scale-[0.98] transition-all text-lg tracking-tighter"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify Access'}
            </Button>

            <button 
              onClick={() => setStep('phone')}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              Change phone number
            </button>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/30">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[8px] font-black uppercase tracking-[0.3em]">Secure High-End Platform</p>
        </div>
      </div>
    </div>
  );
