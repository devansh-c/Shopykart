
"use client"

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, ArrowRight, ShieldCheck, Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function OTPVerification({ onVerify }: { onVerify: () => void }) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = () => {
    if (phone.length < 10) {
      toast({
        variant: "destructive",
        title: "Invalid Number",
        description: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "A 4-digit verification code has been sent to your number.",
      });
    }, 1500);
  };

  const handleVerifyOTP = () => {
    const code = otp.join('');
    if (code.length < 4) return;

    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      if (code === '1234') { // Mock success for demo
        localStorage.setItem('shopykart_verified', 'true');
        onVerify();
      } else {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "The OTP entered is incorrect. Try 1234 for demo.",
        });
        setOtp(['', '', '', '']);
      }
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-[#0B0B0B] flex flex-col items-center justify-center p-6">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm aspect-square bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10 mb-4 animate-in zoom-in duration-500">
            {step === 'phone' ? (
              <Phone className="h-10 w-10 text-primary" />
            ) : (
              <ShieldCheck className="h-10 w-10 text-primary" />
            )}
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            {step === 'phone' ? 'Verification' : 'Enter OTP'}
          </h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-[240px]">
            {step === 'phone' 
              ? 'Enter your mobile number to proceed with ShopyKart Premium.' 
              : `Code sent to +91 ${phone.replace(/.(?=.{4})/g, '*')}`}
          </p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold group-focus-within:text-primary transition-colors text-sm">
                +91
              </div>
              <Input
                type="tel"
                placeholder="00000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="h-14 bg-white/5 border-none rounded-2xl pl-14 text-white placeholder:text-gray-700 text-lg tracking-[0.2em] font-black focus-visible:ring-1 focus-visible:ring-primary/50"
              />
            </div>
            <Button
              onClick={handleSendOTP}
              disabled={loading || phone.length < 10}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  SEND OTP
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-center gap-3">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="tel"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-14 h-16 bg-white/5 border-none rounded-2xl text-center text-2xl font-black text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                />
              ))}
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length < 4}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl shadow-primary/20"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'VERIFY & ENTER'}
              </Button>
              <button 
                onClick={() => setStep('phone')}
                className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft className="h-3 w-3" />
                Change Number
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-8">
          <p className="text-[8px] text-gray-700 font-black uppercase tracking-[0.3em]">
            Secure Verification by ShopyKart
          </p>
        </div>
      </div>
    </div>
  );
}
