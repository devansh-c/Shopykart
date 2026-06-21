'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';

type AuthView = 'login' | 'signup';

/**
 * @fileOverview Ultra-Fast Email Authentication.
 * Optimized to prevent unmounting during profile creation to ensure "JOIN" button works every time.
 */
export function EmailAuth() {
  const [view, setView] = useState<AuthView>('signup');
  const [loading, setLoading] = useState(false);
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

  const handleAuth = async (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Initializing", description: "Firebase is loading..." });
      return;
    }

    if (loading || isFinishing) return;

    // --- MANUAL VALIDATION ---
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast({ variant: "destructive", title: "Invalid Email" });
      return;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Short Password", description: "Min 6 characters required." });
      return;
    }

    if (view === 'signup') {
      if (!fullName.trim()) {
        toast({ variant: "destructive", title: "Name Required" });
        return;
      }
      if (phoneNumber.trim().length !== 10) {
        toast({ variant: "destructive", title: "Invalid Phone", description: "Enter 10-digit number." });
        return;
      }
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Password Mismatch" });
        return;
      }
    }

    setLoading(true);

    try {
      if (view === 'signup') {
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const firebaseUser = userCredential.user;
        
        setIsFinishing(true); // Internal state to keep UI active while saving

        // 2. Save Profile
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

        await setDoc(doc(firestore, 'users', firebaseUser.uid), userData, { merge: true });

        // 3. Mark Session
        localStorage.setItem('shopykart_session_active', 'true');
        localStorage.setItem('user_name', fullName.toUpperCase());
        localStorage.setItem('show_welcome_bonus', 'true');
        
        toast({ title: "Welcome! ✨", description: "Account created successfully." });
        
        // 4. Force hard reload to enter app
        setTimeout(() => {
          window.location.href = '/'; 
        }, 300);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        localStorage.setItem('shopykart_session_active', 'true');
        toast({ title: "Welcome Back!" });
        
        setTimeout(() => {
          window.location.href = '/';
        }, 300);
      }
    } catch (err: any) {
      setLoading(false);
      setIsFinishing(false);
      let msg = "Authentication failed.";
      if (err.code === 'auth/email-already-in-use') msg = "Email is already registered.";
      else if (err.code === 'auth/invalid-credential') msg = "Wrong credentials.";
      
      toast({ variant: "destructive", title: "Error", description: msg });
    }
  };

  if (!mounted) return null;
  
  // Note: We don't check for (user && !loading) here anymore to prevent premature unmounting 
  // during the async setDoc call. The parent AuthGuard handles final unmounting.

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar pointer-events-auto">
      <div className="max-w-sm mx-auto w-full space-y-8 py-10 transform-gpu pointer-events-auto relative z-[100000]">
        <div className="flex flex-col items-center text-center space-y-6">
          <Logo className="scale-110 mb-2 border-white/10" />
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              {view === 'signup' ? 'Join ShopyKart' : 'Welcome Back'}
            </h1>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
              Premium Delivery Network
            </p>
          </div>
        </div>

        <div className="w-full space-y-5">
          <div className="space-y-4">
            {view === 'signup' && (
              <>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
                  <input 
                    type="text" 
                    placeholder="FULL NAME" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
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
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                value={email} 
                onChange={(e) => setEmail(e.target.value.toLowerCase())} 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
              <input 
                type="password" 
                placeholder="PASSWORD" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
              />
            </div>

            {view === 'signup' && (
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary" />
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
            onClick={handleAuth}
            disabled={loading || isFinishing} 
            className="w-full h-20 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl text-xl mt-4 active:scale-95 transition-all py-6 flex items-center justify-center gap-3 disabled:opacity-70 relative z-[100001] border-b-4 border-black/20"
          >
            {loading || isFinishing ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'signup' ? 'JOIN SHOPYKART' : 'ENTER DASHBOARD')}
          </button>

          <div className="flex flex-col items-center gap-4 pt-6">
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
    </div>
  );
}
