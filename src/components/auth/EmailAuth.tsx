
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
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

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profileRef = doc(firestore, 'users', user.uid, 'profile', 'data');
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          fullName: user.displayName || 'Google User',
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          coins: 10, 
          createdAt: serverTimestamp(),
          role: 'customer'
        }, { merge: true });
        toast({ title: "Welcome Bonus!", description: "10 Coins added to your wallet!" });
      } else {
        toast({ title: "Welcome!", description: `Logged in as ${user.displayName}` });
      }
    } catch (err: any) {
      // Using console.warn to avoid Next.js Red Screen Overlay
      console.warn("Auth Notification:", err.code);
      
      let errorMsg = "Google login failed. Please try again.";
      
      if (err.code === 'auth/unauthorized-domain') {
        errorMsg = "ACTION REQUIRED: Domain 'shopykart.co.in' is not authorized in Firebase Console. Go to Auth > Settings > Authorized Domains.";
      } else if (err.code === 'auth/popup-blocked') {
        errorMsg = "Browser blocked the login popup. Please allow popups for this site.";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMsg = "Login window was closed before completion.";
      }

      toast({ 
        variant: "destructive", 
        title: "Security Alert", 
        description: errorMsg,
        duration: 8000 
      });
    } finally {
      setLoading(false);
    }
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
    <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in fade-in duration-700 overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-sm mx-auto w-full space-y-10">
        
        <div className="flex flex-col items-center space-y-6">
          <Logo className="scale-125 mb-2" />
          <div className="text-center space-y-1">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">
              {view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Account' : 'Reset Keys'}
            </h1>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              Premium Food Delivery Network
            </p>
          </div>
        </div>

        {isResetSent ? (
          <div className="text-center space-y-6 w-full animate-in zoom-in duration-300">
            <div className="mx-auto bg-green-50 h-24 w-24 rounded-full flex items-center justify-center border border-green-100 shadow-xl shadow-green-100/50">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black italic tracking-tighter uppercase">Reset Link Sent!</h2>
              <p className="text-xs font-bold text-muted-foreground">Check your email inbox to reset your password.</p>
            </div>
            <Button onClick={() => {setIsResetSent(false); setView('login');}} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic shadow-xl active:scale-95 transition-all">
              BACK TO LOGIN
            </Button>
          </div>
        ) : (
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <form onSubmit={handleAuth} className="space-y-4">
              {view === 'signup' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Full Identity</label>
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20 transition-all">
                      <User className="h-4 w-4 text-gray-400 mr-3" />
                      <input type="text" placeholder="Your Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Mobile Number (For Delivery)</label>
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20 transition-all">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <input type="tel" placeholder="10 Digit Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                    </div>
                  </div>
                </>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email Address</label>
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20 transition-all">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                </div>
              </div>

              {view !== 'forgot' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center px-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Secret Key</label>
                    {view === 'login' && <button type="button" onClick={() => setView('forgot')} className="text-[9px] font-black uppercase tracking-widest text-primary">Forgot?</button>}
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20 transition-all">
                    <Lock className="h-4 w-4 text-gray-400 mr-3" />
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-[1.8rem] font-black uppercase italic shadow-xl shadow-primary/20 text-lg active:scale-[0.98] transition-all mt-4">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                  <span className="flex items-center gap-2">
                    {view === 'login' ? 'ENTER HUB' : view === 'signup' ? 'CREATE ACCOUNT' : 'SEND LINK'}
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="space-y-6">
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="flex-shrink mx-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Fast Access</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full h-14 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-gray-50 shadow-sm">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.53v2.77h2.63c1.54-1.42 2.43-3.5 2.43-5.31z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.63-2.77c-.73.49-1.66.78-2.65.78-2.04 0-3.77-1.38-4.39-3.23h-2.72v2.12C8.63 20.44 11.13 23 12 23z" fill="#34A853"/><path d="M7.61 15.12c-.16-.49-.25-1.02-.25-1.56s.09-1.07.25-1.56V9.88H4.89C4.32 11.08 4 12.51 4 14s.32 2.92.89 4.12l2.72-2.12z" fill="#FBBC05"/><path d="M12 7.51c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 4.09 14.97 3 12 3 8.63 3 5.63 5.56 4.89 8.88l2.72 2.12c.62-1.85 2.35-3.23 4.39-3.23z" fill="#EA4335"/></svg>
                <span className="text-sm font-black uppercase tracking-tight">Continue with Google</span>
              </Button>

              <div className="text-center pt-2">
                <button 
                  type="button" 
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
                >
                  {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] absolute bottom-10">
          ShopyKart Private Limited • Secure Auth
        </p>
      </div>
    </div>
  );
}
