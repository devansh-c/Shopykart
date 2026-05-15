
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';

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
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-12">
        <div className="text-left">
          <h1 className="text-4xl font-black italic tracking-tighter leading-tight text-foreground">
            {isSignUp ? 'Join the Elite.' : 'Premium Access.'}
          </h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] mt-3">
            {isSignUp ? 'Create an account to start your journey' : 'Enter your credentials to continue'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-4">
            <div className="relative border-b-2 border-muted focus-within:border-primary transition-colors pb-2">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-muted-foreground mr-4" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-transparent border-none text-lg font-bold tracking-tight focus:outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <div className="relative border-b-2 border-muted focus-within:border-primary transition-colors pb-2">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-muted-foreground mr-4" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-transparent border-none text-lg font-bold tracking-tight focus:outline-none placeholder:text-muted"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 active:scale-[0.98] transition-all text-lg tracking-tighter"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            <div className="flex items-center justify-between px-2 pt-2">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
              >
                {isSignUp ? 'Already have an account?' : 'Need an account?'}
              </button>
              <button 
                type="button"
                onClick={handleDemoLogin}
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Skip to Demo
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-auto text-center pb-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/30">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[8px] font-black uppercase tracking-[0.3em]">Secure High-End Platform</p>
        </div>
      </div>
    </div>
  );
}
