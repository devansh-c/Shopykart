
"use client"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, ShieldCheck, UserCog, Loader2 } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

function AdminLoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const firestore = useFirestore();

  // If coming from "Team Member" link, clear any existing admin session first
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'team') {
      localStorage.removeItem('admin_auth');
      localStorage.removeItem('team_permissions');
    } else {
      const auth = localStorage.getItem('admin_auth');
      if (auth === 'true') {
        router.push('/admin/dashboard');
      }
    }
  }, [router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const inputEmail = email.trim().toLowerCase();
    const inputPass = password.trim();

    // 1. Check Master Admin Credentials
    if (inputEmail === 'ceo@shopykart.co.in' && inputPass === 'Ping@123//') {
      localStorage.setItem('admin_auth', 'true');
      localStorage.setItem('team_permissions', 'all');
      toast({ title: "Admin Login Successful" });
      router.push('/admin/dashboard');
      setLoading(false);
      return;
    }

    // 2. Check Team Member Credentials in Firestore
    if (firestore) {
      try {
        const teamRef = collection(firestore, 'team_members');
        const q = query(teamRef, where('employeeId', '==', inputEmail));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const memberData = snapshot.docs[0].data();
          if (memberData.password === inputPass) {
            localStorage.setItem('admin_auth', 'true');
            localStorage.setItem('team_permissions', JSON.stringify(memberData.permissions || []));
            toast({ title: "Welcome Team Member!", description: memberData.fullName });
            router.push('/admin/dashboard');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Team check error:", err);
      }
    }

    toast({ 
      variant: "destructive", 
      title: "Access Denied", 
      description: "Invalid credentials or unauthorized account." 
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardHeader className="text-center pt-10">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black italic uppercase tracking-tighter">RESTRICTED HUB</CardTitle>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Admin & Staff Access Portal</p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Staff ID or Email</label>
                <div className="relative">
                  <UserCog className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="text" 
                    placeholder="e.g. CEO or TeamRahul1" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold text-black"
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-muted/20 border-none font-bold text-black"
                    required
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-16 rounded-[2rem] bg-black hover:bg-primary text-white font-black uppercase italic text-lg shadow-xl transition-all"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "AUTHENTICATE"}
            </Button>

            <Button 
              type="button" 
              variant="ghost" 
              className="w-full text-[10px] font-black uppercase tracking-widest text-gray-400"
              onClick={() => router.push('/')}
            >
              EXIT TO HOME
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" /></div>}>
      <AdminLoginPageContent />
    </Suspense>
  )
}
