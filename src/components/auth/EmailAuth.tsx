
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

export function EmailAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const auth = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please enter both email and password." });
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Account Created", description: "Welcome to the world of ShopyKart Elite!" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome Back", description: "Your premium access is now active." });
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = "No elite account found with this email.";
      if (err.code === 'auth/wrong-password') msg = "The password provided is incorrect.";
      if (err.code === 'auth/email-already-in-use') msg = "This email is already part of our elite circle.";
      
      toast({ variant: "destructive", title: "Authentication Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Exclusive Entry", description: "Logged in via VIP Anonymous access." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Access Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-in fade-in duration-700 overflow-y-auto no-scrollbar">
      {/* Top Decoration */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />

      <div className="flex justify-center mt-12 mb-16">
        <div className="scale-125">
          <Logo />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-5xl font-black italic tracking-tighter leading-tight text-foreground">
            {isSignUp ? 'JOIN THE ELITE.' : 'PREMIUM ACCESS.'}
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.4em] mt-3 opacity-60">
            {isSignUp ? 'Create your gourmet identity' : 'Unlock your signature experience'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          <div className="space-y-6">
            <div className="relative group">
               <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Identity (Email)</label>
               <div className={cn(
                 "relative flex items-center bg-gray-50 rounded-2xl p-5 border-2 border-transparent transition-all duration-300",
                 "focus-within:bg-white focus-within:border-primary/20 focus-within:shadow-xl focus-within:shadow-primary/5"
               )}>
                  <Mail className="h-5 w-5 text-gray-400 mr-4 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    placeholder="elite@shopykart.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-none text-base font-bold tracking-tight focus:outline-none placeholder:text-gray-300"
                  />
               </div>
            </div>

            <div className="relative group">
               <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-2 block">Secret Key (Password)</label>
               <div className={cn(
                 "relative flex items-center bg-gray-50 rounded-2xl p-5 border-2 border-transparent transition-all duration-300",
                 "focus-within:bg-white focus-within:border-primary/20 focus-within:shadow-xl focus-within:shadow-primary/5"
               )}>
                  <Lock className="h-5 w-5 text-gray-400 mr-4 group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border-none text-base font-bold tracking-tight focus:outline-none placeholder:text-gray-300"
                  />
               </div>
            </div>
          </div>
          
          <div className="space-y-6 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl shadow-primary/30",
                "active:scale-[0.98] transition-all text-xl tracking-tighter relative overflow-hidden group"
              )}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <div className="flex items-center gap-2">
                  {isSignUp ? 'CREATE ACCOUNT' : 'ENTER HUB'}
                  <ArrowRight className="h-5 w-5 ml-1" />
                </div>
              )}
            </Button>

            <div className="flex flex-col items-center gap-8">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:tracking-[0.25em] transition-all duration-300 underline-offset-8 decoration-1 underline"
              >
                {isSignUp ? 'Already a member? Sign In' : 'New to ShopyKart? Register Now'}
              </button>
              
              <div className="w-full flex items-center gap-6">
                <div className="h-[1px] bg-gray-100 flex-1" />
                <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.5em]">OR</span>
                <div className="h-[1px] bg-gray-100 flex-1" />
              </div>

              <button 
                type="button"
                onClick={handleDemoLogin}
                className="group flex items-center gap-3 px-8 py-4 bg-black rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/10"
              >
                <Sparkles className="h-4 w-4 text-amber-400 group-hover:animate-pulse" />
                VIP DEMO PASS
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-auto text-center pb-12 pt-16">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground/30">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">Secure Elite Infrastructure</p>
          </div>
          <div className="h-1 w-1 bg-primary rounded-full opacity-20" />
        </div>
      </div>
    </div>
  );
}
