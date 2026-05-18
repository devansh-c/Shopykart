
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, CheckCircle2 } from 'lucide-react';
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
          createdAt: serverTimestamp(),
          role: 'customer'
        });
      }
      toast({ title: "Welcome!", description: `Logged in as ${user.displayName}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sign-in Error", description: err.message });
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
            createdAt: serverTimestamp(),
            role: 'customer'
          });
        }
        toast({ title: "Identity Created", description: `Welcome, ${fullName}!` });
      } else if (view === 'login') {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        toast({ title: "Identity Verified" });
      } else if (view === 'forgot') {
        await sendPasswordResetEmail(auth, trimmedEmail);
        setIsResetSent(true);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Access Denied", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 animate-in fade-in duration-700 overflow-y-auto no-scrollbar">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-20" />
      <div className="flex justify-center mt-6 mb-10"><div className="scale-110"><Logo /></div></div>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
        {isResetSent ? (
          <div className="text-center space-y-6 pb-10">
            <div className="mx-auto bg-green-50 h-20 w-20 rounded-full flex items-center justify-center border border-green-100"><CheckCircle2 className="h-10 w-10 text-green-500" /></div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">LINK SENT!</h2>
            <Button onClick={() => {setIsResetSent(false); setView('login');}} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic shadow-xl">BACK TO LOGIN</Button>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                {view === 'login' ? 'Premium Access' : view === 'signup' ? 'Join Elite' : 'Reset Keys'}
              </h1>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-4">
                {view === 'signup' && (
                  <>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20">
                      <User className="h-4 w-4 text-gray-400 mr-3" />
                      <input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20">
                      <Phone className="h-4 w-4 text-gray-400 mr-3" />
                      <input type="tel" placeholder="Mobile Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                    </div>
                  </>
                )}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <input type="email" placeholder="Email identity" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                </div>
                {view !== 'forgot' && (
                  <div className="bg-gray-50 rounded-xl p-4 flex items-center border-2 border-transparent focus-within:bg-white focus-within:border-primary/20">
                    <Lock className="h-4 w-4 text-gray-400 mr-3" />
                    <input type="password" placeholder="Secret Key" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-transparent border-none text-sm font-bold focus:outline-none" />
                  </div>
                )}
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 text-lg">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : view === 'login' ? 'ENTER HUB' : view === 'signup' ? 'CREATE IDENTITY' : 'SEND LINK'}
              </Button>
              <div className="relative flex items-center py-2"><div className="flex-grow border-t border-gray-100"></div><span className="flex-shrink mx-4 text-[8px] font-black text-muted-foreground uppercase tracking-widest">Social login</span><div className="flex-grow border-t border-gray-100"></div></div>
              <Button type="button" variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full h-14 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.53v2.77h2.63c1.54-1.42 2.43-3.5 2.43-5.31z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.63-2.77c-.73.49-1.66.78-2.65.78-2.04 0-3.77-1.38-4.39-3.23h-2.72v2.12C8.63 20.44 11.13 23 12 23z" fill="#34A853"/><path d="M7.61 15.12c-.16-.49-.25-1.02-.25-1.56s.09-1.07.25-1.56V9.88H4.89C4.32 11.08 4 12.51 4 14s.32 2.92.89 4.12l2.72-2.12z" fill="#FBBC05"/><path d="M12 7.51c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 4.09 14.97 3 12 3 8.63 3 5.63 5.56 4.89 8.88l2.72 2.12c.62-1.85 2.35-3.23 4.39-3.23z" fill="#EA4335"/></svg>
                <span className="text-sm font-bold">Continue with Google</span>
              </Button>
              <button type="button" onClick={() => setView(view === 'login' ? 'signup' : 'login')} className="w-full text-[9px] font-black uppercase tracking-widest text-primary underline">
                {view === 'login' ? 'Create New Elite Identity' : 'Back to Hub Access'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
