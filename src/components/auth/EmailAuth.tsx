'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

type AuthView = 'login' | 'signup' | 'forgot';

export function EmailAuth() {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const validateEmail = (email: string) => {
    return String(email).toLowerCase().trim().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!validateEmail(trimmedEmail)) {
      toast({ variant: "destructive", title: "Invalid Email" });
      return;
    }

    if (view === 'signup') {
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Passwords Mismatch" });
        return;
      }
      if (phoneNumber.length !== 10) {
        toast({ variant: "destructive", title: "Invalid Phone", description: "Please enter 10 digits." });
        return;
      }
    }

    setLoading(true);
    try {
      if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: fullName });

        if (firestore) {
          // Save profile to ROOT users collection for Admin visibility
          await setDoc(doc(firestore, 'users', user.uid), {
            fullName,
            phoneNumber,
            email: trimmedEmail,
            uid: user.uid,
            coins: 10,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            role: 'customer'
          }, { merge: true });
        }
        toast({ title: "Welcome to ShopyKart!", description: `Profile created successfully, ${fullName}.` });
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        toast({ title: "Login Successful", description: "Accessing the network." });
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setIsResetSent(true);
      }
    } catch (err: any) {
      let message = "Connection error. Please try again.";
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        message = "Incorrect email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      }
      toast({ variant: "destructive", title: "Access Denied", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="max-w-sm mx-auto w-full space-y-8 py-10">
        
        <div className="flex flex-col items-center text-center space-y-6">
          <Logo className="scale-125 mb-2 border-white/10" />
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
              {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Join ShopyKart' : 'Reset Logic'}
            </h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
              {view === 'login' ? 'Premium Delivery Network' : 'Create your secure identity'}
            </p>
          </div>
        </div>

        {isResetSent ? (
          <div className="text-center space-y-6 w-full animate-in zoom-in duration-300 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
            <div className="mx-auto bg-green-500/10 h-20 w-20 rounded-[1.5rem] flex items-center justify-center border border-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black italic tracking-tighter uppercase text-white">Email Pushed!</h2>
              <p className="text-xs font-bold text-gray-500 uppercase">Check your inbox to finalize reset.</p>
            </div>
            <Button onClick={() => {setIsResetSent(false); setView('login');}} className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase italic shadow-xl">
              BACK TO LOGIN
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleAuth} className="space-y-4">
              {view === 'signup' && (
                <div className="space-y-4">
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="text" 
                      placeholder="FULL NAME" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value.toUpperCase())} 
                      required 
                      className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all" 
                    />
                  </div>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="tel" 
                      placeholder="10 DIGIT PHONE" 
                      value={phoneNumber} 
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                      required 
                      className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all" 
                    />
                  </div>
                </div>
              )}
              
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="email" 
                  placeholder="EMAIL ADDRESS" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value.toLowerCase())} 
                  required 
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all" 
                />
              </div>

              {view !== 'forgot' && (
                <div className="space-y-4">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="password" 
                      placeholder="PASSWORD" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all" 
                    />
                  </div>
                  {view === 'signup' && (
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="password" 
                        placeholder="CONFIRM PASSWORD" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        required 
                        className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all" 
                      />
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl shadow-primary/20 text-lg active:scale-[0.98] transition-all mt-4">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    {view === 'login' ? 'ENTER DASHBOARD' : view === 'signup' ? 'JOIN SHOPYKART' : 'SEND LINK'}
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="flex flex-col items-center gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
                className="text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
              >
                {view === 'login' ? "NEW ON SHOPYKART? REGISTER" : "ALREADY A MEMBER? SIGN IN"}
              </button>
              {view === 'login' && (
                <button 
                  type="button" 
                  onClick={() => setView('forgot')} 
                  className="text-[10px] font-bold uppercase tracking-widest text-primary/60"
                >
                  Forgot Secret Key?
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto pb-10 flex flex-col items-center gap-2 opacity-20">
         <Sparkles className="h-5 w-5 text-white" />
         <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Identity Secured System</p>
      </div>
    </div>
  );
}
