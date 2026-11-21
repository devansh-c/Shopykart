
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Lock, Fingerprint, Loader2, ChevronLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

/**
 * @fileOverview Hotel Partner Login Page.
 */
export default function HotelLoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore || loading) return;

    setLoading(true);
    try {
      const q = query(collection(firestore, 'hotels'), where('loginId', '==', identifier.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        toast({ variant: "destructive", title: "Identity Error", description: "Invalid Login ID." });
        setLoading(false);
        return;
      }

      const hotelData = snap.docs[0].data();
      if (hotelData.password !== password) {
        toast({ variant: "destructive", title: "Wrong Password" });
        setLoading(false);
        return;
      }

      localStorage.setItem('hotel_partner_id', snap.docs[0].id);
      localStorage.setItem('shopykart_session_active', 'true');
      
      toast({ title: "Authenticated! ✅", description: "Opening Partner Console..." });
      router.push('/hotel/dashboard');
    } catch (err) {
      toast({ variant: "destructive", title: "Login Failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center pt-12 pb-6">
           <div className="mx-auto bg-amber-50 w-20 h-20 rounded-[1.75rem] flex items-center justify-center mb-4 border border-amber-100 shadow-inner">
             <Building2 className="h-10 w-10 text-amber-600" />
           </div>
           <CardTitle className="text-3xl font-black italic uppercase tracking-tighter">Hotel Partner</CardTitle>
           <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">Management Console</p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Partner ID</label>
                  <div className="relative">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="E.G. HOTEL_RANIPUR" value={identifier} onChange={e => setIdentifier(e.target.value)} className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold uppercase" required />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Pin</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-black" required />
                  </div>
               </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-18 rounded-[2rem] bg-black hover:bg-amber-600 text-white font-black uppercase italic text-lg shadow-xl transition-all">
               {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ENTER CONSOLE"}
            </Button>

            <button type="button" onClick={() => router.push('/hotel/register')} className="w-full text-[10px] font-black uppercase text-primary tracking-widest">BECOME A HOTEL PARTNER</button>
            <button type="button" onClick={() => router.push('/')} className="w-full text-[10px] font-black uppercase text-gray-400 flex items-center justify-center gap-2">
              <ChevronLeft className="h-3 w-3" /> BACK TO HOME
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
