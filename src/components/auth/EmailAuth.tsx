'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, CheckCircle2, ArrowRight, Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  OAuthProvider,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

type AuthView = 'login' | 'signup';

/**
 * @fileOverview Premium Authentication with Google, Apple and Email support.
 */
export function EmailAuth() {
  const [view, setView] = useState<AuthView>('signup');
  const [loading, setLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  // SYNCHRONOUS SHIELD: If browser has session flag, self-destruct immediately to prevent UI flash.
  if (typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true') {
    return null;
  }

  // If Firebase confirms user is already here, self-destruct.
  if (user) {
    return null;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const validateEmail = (email: string) => {
    return String(email).toLowerCase().trim().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
  };

  const handleGoogleLogin = async () => {
    if (!auth || !firestore) return;
    setGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          fullName: user.displayName?.toUpperCase() || 'GOOGLE USER',
          email: user.email,
          uid: user.uid,
          coins: 10,
          role: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        localStorage.setItem('show_welcome_bonus', 'true');
      }

      localStorage.setItem('shopykart_session_active', 'true');
      toast({ title: "Google Login Successful" });
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Login Failed", description: "Could not connect to Google Account." });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!auth || !firestore) return;
    setAppleLoading(true);
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const userRef = doc(firestore, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          fullName: user.displayName?.toUpperCase() || 'APPLE USER',
          email: user.email,
          uid: user.uid,
          coins: 10,
          role: 'customer',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        localStorage.setItem('show_welcome_bonus', 'true');
      }

      localStorage.setItem('shopykart_session_active', 'true');
      toast({ title: "Apple Login Successful" });
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        toast({ 
          variant: "destructive", 
          title: "Domain Restricted", 
          description: "Please add this domain to Firebase Console > Auth > Settings > Authorized Domains." 
        });
      } else {
        toast({ variant: "destructive", title: "Apple Login Failed", description: "Could not connect to Apple ID." });
      }
    } finally {
      setAppleLoading(false);
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

        const userData = {
          fullName: fullName.toUpperCase(),
          phoneNumber,
          email: trimmedEmail,
          uid: user.uid,
          coins: 10,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          role: 'customer'
        };

        if (firestore) {
          await setDoc(doc(firestore, 'users', user.uid), userData, { merge: true });
        }

        localStorage.setItem('user_name', fullName.toUpperCase());
        localStorage.setItem('user_phone', phoneNumber);
        localStorage.setItem('shopykart_session_active', 'true');
        localStorage.setItem('show_welcome_bonus', 'true');
        
        toast({ title: "Profile Created!" });
        window.location.reload();
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        localStorage.setItem('shopykart_session_active', 'true');
        toast({ title: "Welcome Back!" });
        window.location.reload();
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        toast({ 
          variant: "destructive", 
          title: "Domain Unauthorized", 
          description: "Firebase Console mein is domain ko whitelist karein." 
        });
      } else {
        toast({ variant: "destructive", title: "Auth Failed", description: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const msg = `Hi Admin, I forgot my ShopyKart password. Email: ${email}`;
    window.open(`https://wa.me/919450355709?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
      <div className="max-w-sm mx-auto w-full space-y-8 py-10">
        <div className="flex flex-col items-center text-center space-y-6">
          <Logo className="scale-125 mb-2 border-white/10" />
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
              {view === 'signup' ? 'Join ShopyKart' : 'Welcome Back'}
            </h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">
              {view === 'signup' ? 'Create your permanent identity' : 'Premium Delivery Network'}
            </p>
          </div>
        </div>

        <div className="w-full space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'signup' && (
              <div className="space-y-4">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
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
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
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
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
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
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
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

            <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl text-lg mt-4">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'signup' ? 'JOIN SHOPYKART' : 'ENTER DASHBOARD')}
            </Button>
          </form>

          <div className="relative py-2 flex items-center justify-center">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
             <span className="relative bg-[#0B0B0B] px-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">OR CONTINUE WITH</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Button 
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="w-full h-14 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl transition-all active:scale-95"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"><path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4"/><path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#4285F4"/><path d="M6.3 14.6C3.6 17.3 2 20.5 2 24s1.6 6.7 4.3 9.4l7.1-7.1C12.4 25.4 12 24.7 12 24s.4-1.4 1.4-2.3l-7.1-7.1z" fill="#FBBC05"/><path d="M24 11c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 15.1 2 7.7 7.3 4.3 14.6l7.1 7.1C13.2 15.6 18.1 11 24 11z" fill="#EA4335"/><path d="M24 37c-5.9 0-10.8-4.6-12.6-10.7l-7.1 7.1C7.7 40.7 15.1 46 24 46c5.6 0 10.6-2.1 14.5-5.5l-7.1-7.1C29.6 35.5 27 37 24 37z" fill="#34A853"/></svg>
                  Google Account
                </span>
              )}
            </Button>

            <Button 
              onClick={handleAppleLogin}
              disabled={appleLoading}
              className="w-full h-14 bg-white text-black hover:bg-gray-100 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl transition-all active:scale-95"
            >
              {appleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>
                  Apple ID
                </span>
              )}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
              className="text-[11px] font-black uppercase tracking-widest px-6 py-3 rounded-full transition-all border border-white/5 text-gray-500 hover:text-white"
            >
              {view === 'login' ? "NEW ON SHOPYKART? REGISTER" : "ALREADY A MEMBER? SIGN IN"}
            </button>
            
            {view === 'login' && (
              <button 
                type="button" 
                onClick={handleForgotPassword} 
                className="text-[10px] font-bold uppercase tracking-widest text-primary/60 flex items-center gap-1.5"
              >
                <MessageCircle className="h-3 w-3" />
                Forgot Password? WhatsApp Admin
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
