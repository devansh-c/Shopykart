"use client"

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Mail, Lock, User, Phone, ArrowLeft, Loader2, CheckCircle2, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function DeliveryRegistrationContent() {
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
    assignedPincode: '',
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

    if (!formData.assignedPincode) {
      toast({ variant: "destructive", title: "Area Selection Required", description: "Please select a pincode to serve." });
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
        assignedPincode: formData.assignedPincode,
        photoUrl: photo,
        status: 'active',
        role: 'delivery',
        isOnline: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'delivery_partners', user.uid), partnerData);
      
      localStorage.setItem('delivery_session_active', 'true');
      toast({ title: "Registration Successful!", description: "Welcome to ShopyKart Fleet." });
      
      setTimeout(() => {
        router.push('/delivery/dashboard');
      }, 500);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 py-10">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] bg-white overflow-hidden relative">
        <CardHeader className="text-center pt-12 pb-6">
          <button onClick={() => router.back()} className="absolute top-8 left-8 text-gray-400 hover:text-primary transition-colors active:scale-90">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border border-primary/20 shadow-inner">
            <User className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Join Fleet</CardTitle>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">New Partner Registration</p>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="flex flex-col items-center mb-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="h-28 w-28 rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative hover:border-primary/40 transition-all"
              >
                {photo ? (
                  <img src={photo} className="h-full w-full object-cover" alt="Profile" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 text-gray-300 group-hover:text-primary transition-colors" />
                    <span className="text-[8px] font-black uppercase text-gray-400 mt-1">Upload Photo</span>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">First Name</label>
                <Input 
                  placeholder="Rahul" 
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value.toUpperCase()})}
                  className="bg-muted/20 border-none h-12 rounded-xl font-bold uppercase"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Last Name</label>
                <Input 
                  placeholder="Singh" 
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value.toUpperCase()})}
                  className="bg-muted/20 border-none h-12 rounded-xl font-bold uppercase"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">10-Digit Mobile</label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input 
                  type="tel"
                  placeholder="9876543210" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'').slice(0,10)})}
                  className="pl-12 bg-muted/20 border-none h-12 rounded-xl font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-primary ml-1 flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> Preferred Serving Area</label>
              <Select value={formData.assignedPincode} onValueChange={(val) => setFormData({...formData, assignedPincode: val})}>
                <SelectTrigger className="bg-muted/20 border-none h-12 rounded-xl font-bold">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 rounded-xl shadow-2xl">
                  <SelectItem value="284205" className="font-bold py-3">Ranipur (284205)</SelectItem>
                  <SelectItem value="284204" className="font-bold py-3">Mauranipur (284204)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Login Email</label>
              <Input 
                type="email"
                placeholder="rider@shopykart.co.in" 
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})}
                className="bg-muted/20 border-none h-12 rounded-xl font-bold uppercase text-[10px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Create Pin</label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="bg-muted/20 border-none h-12 rounded-xl font-bold text-center"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Confirm Pin</label>
                <Input 
                  type="password"
                  placeholder="••••••••" 
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="bg-muted/20 border-none h-12 rounded-xl font-bold text-center"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-18 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-xl transition-all active:scale-95 py-8"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "REGISTER & START"}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-2 opacity-20 pointer-events-none">
         <ShieldCheck className="h-4 w-4" />
         <span className="text-[8px] font-black uppercase tracking-[0.5em]">Official Fleet Enrollment</span>
      </div>
    </div>
  );
}

export default function DeliveryRegistrationPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DeliveryRegistrationContent />
    </Suspense>
  );
}
