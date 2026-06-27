
"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Mail, Lock, ArrowRight, Loader2, Fingerprint, HeartPulse, Sparkles } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showFormAnyway, setShowFormAnyway] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: authLoading } = useUser();

  // FAIL-SAFE: Already Logged In?
  useEffect(() => {
    if (authLoading) return;

    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    
    if (user && firestore && sessionActive && !isRedirecting) {
      const checkProfile = async () => {
        try {
          setIsRedirecting(true);
          const vendorRef = doc(firestore, 'vendors', user.uid);
          const vendorSnap = await getDoc(vendorRef);
          
          if (vendorSnap.exists()) {
            const data = vendorSnap.data();
            if (data.category === 'Medical') router.replace('/Medical/store');
            else if (data.category === 'Beauty') router.replace('/Beauty/store');
            else router.replace('/vendor/dashboard');
          } else {
            setIsRedirecting(false);
            setShowFormAnyway(true);
          }
        } catch (e) {
          setIsRedirecting(false);
          setShowFormAnyway(true);
        }
      };
      checkProfile();
    } else {
      // Small timeout to prevent sudden flash
      const t = setTimeout(() => setShowFormAnyway(true), 500);
      return () => clearTimeout(t);
    }
  }, [user, authLoading, firestore, router, isRedirecting]);

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
      // 1. If input is not an email, it's a Store ID. Query Firestore for the actual email.
      if (!input.includes('@')) {
        const vendorsRef = collection(firestore, 'vendors');
        // Check exact match and case-insensitive match (stored as clean ID)
        const q = query(vendorsRef, where('storeId', '==', input.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          toast({ 
            variant: "destructive", 
            title: "ID Not Found", 
            description: "Check your Store ID or use Registered Email." 
          });
          setLoading(false);
          return;
        }
        
        const vendorData = querySnapshot.docs[0].data();
        loginEmail = vendorData.email; 
      }

      // 2. Perform Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, pass);
      const authenticatedUser = userCredential.user;

      // 3. Verify Vendor Profile Existence
      const vendorRef = doc(firestore, 'vendors', authenticatedUser.uid);
      const vendorSnap = await getDoc(vendorRef);

      if (!vendorSnap.exists()) {
        await signOut(auth);
        toast({ 
          variant: "destructive", 
          title: "Invalid Profile", 
          description: "No vendor account linked to these credentials." 
        });
        setLoading(false);
        return;
      }

      const vendorData = vendorSnap.data();
      
      // 4. Set Session & Redirect
      localStorage.setItem('shopykart_session_active', 'true');
      toast({ title: "Welcome back!", description: vendorData.storeName });
      
      if (vendorData.category === 'Medical') router.replace('/Medical/store');
      else if (vendorData.category === 'Beauty') router.replace('/Beauty/store');
      else router.replace('/vendor/dashboard');
      
    } catch (err: any) {
      console.error("Login Error:", err.code);
      let errorMsg = "Incorrect ID or Password.";
      if (err.code === 'auth/network-request-failed') errorMsg = "Network busy. Please try again.";
      
      toast({ variant: "destructive", title: "Login Failed", description: errorMsg });
      setLoading(false);
    }
  };

  if (isRedirecting && !showFormAnyway) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Restoring Dashboard Access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center pt-10">
          <div className={cn(
            "mx-auto w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-4 transition-all duration-500",
            isMedical ? "bg-teal-50 text-teal-600 shadow-xl shadow-teal-100" : isBeauty ? "bg-rose-50 text-rose-600 shadow-xl shadow-rose-100" : "bg-primary/10 text-primary shadow-xl shadow-primary/10"
          )}>
            {isMedical ? <HeartPulse className="h-8 w-8" /> : isBeauty ? <Sparkles className="h-8 w-8" /> : <Store className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-black">
            {isMedical ? 'Medical Hub' : isBeauty ? 'Beauty Hub' : 'Store Login'}
          </CardTitle>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-[0.2em] mt-1">ShopyKart Business Console</p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store ID or Email</label>
                <div className="relative group">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="text" 
                    placeholder="e.g. MyStore123" 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/20 border-none text-black font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Key</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/20 border-none text-black font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                </div>
              </div>
            </div>
            
            <Button 
              type="button" 
              onClick={() => handleLogin()}
              className={cn(
                "w-full h-16 rounded-[2rem] font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all",
                isMedical ? "bg-teal-600 hover:bg-teal-700 shadow-teal-200" : 
                isBeauty ? "bg-rose-600 hover:bg-rose-700 shadow-rose-200" :
                "bg-black hover:bg-gray-900 shadow-gray-200"
              )}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "AUTHENTICATE"}
            </Button>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-[9px] font-black uppercase"><span className="bg-white px-3 text-muted-foreground tracking-widest">New Partner?</span></div>
            </div>

            <Button 
              type="button" 
              variant="outline"
              className={cn(
                "w-full h-12 rounded-xl border-2 font-black uppercase italic tracking-widest text-[10px]",
                isMedical ? "border-teal-100 text-teal-600 hover:bg-teal-50" : 
                isBeauty ? "border-rose-100 text-rose-600 hover:bg-rose-50" :
                "border-primary/20 text-primary hover:bg-primary/5"
              )}
              onClick={() => router.push(isMedical ? '/vendor/register?type=Medical' : isBeauty ? '/vendor/register?type=Beauty' : '/vendor/register')}
            >
              {isMedical ? 'REGISTER AS MEDICAL STORE' : isBeauty ? 'REGISTER AS BEAUTY STORE' : 'JOIN AS VENDOR'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button 
              type="button" 
              variant="ghost"
              className="w-full h-12 text-gray-400 font-bold uppercase text-[9px] tracking-widest"
              onClick={() => router.push('/')}
            >
              EXIT TO HOME
            </Button>
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
