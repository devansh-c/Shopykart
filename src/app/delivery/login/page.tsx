"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bike, Mail, Lock, Loader2, ArrowRight, ChevronLeft } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export default function DeliveryLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'login' | 'forgot'>('login');
  
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

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

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-primary/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
            <Bike className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">
            {view === 'forgot' ? 'Reset Partner Pin' : 'Delivery Login'}
          </CardTitle>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Partner Dashboard Access</p>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input 
                  type="email" 
                  placeholder="partner@shopykart.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                  required
                />
              </div>
            </div>
            
            {view === 'login' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                    required
                  />
                </div>
                <div className="flex justify-end px-1 mt-1">
                  <button onClick={() => setView('forgot')} className="text-[9px] font-black uppercase text-primary tracking-[0.2em] hover:underline underline-offset-4">
                    Forgot Pin?
                  </button>
                </div>
              </div>
            )}

            <Button 
              onClick={view === 'forgot' ? handleResetPassword : handleLogin} 
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase italic text-lg shadow-xl shadow-primary/20 mt-4"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (view === 'forgot' ? "SEND RESET LINK" : "ENTER HUB")}
            </Button>

            {view === 'forgot' && (
              <button onClick={() => setView('login')} className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-white mt-2">
                <ChevronLeft className="h-3 w-3" /> BACK TO LOGIN
              </button>
            )}
            
            {view === 'login' && (
              <>
                <div className="relative py-2 pt-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase"><span className="bg-[#0B0B0B] px-2 text-gray-500">New Partner?</span></div>
                </div>

                <Button 
                  type="button" 
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/10 text-white font-black uppercase italic tracking-tighter hover:bg-white/5"
                  onClick={() => router.push('/delivery/register')}
                >
                  BECOME A PARTNER
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}

            <Button 
              type="button" 
              variant="ghost"
              className="w-full h-12 text-gray-500 font-bold uppercase text-[10px] tracking-widest"
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
