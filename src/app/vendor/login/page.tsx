
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Mail, Lock, ArrowRight, Loader2, Fingerprint } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function VendorLoginPage() {
  const [identifier, setIdentifier] = useState(''); // Store ID or Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setLoading(true);

    const input = identifier.trim().toLowerCase();
    let loginEmail = input;

    try {
      // 1. Logic: If not an email, it's a Store ID. Find its virtual email.
      if (!input.includes('@')) {
        const q = query(collection(firestore, 'vendors'), where('storeId', '==', input));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          toast({ 
            variant: "destructive", 
            title: "Access Denied", 
            description: "No store found with this ID." 
          });
          setLoading(false);
          return;
        }
        
        const vendorData = querySnapshot.docs[0].data();
        loginEmail = vendorData.email; // Virtual email found
      }

      // 2. Standard Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;

      // 3. Verify vendor document exists
      const vendorRef = doc(firestore, 'vendors', user.uid);
      const vendorSnap = await getDoc(vendorRef);

      if (!vendorSnap.exists()) {
        await signOut(auth);
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: "This account is not registered as a Vendor store." 
        });
        setLoading(false);
        return;
      }

      toast({ title: "Welcome Back!", description: `Store: ${vendorSnap.data().storeName}` });
      router.push('/vendor/dashboard');
    } catch (err: any) {
      let msg = "Invalid credentials or network error.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = "Wrong ID or password.";
      }
      toast({ variant: "destructive", title: "Login Failed", description: msg });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-black">Vendor Access</CardTitle>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">ShopyKart Business Portal</p>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store ID or Email</label>
              <div className="relative">
                <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="e.g. MyStore123" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-muted/30 border-none text-black font-bold"
                  required
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
                  className="pl-12 h-12 rounded-xl bg-muted/30 border-none text-black font-bold"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase italic text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTER DASHBOARD"}
            </Button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-white px-2 text-muted-foreground">New here?</span></div>
            </div>

            <Button 
              type="button" 
              variant="outline"
              className="w-full h-12 rounded-xl border-2 border-primary/20 text-primary font-black uppercase italic tracking-tighter hover:bg-primary/5"
              onClick={() => router.push('/vendor/register')}
              disabled={loading}
            >
              JOIN AS VENDOR
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
