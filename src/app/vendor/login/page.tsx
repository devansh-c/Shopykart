"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Lock, Loader2, Fingerprint, HeartPulse, Sparkles, Apple } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { cn } from '@/lib/utils';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const isMedical = typeParam === 'Medical';
  const isBeauty = typeParam === 'Beauty';
  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

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

      const vendorRef = doc(firestore, 'vendors', firebaseUser.uid);
      const vendorSnap = await getDoc(vendorRef);

      if (!vendorSnap.exists()) {
        await signOut(auth);
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: "No vendor profile found for this social account. Use manual login if your Store ID was created with a custom password." 
        });
      } else {
        localStorage.setItem('shopykart_session_active', 'true');
        const vendorData = vendorSnap.data();
        if (vendorData.category === 'Medical') router.replace('/Medical/store');
        else if (vendorData.category === 'Beauty') router.replace('/Beauty/store');
        else router.replace('/vendor/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        toast({ 
          variant: "destructive", 
          title: "Domain Restricted", 
          description: `Authorized Domains mein "${currentDomain}" add karein.`,
          duration: 8000
        });
      } else if (err.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: "Failed", description: "Please use manual Store ID login." });
      }
    } finally {
      setSocialLoading(null);
    }
  };

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
            {isMedical ? 'Medical Hub' : isBeauty ? 'Beauty Hub' : 'Store Login'}
          </CardTitle>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Business Console</p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Store ID or Email</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input type="text" placeholder="e.g. MyStore123" value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Security Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                </div>
              </div>
            </div>
            
            <Button onClick={() => handleLogin()} className="w-full h-16 rounded-[2rem] font-black uppercase italic text-lg shadow-xl bg-black" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "AUTHENTICATE"}
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-[9px] font-black uppercase"><span className="bg-white px-3 text-muted-foreground">Social Connect</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => handleSocialAuth('google')} disabled={!!socialLoading} className="h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all">
                  {socialLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                    <>
                      <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                      <span className="text-[8px] font-black uppercase">Google</span>
                    </>
                  )}
               </button>
               <button onClick={() => handleSocialAuth('apple')} disabled={!!socialLoading} className="h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 active:scale-95 transition-all">
                  {socialLoading === 'apple' ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : (
                    <>
                      <Apple className="h-4 w-4 fill-black" />
                      <span className="text-[8px] font-black uppercase">Apple</span>
                    </>
                  )}
               </button>
            </div>

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
