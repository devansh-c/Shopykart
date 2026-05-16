
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Mail, Lock, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { Logo } from '@/components/shared/Logo';

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
        toast({ title: "Account Created", description: "Welcome to ShopyKart!" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome Back", description: "Successfully signed in." });
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (err.code === 'auth/email-already-in-use') msg = "An account already exists with this email.";
      if (err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication settings.";
      }
      
      toast({ variant: "destructive", title: "Auth Error", description: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Demo Mode", description: "Logged in via anonymous access." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="flex justify-center mt-4">
        <Logo />
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-black italic tracking-tighter leading-tight text-foreground">
            {isSignUp ? 'JOIN THE ELITE.' : 'PREMIUM ACCESS.'}
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.25em] mt-3">
            {isSignUp ? 'Create an account to start your journey' : 'Enter your credentials to continue'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">Email Address</label>
               <div className="relative flex items-center bg-muted/30 rounded-2xl p-4 border border-transparent focus-within:border-primary/20 transition-all">
                  <Mail className="h-5 w-5 text-muted-foreground mr-4" />
                  <input
                    type="email"
                    placeholder="name@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-none text-base font-bold tracking-tight focus:outline-none placeholder:text-muted-foreground/40"
                  />
               </div>
            </div>

            <div className="relative group">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-1 block">Password</label>
               <div className="relative flex items-center bg-muted/30 rounded-2xl p-4 border border-transparent focus-within:border-primary/20 transition-all">
                  <Lock className="h-5 w-5 text-muted-foreground mr-4" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border-none text-base font-bold tracking-tight focus:outline-none placeholder:text-muted-foreground/40"
                  />
               </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl shadow-primary/30 active:scale-[0.98] transition-all text-lg tracking-tighter"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN')}
            </Button>

            <div className="flex flex-col items-center gap-6 pt-4">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 decoration-2"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need a new account? Register'}
              </button>
              
              <div className="w-full flex items-center gap-4">
                <div className="h-px bg-muted flex-1" />
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Or</span>
                <div className="h-px bg-muted flex-1" />
              </div>

              <button 
                type="button"
                onClick={handleDemoLogin}
                className="group flex items-center gap-2 px-6 py-3 bg-black rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-black/80 transition-all active:scale-95"
              >
                <Sparkles className="h-3 w-3 text-amber-400" />
                Enter via Demo Mode
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-auto text-center pb-8 pt-12">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/30">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[8px] font-black uppercase tracking-[0.4em]">Secure ShopyKart Infrastructure</p>
        </div>
      </div>
    </div>
  );
}
