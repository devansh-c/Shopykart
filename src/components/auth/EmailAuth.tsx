'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, CheckCircle2, ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

type AuthView = 'login' | 'signup';

export function EmailAuth() {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
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
      // MANDATORY ZERO CHECK
      if (phoneNumber.startsWith('0')) {
        toast({ 
          variant: "destructive", 
          title: "Invalid Phone", 
          description: "Any phone number cannot start with zero" 
        });
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
          await setDoc(doc(firestore, 'users', user.uid), {
            fullName: fullName.toUpperCase(),
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

  const handleForgotPassword = () => {
    const msg = `Hi Admin, I forgot my ShopyKart account password. My registered email is: ${email || '[ENTER EMAIL]'}. Please help me reset it.`;
    window.open(`https://wa.me/919450355709?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
      <div className="max-w-sm mx-auto w-full space-y-8 py-10">
        
        <div className="flex flex-col items-center text-center space-y-6">
          <Logo className="scale-125 mb-2 border-white/10" />
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
              {view === 'signup' ? 'Join ShopyKart' : 'Welcome Back'}
            </h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
              {view === 'signup' ? 'Create your secure identity' : 'Premium Delivery Network'}
            </p>
          </div>
        </div>

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
                    onChange={(e) => setFullName(e.target.value)} 
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

            <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl shadow-primary/20 text-lg active:scale-[0.98] transition-all mt-4">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  {view === 'signup' ? 'JOIN SHOPYKART' : 'ENTER DASHBOARD'}
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
              className={cn(
                "text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all border",
                view === 'login' 
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                  : "text-gray-500 border-white/5 hover:text-white"
              )}
            >
              {view === 'login' ? "NEW ON SHOPYKART? REGISTER" : "ALREADY A MEMBER? SIGN IN"}
            </button>
            
            {view === 'login' && (
              <button 
                type="button" 
                onClick={handleForgotPassword} 
                className="text-[10px] font-bold uppercase tracking-widest text-primary/60 flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                Forgot Secret Key? WhatsApp Admin
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-auto pb-10 flex flex-col items-center gap-2 opacity-20">
         <Sparkles className="h-5 w-5 text-white" />
         <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Identity Secured System</p>
      </div>
    </div>
  );
}
