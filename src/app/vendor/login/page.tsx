"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Lock, Loader2, Fingerprint, HeartPulse, Sparkles, ChevronLeft, ArrowRight } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const isMedical = typeParam === 'Medical';
  const isBeauty = typeParam === 'Beauty';
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: authLoading } = useUser();

  // AUTO-REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    if (!authLoading && user && firestore) {
      const checkAndRedirect = async () => {
        try {
          const vendorRef = doc(firestore, 'vendors', user.uid);
          const vendorSnap = await getDoc(vendorRef);
          if (vendorSnap.exists()) {
            const vendorData = vendorSnap.data();
            localStorage.setItem('shopykart_session_active', 'true');
            if (vendorData.category === 'Medical') router.replace('/Medical/store');
            else if (vendorData.category === 'Beauty') router.replace('/Beauty/store');
            else router.replace('/vendor/dashboard');
          }
        } catch (e) {
          console.error("Redirect check failed", e);
        }
      };
      checkAndRedirect();
    }
  }, [user, authLoading, firestore, router]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth || !firestore || loading) return;

    const input = identifier.trim();
    const pass = password.trim();

    if (!input || !pass) {
      toast({ variant: "destructive", title: "Missing Credentials" });
      return;
    }

    setLoading(true);
    let loginEmail = input.toLowerCase();

    try {
      if (!input.includes('@')) {
        const vendorsRef = collection(firestore, 'vendors');
        const q = query(vendorsRef, where('storeId', '==', input.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          toast({ variant: "destructive", title: "ID Not Found" });
          setLoading(false);
          return;
        }
        loginEmail = querySnapshot.docs[0].data().email; 
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, pass);
      localStorage.setItem('shopykart_session_active', 'true');
      
      const vendorRef = doc(firestore, 'vendors', userCredential.user.uid);
      const vendorSnap = await getDoc(vendorRef);
      const vendorData = vendorSnap.data();
      
      if (vendorData?.category === 'Medical') router.replace('/Medical/store');
      else if (vendorData?.category === 'Beauty') router.replace('/Beauty/store');
      else router.replace('/vendor/dashboard');
      
    } catch (err) {
      toast({ variant: "destructive", title: "Login Failed", description: "Incorrect ID or Password." });
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth || !identifier.trim()) {
      toast({ variant: "destructive", title: "Email Required", description: "Please enter your store email address." });
      return;
    }

    setLoading(true);
    try {
      let resetEmail = identifier.trim().toLowerCase();
      
      if (!resetEmail.includes('@') && firestore) {
        const vendorsRef = collection(firestore, 'vendors');
        const q = query(vendorsRef, where('storeId', '==', resetEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          resetEmail = querySnapshot.docs[0].data().email;
        }
      }

      await sendPasswordResetEmail(auth, resetEmail);
      toast({ title: "Email Sent!", description: "Reset link sent to your registered email." });
      setView('login');
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not send reset link. Verify your email." });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center pt-10">
          <div className={cn(
            "mx-auto w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 transition-all duration-500",
            isMedical ? "bg-teal-50 text-teal-600 shadow-xl shadow-teal-100" : isBeauty ? "bg-rose-50 text-rose-600 shadow-xl shadow-rose-100" : "bg-primary/10 text-primary"
          )}>
            {isMedical ? <HeartPulse className="h-8 w-8" /> : isBeauty ? <Sparkles className="h-8 w-8" /> : <Store className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-black">
            {view === 'forgot' ? 'Reset Access' : (isMedical ? 'Medical Hub' : isBeauty ? 'Beauty Hub' : 'Store Login')}
          </CardTitle>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Business Console</p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{view === 'forgot' ? 'Registered Email' : 'Store ID or Email'}</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input type="text" placeholder={view === 'forgot' ? "vendor@email.com" : "e.g. MyStore123"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold" />
                </div>
              </div>
              
              {view === 'login' && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Security Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                  </div>
                  <div className="flex justify-end px-1 mt-2">
                    <button onClick={() => setView('forgot')} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline underline-offset-4">
                      Forgot Password?
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <Button onClick={() => view === 'forgot' ? handleResetPassword() : handleLogin()} className="w-full h-16 rounded-[2rem] font-black uppercase italic text-lg shadow-xl bg-black" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'forgot' ? "SEND RESET LINK" : "AUTHENTICATE")}
            </Button>

            {view === 'forgot' && (
              <button onClick={() => setView('login')} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-black">
                <ChevronLeft className="h-3 w-3" /> BACK TO LOGIN
              </button>
            )}
            
            {view === 'login' && (
              <div className="pt-4 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
                  <div className="relative flex justify-center text-[9px] font-black uppercase"><span className="bg-white px-3 text-muted-foreground">New Partner?</span></div>
                </div>

                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-12 rounded-xl border-gray-200 text-black font-black uppercase italic tracking-tighter hover:bg-gray-50"
                  onClick={() => router.push(isMedical ? '/vendor/register?type=Medical' : isBeauty ? '/vendor/register?type=Beauty' : '/vendor/register')}
                >
                  BECOME A PARTNER
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            <Button type="button" variant="ghost" className="w-full h-12 text-gray-400 font-bold uppercase text-[9px] tracking-widest" onClick={() => router.push('/')}>EXIT TO HOME</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
