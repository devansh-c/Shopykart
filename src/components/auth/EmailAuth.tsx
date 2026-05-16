
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Mail, Lock, User, Phone, ArrowRight, ChevronLeft, CheckCircle2, Settings2 } from 'lucide-react';
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type AuthView = 'login' | 'signup' | 'forgot';

export function EmailAuth() {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [isResetSent, setIsResetSent] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .trim()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleGoogleSignIn = async () => {
    if (!auth || !firestore) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const profileRef = doc(firestore, 'users', user.uid, 'profile', 'data');
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        const profileData = {
          fullName: user.displayName || 'Google User',
          email: user.email,
          phoneNumber: user.phoneNumber || '',
          createdAt: serverTimestamp(),
          role: 'customer',
          authProvider: 'google'
        };
        await setDoc(profileRef, profileData);
      }

      toast({ title: "Welcome!", description: `Logged in as ${user.displayName}` });
    } catch (err: any) {
      let errorMessage = "Google authentication failed.";
      if (err.code === 'auth/unauthorized-domain') {
        errorMessage = "Domain not authorized. Please add this URL in Firebase Console > Authentication > Authorized domains.";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in window was closed.";
      }
      toast({ variant: "destructive", title: "Sign-in Error", description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email identity." });
      return;
    }

    setLoading(true);
    try {
      if (view === 'signup') {
        if (!fullName.trim() || phoneNumber.length !== 10 || password.length < 6) {
          throw new Error("Please fill all fields correctly. Phone must be 10 digits.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: fullName });

        if (firestore) {
          const profileData = {
            fullName,
            phoneNumber,
            email: trimmedEmail,
            createdAt: serverTimestamp(),
            role: 'customer'
          };
          const profileRef = doc(firestore, 'users', user.uid, 'profile', 'data');
          await setDoc(profileRef, profileData);
        }

        toast({ title: "Welcome!", description: `Account created for ${fullName}.` });
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        toast({ title: "Identity Verified", description: "Accessing your signature experience." });
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setIsResetSent(true);
      }
    } catch (err: any) {
      let message = err.message;
      if (err.code === 'auth/invalid-credential') {
        message = "Wrong email or password identity.";
      } else if (err.code === 'auth/email-already-in-use') {
        message = "This email is already registered.";
      } else if (err.code === 'auth/too-many-requests') {
        message = "Account temporarily locked due to multiple failed attempts.";
      }
      toast({ variant: "destructive", title: "Access Denied", description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsResetSent(false);
    setView('login');
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-in fade-in duration-700 overflow-y-auto no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />

      <div className="flex justify-center mt-6 mb-10">
        <div className="scale-110">
          <Logo />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        {isResetSent ? (
          <div className="text-center space-y-6 animate-in zoom-in duration-500 pb-10">
            <div className="mx-auto bg-green-50 h-20 w-20 rounded-full flex items-center justify-center border border-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-black">LINK DISPATCHED!</h2>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-2">Identity verification link sent</p>
            </div>
            <Button onClick={handleBackToLogin} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl">BACK TO LOGIN</Button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black italic tracking-tighter leading-tight text-foreground uppercase">
                {view === 'login' && 'Premium Access'}
                {view === 'signup' && 'Join the Elite'}
                {view === 'forgot' && 'Reset Security'}
              </h1>
              <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em] opacity-60">
                {view === 'login' && 'Unlock your signature experience'}
                {view === 'signup' && 'Create your gourmet identity'}
                {view === 'forgot' && 'Identity Verification Required'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                {view === 'signup' && (
                  <>
                    <div className="relative group">
                      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Full Name *</label>
                      <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                        <User className="h-4 w-4 text-gray-400 mr-3" />
                        <input type="text" placeholder="Enter Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                      </div>
                    </div>
                    <div className="relative group">
                      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Mobile Identity *</label>
                      <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                        <Phone className="h-4 w-4 text-gray-400 mr-3" />
                        <input type="tel" placeholder="10-digit Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                      </div>
                    </div>
                  </>
                )}

                <div className="relative group">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Email Identity *</label>
                  <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <input type="email" placeholder="elite@shopykart.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                  </div>
                </div>

                {view !== 'forgot' && (
                  <div className="relative group">
                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Secret Key *</label>
                    <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                      <Lock className="h-4 w-4 text-gray-400 mr-3" />
                      <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                    </div>
                  </div>
                )}
                
                {view === 'signup' && (
                  <div className="relative group">
                    <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Confirm Secret Key *</label>
                    <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                      <Lock className="h-4 w-4 text-gray-400 mr-3" />
                      <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>

              {view === 'login' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setView('forgot')} className="text-[9px] font-black uppercase tracking-widest text-primary">Forgotten Security Key?</button>
                </div>
              )}
              
              <div className="space-y-4 pt-2">
                <Button type="submit" disabled={loading} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 text-lg tracking-tighter">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <div className="flex items-center gap-2">{view === 'login' && 'ENTER HUB'}{view === 'signup' && 'CREATE ACCOUNT'}{view === 'forgot' && 'SEND RESET LINK'}<ArrowRight className="h-4 w-4" /></div>}
                </Button>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-gray-100"></div>
                  <span className="flex-shrink mx-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Or login with</span>
                  <div className="flex-grow border-t border-gray-100"></div>
                </div>

                <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full h-14 border-2 border-gray-100 bg-white rounded-2xl flex items-center justify-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.53v2.77h2.63c1.54-1.42 2.43-3.5 2.43-5.31z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.63-2.77c-.73.49-1.66.78-2.65.78-2.04 0-3.77-1.38-4.39-3.23h-2.72v2.12C8.63 20.44 11.13 23 12 23z" fill="#34A853"/><path d="M7.61 15.12c-.16-.49-.25-1.02-.25-1.56s.09-1.07.25-1.56V9.88H4.89C4.32 11.08 4 12.51 4 14s.32 2.92.89 4.12l2.72-2.12z" fill="#FBBC05"/><path d="M12 7.51c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 4.09 14.97 3 12 3 8.63 3 5.63 5.56 4.89 8.88l2.72 2.12c.62-1.85 2.35-3.23 4.39-3.23z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-bold text-gray-700">Continue with Google</span>
                </Button>

                <div className="flex flex-col items-center gap-6 pt-4">
                  <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="text-[9px] font-black uppercase tracking-[0.2em] text-primary underline underline-offset-8">
                    {view === 'login' ? 'New to ShopyKart? Join Elite' : 'Already Elite? Back to Hub'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      <div className="mt-auto text-center pb-8 pt-10">
        <div className="flex items-center justify-center gap-2 text-muted-foreground/30">
          <ShieldCheck className="h-4 w-4" />
          <p className="text-[8px] font-black uppercase tracking-[0.5em]">Secure Infrastructure</p>
        </div>
      </div>
    </div>
  );
}
