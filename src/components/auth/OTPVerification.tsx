"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader2, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';

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
        description: err.message || "Failed to send OTP.",
      });
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
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
        title: "Verified",
        description: "Access granted.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Verification Failed",
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
    <div className="fixed inset-0 z-[110] bg-white flex flex-col items-center justify-center p-8 transition-colors duration-500">
      <div id="recaptcha-container" />
      
      <div className="w-full max-w-sm space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="space-y-6 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-muted/30 rounded-full mb-4">
            <ShieldCheck className="h-8 w-8 text-primary/40" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
              Verification
            </h1>
            <p className="text-sm font-medium text-muted-foreground max-w-[240px] mx-auto">
              {step === 'phone' 
                ? 'Enter your mobile number to securely access ShopyKart.' 
                : 'Enter the 6-digit code sent to your device.'}
            </p>
          </div>
        </div>

        {step === 'phone' ? (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="relative group border-b border-border hover:border-primary transition-colors pb-2">
                <span className="absolute left-0 bottom-3 text-muted-foreground font-black text-lg">+91</span>
                <input
                  type="tel"
                  placeholder="00000 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-transparent border-none pl-12 text-foreground text-2xl tracking-[0.1em] font-black focus:outline-none placeholder:text-muted/20"
                />
              </div>
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-16 bg-primary hover:bg-primary/95 text-white rounded-full font-black uppercase italic tracking-tighter text-lg transition-all active:scale-[0.98] shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </div>
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
                  className="w-full aspect-square bg-muted/20 border-b-2 border-transparent focus:border-primary text-center text-2xl font-black text-foreground outline-none transition-all rounded-xl"
                />
              ))}
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-16 bg-primary hover:bg-primary/95 text-white rounded-full font-black uppercase italic tracking-tighter text-lg transition-all active:scale-[0.98] shadow-sm"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm Code'}
              </Button>
              
              <button 
                onClick={() => setStep('phone')}
                className="w-full py-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Change Number
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-8 opacity-40">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em]">
            Secured via Firebase
          </p>
        </div>
      </div>
    </div>
  );
}
