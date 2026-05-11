
"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, ShieldCheck, ChevronLeft } from 'lucide-react';
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
  }, [auth]);

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      toast({ variant: "destructive", title: "Invalid Number", description: "Enter 10-digit number." });
      return;
    }
    
    if (!auth || !recaptchaVerifierRef.current) {
      toast({ variant: "destructive", title: "Wait", description: "System initializing..." });
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      toast({ title: "OTP Sent", description: `Sent to +91 ${phone}` });
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

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-10 animate-in fade-in duration-700">
      <div id="recaptcha-container" className="hidden" />
      
      <div className="mt-4">
        {step === 'otp' && (
          <button onClick={() => setStep('phone')} className="h-10 w-10 flex items-center justify-center text-gray-400">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-16">
          <h1 className="text-4xl font-black italic tracking-tighter leading-none mb-3">
            {step === 'phone' ? 'Hello.' : 'Verify.'}
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">
            {step === 'phone' ? 'Login with mobile' : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-12">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center">
                <span className="text-2xl font-black text-gray-200 mr-4">+91</span>
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={phone}
                  autoFocus
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-transparent border-none text-2xl font-black tracking-tight focus:outline-none placeholder:text-gray-100"
                />
              </div>
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-14 bg-[#5f259f] hover:bg-[#4a1d7d] text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
            </Button>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  autoFocus={idx === 0}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-full h-12 border-b-2 border-gray-100 text-center text-2xl font-black outline-none focus:border-[#5f259f] transition-all"
                />
              ))}
            </div>
            
            <Button
              onClick={handleVerifyOTP}
              disabled={loading || otp.join('').length < 6}
              className="w-full h-14 bg-[#5f259f] hover:bg-[#4a1d7d] text-white rounded-2xl font-black uppercase italic shadow-lg active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify OTP'}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-8 flex items-center justify-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#5f259f] opacity-30" />
        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-gray-300">Secure Premium Access</p>
      </div>
    </div>
  );
}
