
"use client"

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';

export default function DeliveryRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 400, 400);
      setPhoto(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;

    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Passwords Mismatch" });
      return;
    }

    if (!photo) {
      toast({ variant: "destructive", title: "Photo Required", description: "Please upload your profile picture." });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email.trim().toLowerCase(), formData.password);
      const user = userCredential.user;

      const partnerData = {
        uid: user.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        fullName: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        email: formData.email.trim().toLowerCase(),
        photoUrl: photo,
        status: 'active',
        role: 'delivery',
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'delivery_partners', user.uid), partnerData);
      
      toast({ title: "Registration Successful!", description: "Welcome to ShopyKart Fleet." });
      router.push('/delivery/dashboard');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4 py-10">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
        <CardHeader className="text-center pt-8">
          <button onClick={() => router.back()} className="absolute top-8 left-8 text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="mx-auto bg-primary/20 w-14 h-14 rounded-2xl flex items-center justify-center mb-4">
            <User className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black italic uppercase text-white">Join Fleet</CardTitle>
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Create Delivery Account</p>
        </CardHeader>
        <CardContent className="px-8 pb-10">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex flex-col items-center mb-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-24 w-24 rounded-full border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative"
              >
                {photo ? (
                  <img src={photo} className="h-full w-full object-cover" alt="Profile" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 text-gray-500" />
                    <span className="text-[8px] font-black uppercase text-gray-500 mt-1">Add Photo</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input 
                placeholder="First Name" 
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                required
              />
              <Input 
                placeholder="Last Name" 
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
                required
              />
            </div>

            <Input 
              type="tel"
              placeholder="10 Digit Phone" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10)})}
              className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
              required
            />

            <Input 
              type="email"
              placeholder="Email Address" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
              required
            />

            <Input 
              type="password"
              placeholder="Password" 
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
              required
            />

            <Input 
              type="password"
              placeholder="Confirm Password" 
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              className="bg-white/5 border-white/10 text-white h-12 rounded-xl"
              required
            />

            <Button 
              type="submit" 
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase italic text-lg shadow-xl shadow-primary/20"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "REGISTER & START"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
