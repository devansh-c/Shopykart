"use client"

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, ArrowRight, ShieldCheck, Loader2, ChevronLeft, Lock } from 'lucide-react';
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
        title: "Auth Error",
        description: "Authentication system is not ready.",
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
        description: "Verification code sent successfully.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "Failed to send OTP.",
      });
      // Reset recaptcha on error
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
        description: "Welcome back to ShopyKart!",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Invalid Code",
        description: "The OTP entered is incorrect.",
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
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-sm space-y-12 relative z-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                Shopy<span className="text-primary">Kart</span>
              </h1>
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">Identity Access</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <h2 className="text-2xl font-black italic uppercase tracking-tight text-foreground">
              {step === 'phone' ? 'Hello!' : 'Check Phone'}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">
              {step === 'phone' 
                ? 'Enter your phone number to get started.' 
                : `We've sent a 6-digit code to +91 ${phone.replace(/.(?=.{4})/g, '*')}`}
            </p>
          </div>
        </div>

        {step === 'phone' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mobile Number</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground font-black text-sm">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="00000 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="h-16 bg-muted/30 border-none rounded-2xl pl-14 text-foreground text-lg tracking-[0.1em] font-black focus-visible:ring-2 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-primary/10 group"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between gap-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-full aspect-square bg-muted/40 border-none rounded-2xl text-center text-xl font-black text-foreground focus:ring-2 focus:ring-primary/40 outline-none transition-all"
                />
              ))}
            </div>
            
            <div className="space-y-4">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-primary/10"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Confirm Code'}
              </Button>
              
              <button 
                onClick={() => setStep('phone')}
                className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Edit phone number
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-8 border-t border-border/50">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            By continuing, you agree to our terms
          </p>
        </div>
      </div>
    </div>
  );
}
