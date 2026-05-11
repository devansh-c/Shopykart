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
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });
      } catch (error) {
        console.error("Recaptcha initialization failed", error);
      }
    }
    
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
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
    
    if (!auth || !recaptchaVerifierRef.current) {
      toast({
        variant: "destructive",
        title: "Setup Pending",
        description: "Authentication service is starting. Try in a moment.",
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
        title: "OTP Sent",
        description: "A verification code has been sent to your number.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Something went wrong. Please try again.",
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
        description: "Your phone number is now verified.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Wrong OTP",
        description: "The code you entered is incorrect. Please try again.",
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
      
      {/* Top Action */}
      {step === 'otp' && (
        <button 
          onClick={() => setStep('phone')}
          className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-8"
        >
          <ChevronLeft className="h-6 w-6 text-gray-400" />
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            SECURE ACCESS
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter leading-tight">
            {step === 'phone' ? (
              <>Welcome to <br /> <span className="text-primary">ShopyKart</span></>
            ) : (
              <>Enter the <br /> <span className="text-primary">Secret Code</span></>
            )}
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            {step === 'phone' 
              ? 'Enter your mobile number to get started with our premium treats.' 
              : `We've sent a 6-digit verification code to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-10">
            <div className="relative group border-b-2 border-gray-100 focus-within:border-primary transition-all pb-4">
              <div className="flex items-center">
                <span className="text-xl font-black italic text-gray-300 mr-4">+91</span>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-transparent border-none text-2xl font-black italic tracking-tight focus:outline-none placeholder:text-gray-200"
                />
              </div>
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase italic text-lg shadow-2xl shadow-primary/20 transition-all group"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <span className="flex items-center gap-3">
                  CONTINUE
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
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
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-full h-14 bg-gray-50 border-none rounded-2xl text-center text-2xl font-black italic text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              ))}
            </div>
            
            <div className="space-y-6">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-3xl font-black uppercase italic text-lg shadow-2xl shadow-primary/20"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFY CODE'}
              </Button>
              
              <button 
                onClick={() => setStep('phone')}
                className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
              >
                RESEND OTP IN 00:30
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-8 opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">ShopyKart Secure</p>
      </div>
    </div>
  );
}
