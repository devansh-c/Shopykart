
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Store, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function VendorLoginPage() {
  const [email, setEmail] = useState('');
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

    try {
      // 1. First, attempt to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Immediately check vendor status in Firestore
      const vendorDoc = await getDoc(doc(firestore, 'vendors', user.uid));
      
      if (vendorDoc.exists()) {
        const data = vendorDoc.data();
        if (data.status === 'approved') {
          toast({ title: "Welcome Back!", description: "Accessing your vendor dashboard." });
          router.push('/vendor/dashboard');
        } else if (data.status === 'pending') {
          // Block access if still pending
          toast({ 
            variant: "destructive", 
            title: "Account Pending", 
            description: "Your store is still under review by Admin. Please wait for approval." 
          });
          await signOut(auth);
        } else {
          toast({ variant: "destructive", title: "Access Denied", description: "This account has been rejected or disabled." });
          await signOut(auth);
        }
      } else {
        toast({ variant: "destructive", title: "Not a Vendor", description: "This account is not registered as a vendor." });
        await signOut(auth);
      }
    } catch (err: any) {
      let msg = "Invalid credentials or network error.";
      if (err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password provider is disabled in Firebase Console. Please enable it to allow logins.";
      } else if (err.code === 'auth/invalid-credential') {
        msg = "Wrong email or password.";
      }
      toast({ variant: "destructive", title: "Login Failed", description: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">Vendor Login</CardTitle>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Manage your ShopyKart business</p>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@store.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-muted/30 border-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-muted/30 border-none"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase italic text-lg shadow-xl shadow-primary/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "SIGN IN"}
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
