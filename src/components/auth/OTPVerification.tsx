
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
          callback: () => {
            console.log('Recaptcha resolved');
          }
        });
        recaptchaVerifierRef.current = verifier;
      } catch (error) {
        console.error("Recaptcha initialization failed", error);
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
        title: "Auth Error",
        description: "Firebase Auth is not initialized. Check your API keys.",
      });
      return;
    }

    if (!recaptchaVerifierRef.current) {
      toast({
        variant: "destructive",
        title: "Setup Pending",
        description: "Security check is initializing. Please wait a second.",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      console.log('Sending OTP to:', formattedPhone);
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Verification code sent to your number.",
      });
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: err.message || "Please check your network or Firebase configuration.",
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
        title: "Success",
        description: "Verified successfully.",
      });
    } catch (err: any) {
      console.error('Verify Error:', err);
      toast({
        variant: "destructive",
        title: "Wrong OTP",
        description: "The code you entered is incorrect.",
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
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8">
      <div id="recaptcha-container" />
      
      {step === 'otp' && (
        <button 
          onClick={() => setStep('phone')}
          className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-8"
        >
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5f259f]/10 text-[#5f259f] text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            SECURE ACCESS
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter leading-tight">
            {step === 'phone' ? (
              <>Hello, <br /> <span className="text-[#5f259f]">Welcome</span></>
            ) : (
              <>Verify <br /> <span className="text-[#5f259f]">Account</span></>
            )}
          </h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {step === 'phone' 
              ? 'Enter number to continue' 
              : `Code sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-10">
            <div className="relative group border-b border-gray-100 focus-within:border-[#5f259f] transition-all pb-4">
              <div className="flex items-center">
                <span className="text-xl font-black italic text-gray-300 mr-4">+91</span>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-transparent border-none text-2xl font-black italic tracking-tight focus:outline-none placeholder:text-gray-100"
                />
              </div>
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-14 bg-[#5f259f] hover:bg-[#4d1e82] text-white rounded-2xl font-black uppercase italic shadow-xl shadow-[#5f259f]/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  CONTINUE
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
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
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-full h-12 bg-gray-50 border-none rounded-xl text-center text-xl font-black italic text-foreground outline-none focus:ring-1 focus:ring-[#5f259f]/20 transition-all"
                />
              ))}
            </div>
            
            <div className="space-y-6">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-14 bg-[#5f259f] hover:bg-[#4d1e82] text-white rounded-2xl font-black uppercase italic shadow-xl shadow-[#5f259f]/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'VERIFY CODE'}
              </Button>
              
              <button 
                onClick={() => setStep('phone')}
                className="w-full text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-[#5f259f] transition-colors"
              >
                REQUEST NEW CODE
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-8 opacity-20">
        <p className="text-[8px] font-black uppercase tracking-[0.5em]">ShopyKart Secure Platform</p>
      </div>
    </div>
  );
}
