'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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

    setLoading(true);
    try {
      if (view === 'signup') {
        if (!fullName.trim() || phoneNumber.length !== 10 || password.length < 6) {
          throw new Error("Phone must be 10 digits and Password 6+ characters.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: fullName });

        if (firestore) {
          await setDoc(doc(firestore, 'users', user.uid, 'profile', 'data'), {
            fullName,
            phoneNumber,
            email: trimmedEmail,
            coins: 10,
            createdAt: serverTimestamp(),
            role: 'customer'
          }, { merge: true });
        }
        toast({ title: "Welcome Bonus!", description: `Account created with 10 Coins, ${fullName}!` });
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        toast({ title: "Identity Verified" });
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setIsResetSent(true);
      }
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = "Wrong email or password.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "Email is already registered.";
      }
      toast({ variant: "destructive", title: "Access Denied", description: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-sm mx-auto w-full space-y-10 bg-[#0B0B0B] text-white">
      
      <div className="flex flex-col items-center space-y-6">
        <Logo className="scale-125 mb-2 border-white/10" />
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">
            {view === 'login' ? 'Email Access' : view === 'signup' ? 'Create Key' : 'Reset Logic'}
          </h1>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            Premium Network Hub
          </p>
        </div>
      </div>

      {isResetSent ? (
        <div className="text-center space-y-6 w-full animate-in zoom-in duration-300">
          <div className="mx-auto bg-green-500/10 h-24 w-24 rounded-[2.5rem] flex items-center justify-center border border-green-500/20 shadow-2xl">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic tracking-tighter uppercase">Link Pushed!</h2>
            <p className="text-xs font-bold text-gray-500 uppercase">Check your inbox to finalize reset.</p>
          </div>
          <Button onClick={() => {setIsResetSent(false); setView('login');}} className="w-full h-16 bg-white text-black rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all">
            BACK TO LOGIN
          </Button>
        </div>
      ) : (
        <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleAuth} className="space-y-5">
            {view === 'signup' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 ml-3">Identity Name</label>
                  <div className="bg-white/5 rounded-2xl p-4 flex items-center border border-white/5 focus-within:border-primary/40 transition-all">
                    <User className="h-4 w-4 text-gray-600 mr-3" />
                    <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none text-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 ml-3">Contact Number</label>
                  <div className="bg-white/5 rounded-2xl p-4 flex items-center border border-white/5 focus-within:border-primary/40 transition-all">
                    <Phone className="h-4 w-4 text-gray-600 mr-3" />
                    <input type="tel" placeholder="10 Digits" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none text-white" />
                  </div>
                </div>
              </>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-gray-600 ml-3">Email Address</label>
              <div className="bg-white/5 rounded-2xl p-4 flex items-center border border-white/5 focus-within:border-primary/40 transition-all">
                <Mail className="h-4 w-4 text-gray-600 mr-3" />
                <input type="email" placeholder="name@domain.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none text-white" />
              </div>
            </div>

            {view !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-3">
                  <label className="text-[9px] font-black uppercase tracking-widest text-gray-600">Secret Key</label>
                  {view === 'login' && <button type="button" onClick={() => setView('forgot')} className="text-[9px] font-black uppercase tracking-widest text-primary">Lost it?</button>}
                </div>
                <div className="bg-white/5 rounded-2xl p-4 flex items-center border border-white/5 focus-within:border-primary/40 transition-all">
                  <Lock className="h-4 w-4 text-gray-600 mr-3" />
                  <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none text-white" />
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-[2.2rem] font-black uppercase italic shadow-2xl shadow-primary/20 text-lg active:scale-[0.98] transition-all mt-4 border-b-4 border-black/20">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  {view === 'login' ? 'ENTER SYSTEM' : view === 'signup' ? 'REGISTER' : 'SEND LINK'}
                  <ArrowRight className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>

          <div className="text-center pt-4">
            <button 
              type="button" 
              onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-opacity"
            >
              {view === 'login' ? "New here? Create Profile" : "Existing Member? Sign In"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
