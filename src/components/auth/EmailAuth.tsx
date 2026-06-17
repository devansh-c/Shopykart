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
 * Optimized for zero-lag and robust error handling.
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore || loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    
    if (view === 'signup') {
      if (!fullName.trim()) {
        toast({ variant: "destructive", title: "Missing Name", description: "Please enter your full name." });
        return;
      }
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
        const firebaseUser = userCredential.user;
        
        await updateProfile(firebaseUser, { displayName: fullName.toUpperCase() });

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

        await setDoc(doc(firestore, 'users', firebaseUser.uid), userData, { merge: true });

        localStorage.setItem('user_name', fullName.toUpperCase());
        localStorage.setItem('user_phone', phoneNumber);
        localStorage.setItem('shopykart_session_active', 'true');
        localStorage.setItem('show_welcome_bonus', 'true');
        
        toast({ title: "Profile Created! ✨", description: "Welcome to ShopyKart." });
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        await signInWithEmailAndPassword(auth, trimmedEmail, password);
        localStorage.setItem('shopykart_session_active', 'true');
        toast({ title: "Welcome Back!", description: "Access granted." });
        
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    } catch (err: any) {
      // CLEAR LOADING STATE FIRST TO PREVENT UI HANG
      setLoading(false);
      
      let errorMessage = "Authentication failed. Please try again.";
      
      // EXPLICIT FIREBASE ERROR MAPPING
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please login instead.";
      } else if (err.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Use at least 6 characters.";
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      }
      
      toast({ 
        variant: "destructive", 
        title: "Auth Alert", 
        description: errorMessage 
      });
      
      console.warn("Firebase Auth Notice:", err.code);
    }
  };

  const handleForgotPassword = () => {
    const msg = `Hi Admin, I forgot my ShopyKart password. Email: ${email}`;
    window.open(`https://wa.me/919450355709?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // IF NOT MOUNTED OR USER LOGGED IN, RENDER NOTHING
  if (!mounted || user) return null;
  
  const hasActiveSession = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';
  if (hasActiveSession) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 overflow-y-auto no-scrollbar pointer-events-auto">
      <div className="max-w-sm mx-auto w-full space-y-8 py-10 transform-gpu">
        <div className="flex flex-col items-center text-center space-y-6">
          <Logo className="scale-110 mb-2 border-white/10" />
          <div className="space-y-2">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
              {view === 'signup' ? 'Join ShopyKart' : 'Welcome Back'}
            </h1>
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
              {view === 'signup' ? 'Create your permanent identity' : 'Premium Delivery Network'}
            </p>
          </div>
        </div>

        <div className="w-full space-y-6">
          <form onSubmit={handleAuth} className="space-y-4">
            {view === 'signup' && (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input 
                    type="text" 
                    placeholder="FULL NAME" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    required 
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input 
                    type="tel" 
                    placeholder="10 DIGIT PHONE" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    required 
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                  />
                </div>
              </div>
            )}
            
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                value={email} 
                onChange={(e) => setEmail(e.target.value.toLowerCase())} 
                required 
                className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
              />
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                <input 
                  type="password" 
                  placeholder="PASSWORD" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                />
              </div>
              {view === 'signup' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input 
                    type="password" 
                    placeholder="CONFIRM PASSWORD" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                    className="w-full h-14 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-black tracking-widest text-white focus:outline-none focus:border-primary/50 transition-all uppercase" 
                  />
                </div>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl text-lg mt-4 active:scale-95 transition-all">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'signup' ? 'JOIN SHOPYKART' : 'ENTER DASHBOARD')}
            </Button>
          </form>

          <div className="flex flex-col items-center gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => setView(view === 'login' ? 'signup' : 'login')} 
              className="text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-full transition-all border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 active:scale-95"
            >
              {view === 'login' ? "NEW ON SHOPYKART? REGISTER" : "ALREADY A MEMBER? SIGN IN"}
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
