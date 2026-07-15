'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, MessageCircle, Apple } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useRouter } from 'next/navigation';

type AuthView = 'login' | 'signup';

/**
 * @fileOverview Authentication Layer with Google & Apple integration.
 */
export function EmailAuth() {
  const [view, setView] = useState<AuthView>('signup');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleForgotPassword = () => {
    const adminPhone = "917992090977";
    const message = `Hey ShopyKart Team, I forgot my password. My registered email is: ${email || "[Enter Email Here]"}. Please help me reset it.`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSocialAuth = async (providerName: 'google' | 'apple') => {
    if (!auth || !firestore) return;
    setSocialLoading(providerName);

    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
      } else {
        provider = new OAuthProvider('apple.com');
      }

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        const userData = {
          fullName: firebaseUser.displayName?.toUpperCase() || 'PREMIUM USER',
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          coins: 10, // Welcome Bonus
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          role: 'customer'
        };
        await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);
        localStorage.setItem('show_welcome_bonus', 'true');
      }

      localStorage.setItem('shopykart_session_active', 'true');
      toast({ title: "Authenticated!", description: `Welcome, ${firebaseUser.displayName || 'User'}` });
      
      setTimeout(() => {
        router.replace('/');
      }, 100);
    } catch (err: any) {
      console.error("Social Auth Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Auth Failed", 
        description: "Could not connect with " + providerName 
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAuth = async () => {
    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Wait...", description: "System is initializing." });
      return;
    }

    if (loading || isFinishing) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast({ variant: "destructive", title: "Email Required", description: "Enter valid email." });
      return;
    }

    if (trimmedPass.length < 6) {
      toast({ variant: "destructive", title: "Secure Password", description: "Min 6 characters." });
      return;
    }

    if (view === 'signup') {
      if (!fullName.trim()) {
        toast({ variant: "destructive", title: "Name Required" });
        return;
      }
      if (phoneNumber.trim().length !== 10) {
        toast({ variant: "destructive", title: "Phone Required" });
        return;
      }
      if (trimmedPass !== confirmPassword.trim()) {
        toast({ variant: "destructive", title: "Mismatch" });
        return;
      }
    }

    setLoading(true);

    try {
      if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
        const firebaseUser = userCredential.user;
        setIsFinishing(true);
        await updateProfile(firebaseUser, { displayName: fullName.toUpperCase() });

        const userData = {
          fullName: fullName.toUpperCase(),
          phoneNumber: phoneNumber.trim(),
          email: trimmedEmail,
          uid: firebaseUser.uid,
          coins: 10,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          role: 'customer'
        };

        await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);

        localStorage.setItem('shopykart_session_active', 'true');
        localStorage.setItem('user_name', fullName.toUpperCase());
        localStorage.setItem('show_welcome_bonus', 'true');
        
        toast({ title: "Welcome! ✨", description: "Identity verified." });
        setTimeout(() => router.replace('/'), 100);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
        localStorage.setItem('shopykart_session_active', 'true');
        toast({ title: "Authenticated!" });
        setTimeout(() => router.replace('/'), 100);
      }
    } catch (err: any) {
      setLoading(false);
      setIsFinishing(false);
      let msg = "Check your credentials.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      toast({ variant: "destructive", title: "Auth Error", description: msg });
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar pointer-events-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-sm mx-auto w-full space-y-8 py-10 transform-gpu relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center space-y-6">
          <Logo className="scale-110 mb-2" />
          <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
              {view === 'signup' ? 'Join ShopyKart' : 'Welcome Back'}
            </h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
              Premium Gourmet Delivery
            </p>
          </div>
        </div>

        <div className="w-full space-y-5">
          <div className="space-y-4">
            {view === 'signup' && (
              <>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="FULL NAME" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="tel" 
                    placeholder="10 DIGIT PHONE" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                  />
                </div>
              </>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                value={email} 
                onChange={(e) => setEmail(e.target.value.toLowerCase())} 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                placeholder="PASSWORD" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
              />
            </div>

            {view === 'login' && (
              <div className="flex justify-end px-1">
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="h-3 w-3" />
                  Forgot Password?
                </button>
              </div>
            )}

            {view === 'signup' && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                <input 
                  type="password" 
                  placeholder="CONFIRM PASSWORD" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                />
              </div>
            )}
          </div>

          <button 
            type="button"
            onClick={() => handleAuth()}
            disabled={loading || isFinishing} 
            className="w-full h-18 bg-primary text-white rounded-[2.5rem] font-black uppercase italic shadow-2xl text-xl mt-2 active:scale-95 transition-all py-5 flex items-center justify-center gap-3 disabled:opacity-70 border-b-4 border-black/20"
          >
            {loading || isFinishing ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'signup' ? 'JOIN SHOPYKART' : 'ENTER HUB')}
          </button>

          <div className="relative py-4">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
             <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-[#0B0B0B] px-3 text-gray-500">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button 
              type="button"
              onClick={() => handleSocialAuth('google')}
              disabled={!!socialLoading}
              className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
             >
                {socialLoading === 'google' ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Google</span>
                  </>
                )}
             </button>

             <button 
              type="button"
              onClick={() => handleSocialAuth('apple')}
              disabled={!!socialLoading}
              className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95"
             >
                {socialLoading === 'apple' ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : (
                  <>
                    <Apple className="h-5 w-5 text-white fill-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Apple</span>
                  </>
                )}
             </button>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => { setView(view === 'login' ? 'signup' : 'login'); }} 
              className="text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-full transition-all border border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
            >
              {view === 'login' ? "NEW CUSTOMER? REGISTER" : "ALREADY A MEMBER? SIGN IN"}
            </button>
          </div>
        </div>
      </div>
      
      <p className="mt-auto text-[8px] font-black text-gray-600 uppercase tracking-[0.5em] pb-8">
        ShopyKart Private Limited
      </p>
    </div>
  );
}