
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bike, Mail, Lock, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function DeliveryLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Welcome!", description: "Accessing Delivery Hub." });
      router.push('/delivery/dashboard');
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Login Failed", 
        description: "Invalid credentials. Delivery partners must be assigned by admin." 
      });
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
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">Delivery Login</CardTitle>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Partner Dashboard Access</p>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleLogin} className="space-y-4">
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
            </div>
            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase italic text-lg shadow-xl shadow-primary/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTER HUB"}
            </Button>
            
            <Button 
              type="button" 
              variant="ghost"
              className="w-full h-12 text-gray-500 font-bold uppercase text-[10px] tracking-widest"
              onClick={() => router.push('/')}
            >
              BACK TO HOME
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
