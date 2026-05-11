
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
    // Only initialize if auth is available and not already initialized
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
        description: "Firebase Auth is not initialized. Check your .env keys.",
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
        title: "Login Failed",
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
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-in fade-in duration-500">
      <div id="recaptcha-container" className="hidden" />
      
      <div className="mt-8">
        {step === 'otp' && (
          <button 
            onClick={() => setStep('phone')}
            className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center mb-10 transition-transform active:scale-90"
          >
            <ChevronLeft className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {!auth && (
          <div className="mb-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest leading-normal">
              Firebase keys missing in .env file.
            </div>
          </div>
        )}

        <div className="space-y-3 mb-12">
          <h1 className="text-4xl font-black italic tracking-tighter leading-none text-foreground">
            {step === 'phone' ? (
              <>Premium <br /><span className="text-primary">Experience</span></>
            ) : (
              <>Verify <br /><span className="text-primary">Identity</span></>
            )}
          </h1>
          <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em]">
            {step === 'phone' 
              ? 'Login with your phone number' 
              : `Code sent to +91 ${phone}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-10">
            <div className="border-b-2 border-gray-100 focus-within:border-primary transition-all pb-4">
              <div className="flex items-center">
                <span className="text-xl font-black italic text-gray-300 mr-4">+91</span>
                <input
                  type="tel"
                  placeholder="Enter number"
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
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic text-base shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
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
                  className="w-full h-14 bg-gray-50 border-b-2 border-transparent rounded-xl text-center text-xl font-black italic text-foreground outline-none focus:border-primary focus:bg-white transition-all"
                />
              ))}
            </div>
            
            <div className="space-y-6">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 6}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic text-base shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm OTP'}
              </Button>
              
              <button 
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                className="w-full text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors text-center"
              >
                Try different number
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto text-center pb-6">
        <div className="flex items-center justify-center gap-2">
           <ShieldCheck className="h-4 w-4 text-primary opacity-30" />
           <p className="text-[9px] font-black uppercase tracking-widest text-gray-300">
             100% Secure Verification
           </p>
        </div>
      </div>
    </div>
  );
}
