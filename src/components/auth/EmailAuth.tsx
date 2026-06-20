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
 * Optimized for zero-lag and robust execution.
 * Fix: Removed premature unmount on 'user' detection to ensure profile creation completes.
 */
export function EmailAuth() {
  const [view, setView] = useState<AuthView>('signup');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleAuth = async () => {
    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Connecting...", description: "Please wait 1s." });
      return;
    }

    if (loading) return;

    // --- ROBUST MANUAL VALIDATION ---
    if (!email.trim() || !email.includes('@')) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Enter a valid email address." });
      return;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Short Password", description: "Minimum 6 characters required." });
      return;
    }

    if (view === 'signup') {
      if (!fullName.trim() || fullName.length < 3) {
        toast({ variant: "destructive", title: "Name Required", description: "Please enter your full name (min 3 chars)." });
        return;
      }
      if (phoneNumber.length !== 10) {
        toast({ variant: "destructive", title: "Invalid Phone", description: "Enter a valid 10-digit mobile number." });
        return;
      }
      if (password !== confirmPassword) {
        toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
        return;
      }
    }

    const trimmedEmail = email.trim().toLowerCase();
    setLoading(true);

    try {
      if (view === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const firebaseUser = userCredential.user;
        
        // 1. Update Basic Profile
        await updateProfile(firebaseUser, { displayName: fullName.toUpperCase() });

        // 2. Prepare Detailed User Data
        const userData = {
          fullName: fullName.toUpperCase(),
          phoneNumber,
          email: trimmedEmail,
          uid: firebaseUser.uid,
          coins: 10,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          role: 'customer'
        };

        // 3. CRITICAL: Save to Firestore BEFORE marking session
        await setDoc(doc(firestore, 'users', firebaseUser.uid), userData, { merge: true });

        // 4. Mark Session
        localStorage.setItem('shopykart_session_active', 'true');
        localStorage.setItem('user_name', fullName.toUpperCase());
        localStorage.setItem('show_welcome_bonus', 'true');
        
        toast({ title: "Welcome to ShopyKart! ✨", description: "Account created successfully." });
        
        // Final redirection after all data is committed
        setTimeout(() => {
          window.location.reload(); // Hard reload to clear auth state and pick up session
        }, 500);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        localStorage.setItem('shopykart_session_active', 'true');
        toast({ title: "Authenticated!", description: "Opening dashboard." });
        
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (err: any) {
      setLoading(false);
      let msg = "Auth failed. Try again.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      else if (err.code === 'auth/invalid-credential') msg = "Wrong email or password.";
      else if (err.code === 'auth/network-request-failed') msg = "Check your internet connection.";
      
      toast({ variant: "destructive", title: "Auth Alert", description: msg });
    }
  };

  const handleForgotPassword = () => {
    const msg = `Hi Admin, I forgot my ShopyKart password. Email: ${email}`;
    window.open(`https://wa.me/919450355709?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!mounted) return null;
  
  // Only auto-hide if we are NOT in the middle of a loading process
  const hasActiveSession = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';
  if (hasActiveSession && !loading) return null;
  if (user && !loading) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 overflow-y-auto no-scrollbar pointer-events-auto">
      <div className="max-w-sm mx-auto w-full space-y-8 py-10 transform-gpu pointer-events-auto">
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
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="FULL NAME" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                  />
                </div>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="tel" 
                    placeholder="10 DIGIT PHONE" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
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
                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600 group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                placeholder="PASSWORD" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
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
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                />
              </div>
            )}
          </div>

          <button 
            type="button"
            onClick={handleAuth}
            disabled={loading} 
            className="w-full h-18 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl text-xl mt-4 active:scale-95 transition-all py-6 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'signup' ? 'JOIN SHOPYKART' : 'ENTER DASHBOARD')}
          </button>

          <div className="flex flex-col items-center gap-4 pt-6">
            <button 
              type="button" 
              onClick={() => { setView(view === 'login' ? 'signup' : 'login'); window.scrollTo(0,0); }} 
              className="text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-full transition-all border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 active:scale-95"
            >
              {view === 'login' ? "NEW CUSTOMER? REGISTER" : "ALREADY A MEMBER? SIGN IN"}
            </button>
            
            {view === 'login' && (
              <button 
                type="button" 
                onClick={handleForgotPassword} 
                className="text-[9px] font-bold uppercase tracking-widest text-primary/60 flex items-center gap-1.5 hover:text-primary transition-colors"
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
