"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bike, Mail, Lock, Loader2, ArrowRight, ChevronLeft, ShieldCheck } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

function DeliveryLoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setViewState] = useState<'login' | 'forgot'>('login');
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: authLoading } = useUser();

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      localStorage.setItem('shopykart_session_active', 'true');
      router.replace('/delivery/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const loggedUser = userCredential.user;

      const partnerRef = doc(firestore, 'delivery_partners', loggedUser.uid);
      const partnerSnap = await getDoc(partnerRef);

      if (!partnerSnap.exists()) {
        await signOut(auth);
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: "Account not registered in Fleet." 
        });
        setLoading(false);
        return;
      }

      localStorage.setItem('shopykart_session_active', 'true');
      toast({ title: "Identity Verified!", description: "Opening Hub..." });
      router.push('/delivery/dashboard');
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: "Invalid email or security pin." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth || !email.trim()) {
      toast({ variant: "destructive", title: "Email Required" });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      toast({ title: "Reset Link Sent!", description: "Check your work email." });
      setViewState('login');
    } catch (err) {
      toast({ variant: "destructive", title: "Reset Error" });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center pt-12 pb-6">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-4 border border-primary/20 shadow-inner">
            <Bike className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">
            {view === 'forgot' ? 'Reset Pin' : 'Partner Login'}
          </CardTitle>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">ShopyKart Fleet Console</p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Work Email</label>
                <Input 
                  type="email" 
                  placeholder="partner@shopykart.co.in" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-2xl bg-muted/20 border-none font-bold"
                  required
                />
              </div>
              
              {view === 'login' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key</label>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-muted/20 border-none font-bold"
                    required
                  />
                  <div className="flex justify-end mt-2">
                    <button onClick={() => setViewState('forgot')} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline">FORGOT PIN?</button>
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={view === 'forgot' ? handleResetPassword : handleLogin} 
              className="w-full h-18 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-xl"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'forgot' ? "SEND RESET LINK" : "ENTER HUB")}
            </Button>

            {view === 'forgot' && (
              <button onClick={() => setViewState('login')} className="w-full text-[10px] font-black uppercase text-gray-400">← BACK TO LOGIN</button>
            )}
            
            {view === 'login' && (
              <Button 
                type="button" 
                variant="outline"
                className="w-full h-14 rounded-2xl border-gray-100 font-black uppercase italic"
                onClick={() => router.push('/delivery/register')}
              >
                BECOME A PARTNER <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            <button 
              type="button" 
              className="w-full text-gray-400 font-black uppercase text-[10px] tracking-[0.3em]"
              onClick={() => router.push('/')}
            >
              EXIT TO HOME
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DeliveryLoginPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DeliveryLoginContent />
    </Suspense>
  );
}
