
"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Shield } from 'lucide-react';
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
        description: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }
    
    if (!auth || !recaptchaVerifierRef.current) {
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Authentication is initializing. Please try again.",
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
        title: "Code Sent",
        description: "Check your messages for the verification code.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Could not send OTP. Please check your network.",
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
        title: "Welcome",
        description: "Identity verified successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Invalid code. Please try again.",
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
    <div className="fixed inset-0 z-[110] bg-white flex flex-col items-center justify-center p-8">
      <div id="recaptcha-container" />
      
      <div className="w-full max-w-sm space-y-24 animate-in fade-in duration-1000">
        <div className="space-y-4 text-center">
          <div className="flex justify-center mb-8">
            <h1 className="text-3xl font-extralight tracking-tighter">
              SHOPY<span className="font-bold text-primary">KART</span>
            </h1>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-light tracking-tight text-foreground">
              {step === 'phone' ? 'Welcome' : 'Verify Identity'}
            </h2>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.2em]">
              {step === 'phone' 
                ? 'Continue with your mobile' 
                : 'Enter the 6-digit code'}
            </p>
          </div>
        </div>

        {step === 'phone' ? (
          <div className="space-y-12">
            <div className="relative group border-b border-gray-100 hover:border-primary transition-colors pb-4 flex items-center">
              <span className="text-muted-foreground font-light text-xl mr-4">+91</span>
              <input
                type="tel"
                placeholder="00000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full bg-transparent border-none text-foreground text-2xl font-light tracking-[0.1em] focus:outline-none placeholder:text-gray-200"
              />
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              variant="ghost"
              className="w-full h-12 text-xs font-medium uppercase tracking-[0.3em] hover:bg-transparent hover:text-primary transition-all group"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-full h-12 bg-transparent border-b border-gray-100 focus:border-primary text-center text-xl font-light text-foreground outline-none transition-all"
                />
              ))}
            </div>
            
            <div className="space-y-6">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-none font-medium uppercase tracking-[0.2em] text-[10px] shadow-none"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
              </Button>
              
              <button 
                onClick={() => setStep('phone')}
                className="w-full text-[9px] font-medium uppercase tracking-[0.4em] text-muted-foreground hover:text-primary transition-colors"
              >
                Change Number
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-20">
          <p className="text-[8px] text-muted-foreground/30 font-medium uppercase tracking-[0.5em] flex items-center justify-center gap-2">
            <Shield className="h-3 w-3" />
            SECURE VERIFICATION
          </p>
        </div>
      </div>
    </div>
  );
}
