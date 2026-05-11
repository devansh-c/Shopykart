"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, ShieldCheck, ChevronLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';
import { cn } from '@/lib/utils';

export function OTPVerification() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']); 
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  
  const { toast } = useToast();
  const auth = useAuth();

  useEffect(() => {
    if (auth && !recaptchaVerifierRef.current) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('Recaptcha resolved');
          }
        });
        recaptchaVerifierRef.current = verifier;
      } catch (error) {
        console.error("Recaptcha initialization failed:", error);
      }
    }
    
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch(e) {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, [auth]);

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Number",
        description: "Please enter your 10-digit mobile number.",
      });
      return;
    }
    
    if (!auth) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Firebase API Keys are missing. Please add NEXT_PUBLIC_FIREBASE_API_KEY to your env.",
      });
      return;
    }

    if (!recaptchaVerifierRef.current) {
      toast({
        variant: "destructive",
        title: "Security Initialization",
        description: "Recaptcha is still initializing. Please wait a moment.",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      toast({
        title: "Verification Sent",
        description: "A 6-digit code was sent to +91 " + phone,
      });
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: err.message || "Failed to send OTP. Check your connection or API keys.",
      });
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
      toast({
        title: "Authenticated",
        description: "Welcome back!",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Incorrect Code",
        description: "The OTP entered is invalid. Please try again.",
      });
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

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-10 animate-in fade-in duration-700">
      <div id="recaptcha-container" className="hidden" />
      
      {step === 'otp' && (
        <button 
          onClick={() => setStep('phone')}
          className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-10 active:scale-90 transition-transform"
        >
          <ChevronLeft className="h-6 w-6 text-gray-400" />
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {!auth && (
          <div className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-normal">
              Backend not connected. Please provide Firebase API keys to enable SMS login.
            </div>
          </div>
        )}

        <div className="space-y-4 mb-16">
          <h1 className="text-5xl font-black italic tracking-tighter leading-[0.9] text-foreground">
            {step === 'phone' ? (
              <>Sign in to <br /><span className="text-primary italic">Premium</span></>
            ) : (
              <>Check your <br /><span className="text-primary italic">Messages</span></>
            )}
          </h1>
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.25em] leading-relaxed">
            {step === 'phone' 
              ? 'Enter your phone number to proceed with ShopyKart' 
              : `A verification code was sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-12">
            <div className="relative group border-b-2 border-gray-100 focus-within:border-primary transition-all pb-6">
              <div className="flex items-center">
                <span className="text-2xl font-black italic text-gray-300 mr-6">+91</span>
                <input
                  type="tel"
                  placeholder="00000 00000"
                  value={phone}
                  autoFocus
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                  className="w-full bg-transparent border-none text-3xl font-black italic tracking-tighter focus:outline-none placeholder:text-gray-100"
                />
              </div>
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-2xl shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
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
                  className="w-full h-16 bg-gray-50 border-2 border-transparent rounded-[1.5rem] text-center text-2xl font-black italic text-foreground outline-none focus:border-primary focus:bg-white transition-all"
                />
              ))}
            </div>
            
            <div className="space-y-8">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-2xl shadow-primary/30 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Verify Account'}
              </Button>
              
              <button 
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors text-center"
              >
                Change Phone Number
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
           <ShieldCheck className="h-4 w-4 text-primary opacity-40" />
           <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300">
             End-to-End Encrypted
           </p>
        </div>
      </div>
    </div>
  );
}