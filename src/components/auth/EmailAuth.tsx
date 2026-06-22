'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, User, Phone, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Logo } from '@/components/shared/Logo';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type AuthView = 'login' | 'signup';

/**
 * @fileOverview High-Priority Authentication Layer.
 * Added: Forgot Password WhatsApp integration.
 */
export function EmailAuth() {
  const [view, setView] = useState<AuthView>('signup');
  const [loading, setLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleForgotPassword = () => {
    const adminPhone = "919450355709";
    const message = `Hey ShopyKart Team, I forgot my password. My registered email is: ${email || "[Enter Email Here]"}. Please help me reset it.`;
    window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAuth = async (e?: any) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!auth || !firestore) {
      toast({ variant: "destructive", title: "Wait...", description: "System is initializing." });
      return;
    }

    if (loading || isFinishing) return;

    // --- VALIDATION ---
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      toast({ variant: "destructive", title: "Invalid Email", description: "Please enter a valid email address." });
      return;
    }

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Short Password", description: "Minimum 6 characters required." });
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
        toast({ variant: "destructive", title: "Password Mismatch", description: "Confirm password does not match." });
        return;
      }
    }

    setLoading(true);

    try {
      if (view === 'signup') {
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        const firebaseUser = userCredential.user;
        
        setIsFinishing(true);

        // 2. Update Auth Profile
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

        // 3. Save to Firestore (Optimistic - no await)
        const userRef = doc(firestore, 'users', firebaseUser.uid);
        setDoc(userRef, userData, { merge: true })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: userRef.path,
              operation: 'create',
              requestResourceData: userData,
            });
            errorEmitter.emit('permission-error', permissionError);
          });

        // 4. Persistence & Redirect
        localStorage.setItem('shopykart_session_active', 'true');
        localStorage.setItem('user_name', fullName.toUpperCase());
        localStorage.setItem('show_welcome_bonus', 'true');
        
        toast({ title: "Welcome to ShopyKart! ✨", description: "Account created successfully." });
        
        // Immediate clean entry
        setTimeout(() => {
          window.location.href = '/'; 
        }, 300);
      } else {
        // Login Flow
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
      else if (err.code === 'auth/invalid-credential') msg = "Invalid email or password.";
      else if (err.code === 'auth/network-request-failed') msg = "Network error. Check your internet.";
      
      toast({ variant: "destructive", title: "Error", description: msg });
    }
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-[#0B0B0B] flex flex-col items-center justify-center p-8 overflow-y-auto no-scrollbar pointer-events-auto select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
         <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-sm mx-auto w-full space-y-8 py-10 transform-gpu pointer-events-auto relative z-10 animate-in fade-in zoom-in-95 duration-500">
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
            onClick={handleAuth}
            disabled={loading || isFinishing} 
            className="w-full h-20 bg-primary text-white rounded-[2.5rem] font-black uppercase italic shadow-2xl text-xl mt-4 active:scale-95 transition-all py-6 flex items-center justify-center gap-3 disabled:opacity-70 border-b-4 border-black/20"
          >
            {loading || isFinishing ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'signup' ? 'JOIN SHOPYKART' : 'ENTER HUB')}
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
      
      <p className="mt-auto text-[8px] font-black text-gray-600 uppercase tracking-[0.5em] pb-8">
        ShopyKart Private Limited
      </p>
    </div>
  );
}
