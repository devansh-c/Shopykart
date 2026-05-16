
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Mail, Lock, User, Phone, ArrowRight, ChevronLeft, Info, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
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
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      toast({ variant: "destructive", title: "Internal Error", description: "Firebase Auth is not initialized." });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email identity." });
      return;
    }

    setLoading(true);
    try {
      if (view === 'signup') {
        if (!fullName || !phoneNumber || !trimmedEmail || !password || !confirmPassword) {
          throw new Error("All elite registration fields are mandatory.");
        }
        if (password !== confirmPassword) {
          throw new Error("Secret keys do not match.");
        }
        if (password.length < 6) {
          throw new Error("Security key must be at least 6 characters.");
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
          
          await setDoc(profileRef, profileData).catch(err => {
             errorEmitter.emit('permission-error', new FirestorePermissionError({
               path: profileRef.path,
               operation: 'write',
               requestResourceData: profileData
             }));
          });
        }

        toast({ title: "Welcome to Elite Circle", description: `Account created for ${fullName}.` });
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        toast({ title: "Identity Verified", description: "Accessing your signature experience." });
      } else if (view === 'forgot') {
        if (!trimmedEmail) throw new Error("Please enter your registered email identity.");
        
        // Firebase sendPasswordResetEmail returns success even if user not found for security
        await sendPasswordResetEmail(auth, trimmedEmail);
        setIsResetSent(true);
        toast({ 
          title: "Request Processed", 
          description: `If ${trimmedEmail} is registered, a link will arrive soon.` 
        });
      }
    } catch (err: any) {
      console.error("Auth Error:", err);
      let message = err.message;
      
      if (err.code === 'auth/user-not-found') message = "This email identity is not recognized. Please sign up first.";
      if (err.code === 'auth/wrong-password') message = "Incorrect security key provided.";
      if (err.code === 'auth/invalid-email') message = "The email format is invalid.";
      if (err.code === 'auth/too-many-requests') message = "Access blocked due to many failed attempts. Try later.";
      if (err.code === 'auth/email-already-in-use') message = "This email is already in our elite database.";
      
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
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="mx-auto bg-green-50 h-24 w-24 rounded-full flex items-center justify-center border border-green-100 relative">
              <div className="absolute inset-0 bg-green-200/20 rounded-full animate-ping" />
              <CheckCircle2 className="h-12 w-12 text-green-500 relative z-10" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">LINK DISPATCHED!</h2>
              
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 space-y-3">
                <div className="flex gap-2 items-center text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Deliverability Checklist</span>
                </div>
                <ul className="text-[9px] text-amber-800 font-bold uppercase tracking-tight text-left space-y-2 leading-relaxed list-disc ml-4">
                  <li>Domain connect karna <span className="text-primary font-black">ZAROORI NAHI HAI</span>.</li>
                  <li>Check <span className="text-primary underline decoration-2">SPAM / JUNK</span> folder immediately.</li>
                  <li>In Gmail, check <span className="text-primary">"Promotions"</span> tab.</li>
                  <li>Go to Firebase Console &gt; <span className="font-black">Authentication &gt; Templates</span>.</li>
                  <li>Verify "Password Reset" status is <span className="text-green-600 font-black">ON</span>.</li>
                  <li>Confirm "Public-facing name" is set in Settings.</li>
                </ul>
              </div>

              <div className="pt-2">
                 <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Target Identity:</p>
                 <p className="text-xs font-black text-foreground break-all bg-muted/30 p-2 rounded-lg">{email.toLowerCase()}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleBackToLogin}
                className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-xl"
              >
                BACK TO LOGIN
              </Button>
              <button 
                onClick={() => setIsResetSent(false)}
                className="flex items-center justify-center gap-2 text-[9px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary transition-colors"
              >
                <RefreshCcw className="h-3 w-3" />
                Try another email
              </button>
            </div>
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
                {view === 'forgot' && 'Re-verify your credentials'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                {view === 'signup' && (
                  <>
                    <div className="relative group">
                      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Full Name</label>
                      <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                        <User className="h-4 w-4 text-gray-400 mr-3" />
                        <input
                          type="text"
                          placeholder="Enter Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full bg-transparent border-none text-sm font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Mobile Identity</label>
                      <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                        <Phone className="h-4 w-4 text-gray-400 mr-3" />
                        <input
                          type="tel"
                          placeholder="00000 00000"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          required
                          className="w-full bg-transparent border-none text-sm font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="relative group">
                  <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Email Identity</label>
                  <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <input
                      type="email"
                      placeholder="elite@shopykart.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full bg-transparent border-none text-sm font-bold focus:outline-none"
                    />
                  </div>
                </div>

                {view !== 'forgot' && (
                  <>
                    <div className="relative group">
                      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Secret Key (Password)</label>
                      <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                        <Lock className="h-4 w-4 text-gray-400 mr-3" />
                        <input
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full bg-transparent border-none text-sm font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    {view === 'signup' && (
                      <div className="relative group">
                        <label className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1 mb-1.5 block">Confirm Secret Key</label>
                        <div className="relative flex items-center bg-gray-50 rounded-xl p-4 border-2 border-transparent transition-all focus-within:bg-white focus-within:border-primary/20">
                          <Lock className="h-4 w-4 text-gray-400 mr-3" />
                          <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full bg-transparent border-none text-sm font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {view === 'login' && (
                <div className="flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => setView('forgot')}
                    className="text-[9px] font-black uppercase tracking-widest text-primary hover:opacity-80"
                  >
                    Forgotten Security Key?
                  </button>
                </div>
              )}
              
              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 active:scale-[0.98] transition-all text-lg tracking-tighter"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <div className="flex items-center gap-2">
                      {view === 'login' && 'ENTER HUB'}
                      {view === 'signup' && 'CREATE ACCOUNT'}
                      {view === 'forgot' && 'SEND RESET LINK'}
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  )}
                </Button>

                {view === 'forgot' && (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 items-start animate-in zoom-in duration-300">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-blue-700 font-medium leading-relaxed uppercase">
                      Bina custom domain ke bhi link aati hai. Ek baar Spam folder aur Firebase Console mein templates zaroor check karein.
                    </p>
                  </div>
                )}

                <div className="flex flex-col items-center gap-6">
                  {view === 'login' ? (
                    <button 
                      type="button"
                      onClick={() => setView('signup')}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-primary underline underline-offset-8"
                    >
                      New to ShopyKart? Join Elite
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsResetSent(false);
                        setView('login');
                      }}
                      className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      Back to Hub Login
                    </button>
                  )}
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      <div className="mt-auto text-center pb-8 pt-10">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground/30">
            <ShieldCheck className="h-4 w-4" />
            <p className="text-[8px] font-black uppercase tracking-[0.5em]">Secure Infrastructure</p>
          </div>
        </div>
      </div>
    </div>
  );
}
