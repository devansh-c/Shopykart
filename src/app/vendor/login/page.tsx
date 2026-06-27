
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
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: authLoading } = useUser();

  // STABLE AUTO-REDIRECT: If already logged in, skip the form entirely
  useEffect(() => {
    if (authLoading || !user || !firestore || isRedirecting) return;

    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!sessionActive) return;

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
          // If user exists in Auth but not in Vendors, it might be a Customer
          setIsRedirecting(false);
        }
      } catch (e) {
        setIsRedirecting(false);
      }
    };
    checkProfile();
  }, [user, authLoading, firestore, router, isRedirecting]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!auth || !firestore || loading) return;

    const input = identifier.trim().toLowerCase();
    const pass = password.trim();

    if (!input || !pass) {
      toast({ variant: "destructive", title: "Credentials Missing" });
      return;
    }

    setLoading(true);
    let loginEmail = input;

    try {
      // 1. Resolve Store ID to Email if needed
      if (!input.includes('@')) {
        const q = query(collection(firestore, 'vendors'), where('storeId', '==', input));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          toast({ variant: "destructive", title: "Access Denied", description: "Invalid Store ID." });
          setLoading(false);
          return;
        }
        loginEmail = querySnapshot.docs[0].data().email; 
      }

      // 2. Firebase Sign In
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, pass);
      const authenticatedUser = userCredential.user;

      // 3. Verify Vendor Status
      const vendorRef = doc(firestore, 'vendors', authenticatedUser.uid);
      const vendorSnap = await getDoc(vendorRef);

      if (!vendorSnap.exists()) {
        await signOut(auth);
        toast({ variant: "destructive", title: "Access Denied", description: "Not a registered vendor." });
        setLoading(false);
        return;
      }

      const vendorData = vendorSnap.data();
      localStorage.setItem('shopykart_session_active', 'true');
      toast({ title: "Authenticated", description: `Welcome ${vendorData.storeName}` });
      
      // 4. Role-based Route
      if (vendorData.category === 'Medical') router.replace('/Medical/store');
      else if (vendorData.category === 'Beauty') router.replace('/Beauty/store');
      else router.replace('/vendor/dashboard');
      
    } catch (err: any) {
      toast({ variant: "destructive", title: "Login Failed", description: "Invalid credentials." });
      setLoading(false);
    }
  };

  // While redirecting or checking auth, show minimal professional state
  if (isRedirecting || (user && !authLoading)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Restoring secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="text-center pt-10">
          <div className={cn(
            "mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4",
            isMedical ? "bg-teal-50 text-teal-600" : isBeauty ? "bg-rose-50 text-rose-600" : "bg-primary/10 text-primary"
          )}>
            {isMedical ? <HeartPulse className="h-8 w-8" /> : isBeauty ? <Sparkles className="h-8 w-8" /> : <Store className="h-8 w-8" />}
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-black">
            {isMedical ? 'Medical Access' : isBeauty ? 'Beauty Access' : 'Vendor Access'}
          </CardTitle>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">ShopyKart Business Portal</p>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store ID or Email</label>
              <div className="relative">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="e.g. MyStore123" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-muted/30 border-none text-black font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-muted/30 border-none text-black font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>
            
            <Button 
              type="button" 
              onClick={() => handleLogin()}
              className={cn(
                "w-full h-14 rounded-2xl font-black uppercase italic text-lg shadow-xl active:scale-[0.98] transition-all mt-2",
                isMedical ? "bg-teal-600 hover:bg-teal-700 shadow-teal-100" : 
                isBeauty ? "bg-rose-600 hover:bg-rose-700 shadow-rose-100" :
                "bg-primary hover:bg-primary/90 shadow-primary/20"
              )}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTER DASHBOARD"}
            </Button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-white px-2 text-muted-foreground">New Partner?</span></div>
            </div>

            <Button 
              type="button" 
              variant="outline"
              className={cn(
                "w-full h-12 rounded-xl border-2 font-black uppercase italic tracking-tighter",
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
              className="w-full h-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest mt-2"
              onClick={() => router.push('/')}
            >
              BACK TO HOME
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
