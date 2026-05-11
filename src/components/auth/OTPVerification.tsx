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
        console.log('Initializing Recaptcha...');
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('Recaptcha resolved');
          },
          'expired-callback': () => {
            console.warn('Recaptcha expired, resetting...');
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.clear();
              recaptchaVerifierRef.current = null;
            }
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
      console.error('Auth instance missing');
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Firebase Auth is not ready. Please check your API keys.",
      });
      return;
    }

    if (!recaptchaVerifierRef.current) {
      console.error('Recaptcha verifier missing');
      toast({
        variant: "destructive",
        title: "Security Check Failed",
        description: "Recaptcha was not initialized correctly. Please refresh.",
      });
      return;
    }

    setLoading(true);
    try {
      const formattedPhone = `+91${phone}`;
      console.log('Attempting to send OTP to:', formattedPhone);
      
      const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Verification code sent to +91 " + phone,
      });
    } catch (err: any) {
      console.error('OTP Send Error Details:', err);
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: err.message || "Something went wrong. Check console for details.",
      });
      
      // Reset recaptcha on failure to allow retry
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
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
        title: "Success",
        description: "Verification complete.",
      });
    } catch (err: any) {
      console.error('Verify Error:', err);
      toast({
        variant: "destructive",
        title: "Invalid OTP",
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
      {/* Recaptcha Container MUST be in the DOM */}
      <div id="recaptcha-container" className="hidden" />
      
      {step === 'otp' && (
        <button 
          onClick={() => setStep('phone')}
          className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-8 active:scale-90 transition-transform"
        >
          <ChevronLeft className="h-5 w-5 text-gray-400" />
        </button>
      )}

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="space-y-3 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure Authentication
          </div>
          <h1 className="text-4xl font-black italic tracking-tighter leading-tight text-foreground">
            {step === 'phone' ? (
              <>Welcome to <br /><span className="text-primary italic">ShopyKart</span></>
            ) : (
              <>Verify your <br /><span className="text-primary italic">Number</span></>
            )}
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            {step === 'phone' 
              ? 'Enter your mobile number to get started' 
              : `A 6-digit code has been sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-10">
            <div className="relative group border-b-2 border-gray-100 focus-within:border-primary transition-all pb-4">
              <div className="flex items-center">
                <span className="text-xl font-black italic text-gray-400 mr-4">+91</span>
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={phone}
                  autoFocus
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendOTP()}
                  className="w-full bg-transparent border-none text-2xl font-black italic tracking-tight focus:outline-none placeholder:text-gray-200"
                />
              </div>
            </div>
            
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Get OTP
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
                  autoFocus={idx === 0}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-2xl text-center text-xl font-black italic text-foreground outline-none focus:border-primary focus:bg-white transition-all"
                />
              ))}
            </div>
            
            <div className="space-y-6">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify & Enter'}
              </Button>
              
              <button 
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
              >
                Wrong number? Change it
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-8">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-gray-300">
          ShopyKart Trusted Security
        </p>
      </div>
    </div>
  );
}