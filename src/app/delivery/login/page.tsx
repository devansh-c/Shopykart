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
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: authLoading } = useUser();

  useEffect(() => {
    if (!authLoading && user) {
      localStorage.setItem('delivery_session_active', 'true');
      router.replace('/delivery/dashboard');
    }
  }, [user, authLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const user = userCredential.user;

      const partnerRef = doc(firestore, 'delivery_partners', user.uid);
      const partnerSnap = await getDoc(partnerRef);

      if (!partnerSnap.exists()) {
        await signOut(auth);
        toast({ 
          variant: "destructive", 
          title: "Access Denied", 
          description: "This account is not registered as a Delivery Partner." 
        });
        setLoading(false);
        return;
      }

      localStorage.setItem('delivery_session_active', 'true');
      toast({ title: "Welcome!", description: "Accessing Delivery Hub." });
      router.push('/delivery/dashboard');
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: "Invalid credentials. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth || !email.trim()) {
      toast({ variant: "destructive", title: "Email Required", description: "Enter your registered partner email." });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      toast({ title: "Email Sent!", description: "Reset instructions sent to your partner email." });
      setView('login');
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not send reset link." });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
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
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <Input 
                    type="email" 
                    placeholder="partner@shopykart.co.in" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                    required
                  />
                </div>
              </div>
              
              {view === 'login' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold text-gray-900 placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                  <div className="flex justify-end px-1 mt-2">
                    <button onClick={() => setView('forgot')} className="text-[10px] font-black uppercase text-primary tracking-widest hover:underline underline-offset-4">
                      FORGOT PIN?
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Button 
              onClick={view === 'forgot' ? handleResetPassword : handleLogin} 
              className="w-full h-18 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-xl transition-all active:scale-95 py-8"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (view === 'forgot' ? "SEND RESET LINK" : "ENTER HUB")}
            </Button>

            {view === 'forgot' && (
              <button onClick={() => setView('login')} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors">
                <ChevronLeft className="h-3 w-3" /> BACK TO LOGIN
              </button>
            )}
            
            {view === 'login' && (
              <>
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-white px-3 text-gray-400">Apply for duty</span></div>
                </div>

                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-14 rounded-2xl border-gray-100 text-gray-900 font-black uppercase italic tracking-tighter hover:bg-gray-50 active:scale-95 transition-all"
                  onClick={() => router.push('/delivery/register')}
                >
                  BECOME A PARTNER
                  <ArrowRight className="ml-2 h-4 w-4 text-primary" />
                </Button>
              </>
            )}

            <button 
              type="button" 
              className="w-full h-10 text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-primary transition-colors mt-2"
              onClick={() => router.push('/')}
            >
              BACK TO HOME
            </button>
          </div>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-10 left-0 right-0 flex justify-center items-center gap-2 opacity-30 pointer-events-none">
         <ShieldCheck className="h-4 w-4" />
         <span className="text-[8px] font-black uppercase tracking-[0.5em]">Logistics Secured</span>
      </div>
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
