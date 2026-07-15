'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, Apple, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { Logo } from '@/components/shared/Logo';
import { useRouter } from 'next/navigation';

type AuthView = 'login' | 'signup' | 'forgot-password';

export function EmailAuth() {
  const [view, setView] = useState<AuthView>('signup');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
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
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleSocialAuth = async (providerName: 'google' | 'apple') => {
    if (!auth || !firestore) return;
    setSocialLoading(providerName);

    try {
      let provider;
      if (providerName === 'google') {
        provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
      } else {
        provider = new OAuthProvider('apple.com');
      }

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const userDocRef = doc(firestore, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const userData = {
          fullName: firebaseUser.displayName?.toUpperCase() || 'PREMIUM USER',
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          coins: 10,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          role: 'customer'
        };
        await setDoc(userDocRef, userData);
        localStorage.setItem('show_welcome_bonus', 'true');
      }

      localStorage.setItem('shopykart_session_active', 'true');
      toast({ title: "Welcome!", description: `Hello, ${firebaseUser.displayName || 'User'}` });
      setTimeout(() => router.replace('/'), 100);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        toast({ 
          variant: "destructive", 
          title: "Domain Not Authorized", 
          description: `Firebase Console > Auth > Settings mein "${currentDomain}" add karein.`,
          duration: 10000
        });
      } else if (err.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: "Auth Failed", description: "Please use Email/Password to login." });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAuth = async () => {
    if (!auth || !firestore || loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedEmail.includes('@')) {
      toast({ variant: "destructive", title: "Invalid Email" });
      return;
    }

    setLoading(true);
    try {
      if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
        const firebaseUser = userCredential.user;
        await updateProfile(firebaseUser, { displayName: fullName.toUpperCase() });

        await setDoc(doc(firestore, 'users', firebaseUser.uid), {
          fullName: fullName.toUpperCase(),
          phoneNumber: phoneNumber.trim(),
          email: trimmedEmail,
          uid: firebaseUser.uid,
          coins: 10,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          role: 'customer'
        });

        localStorage.setItem('shopykart_session_active', 'true');
        localStorage.setItem('show_welcome_bonus', 'true');
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPass);
        localStorage.setItem('shopykart_session_active', 'true');
      }
      toast({ title: "Authenticated!" });
      setTimeout(() => router.replace('/'), 100);
    } catch (err: any) {
      setLoading(false);
      toast({ variant: "destructive", title: "Auth Error", description: "Invalid credentials or account exists." });
    }
  };

  const handleForgotPassword = async () => {
    if (!auth || !email.trim()) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your email address first." });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      toast({ title: "Email Sent! 📩", description: "Check your inbox for password reset instructions." });
      setView('login');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: "User not found or connection failed." });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar pointer-events-auto">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-sm mx-auto w-full space-y-8 py-10 transform-gpu relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex flex-col items-center text-center space-y-6">
          <Logo className="scale-110 mb-2" />
          <div className="space-y-1">
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">
              {view === 'signup' ? 'Join Now' : view === 'forgot-password' ? 'Reset Pin' : 'Welcome Back'}
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
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
                  <input type="text" placeholder="FULL NAME" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all uppercase" />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
                  <input type="tel" placeholder="10 DIGIT PHONE" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all" />
                </div>
              </>
            )}
            
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
              <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={(e) => setEmail(e.target.value.toLowerCase())} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all uppercase" />
            </div>

            {view !== 'forgot-password' && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
                <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black text-white focus:outline-none focus:border-primary/50 transition-all" />
              </div>
            )}
          </div>

          {view === 'login' && (
            <div className="flex justify-end px-1">
              <button onClick={() => setViewState('forgot-password')} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline underline-offset-4">
                Forgot Password?
              </button>
            </div>
          )}

          <button 
            onClick={() => view === 'forgot-password' ? handleForgotPassword() : handleAuth()} 
            disabled={loading} 
            className="w-full h-18 bg-primary text-white rounded-[2.5rem] font-black uppercase italic shadow-2xl text-xl mt-2 active:scale-95 transition-all py-5 flex items-center justify-center"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'signup' ? 'JOIN NOW' : view === 'forgot-password' ? 'SEND RESET LINK' : 'SIGN IN')}
          </button>

          {view !== 'forgot-password' ? (
            <>
              <div className="relative py-4">
                 <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                 <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-[#0B0B0B] px-3 text-gray-500">Fast Connect</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handleSocialAuth('google')} disabled={!!socialLoading} className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95">
                    {socialLoading === 'google' ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : (
                      <>
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="text-[10px] font-black text-white uppercase">Google</span>
                      </>
                    )}
                 </button>

                 <button onClick={() => handleSocialAuth('apple')} disabled={!!socialLoading} className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95">
                    {socialLoading === 'apple' ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : (
                      <>
                        <Apple className="h-5 w-5 text-white fill-white" />
                        <span className="text-[10px] font-black text-white uppercase">Apple</span>
                      </>
                    )}
                 </button>
              </div>

              <div className="flex flex-col items-center pt-4">
                <button type="button" onClick={() => setViewState(view === 'login' ? 'signup' : 'login')} className="text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-full border border-white/10 text-gray-400 hover:text-white">
                  {view === 'login' ? "NEW HERE? JOIN" : "MEMBER? SIGN IN"}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center pt-4">
              <button onClick={() => setViewState('login')} className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <ChevronLeft className="h-3 w-3" /> Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
