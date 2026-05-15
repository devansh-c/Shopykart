
"use client"

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  Utensils, 
  ShoppingBag, 
  ChevronRight, 
  ChevronLeft, 
  Camera, 
  MapPin, 
  LocateFixed,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { useFirestore, useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = 'category' | 'store-info' | 'owner-info' | 'commission' | 'success';

export default function VendorRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('category');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: '', 
    storeName: '',
    logo: '',
    cover: '',
    zone: '', 
    lat: '',
    lng: '',
    fssai: '', 
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Reset loading when moving between steps
  useEffect(() => {
    setLoading(false);
  }, [step]);

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormData(type, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Error", description: "GPS not supported on this device." });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateFormData('lat', pos.coords.latitude.toFixed(6));
        updateFormData('lng', pos.coords.longitude.toFixed(6));
        setLoading(false);
        toast({ title: "Location Updated", description: "Store coordinates captured." });
      },
      () => {
        setLoading(false);
        toast({ variant: "destructive", title: "GPS Error", description: "Could not fetch location. Please enter manually if possible." });
      }
    );
  };

  const handleSubmit = async () => {
    if (!firestore || !auth) return;
    
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }

    setLoading(true);

    try {
      // 1. Create the Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const vendorData = {
        ...formData,
        id: user.uid,
        status: 'pending', // IMPORTANT: Initial status is pending
        createdAt: serverTimestamp(),
        imageUrl: formData.logo,
        bannerUrl: formData.cover,
        town: formData.zone 
      };

      // 2. Save to 'vendors' collection
      await setDoc(doc(firestore, 'vendors', user.uid), vendorData);

      // 3. Save to 'vendor_applications' for Admin Panel review
      await setDoc(doc(firestore, 'vendor_applications', user.uid), vendorData);

      // 4. Force Sign Out immediately so they can't access dashboard until approved
      await signOut(auth);
      
      setStep('success');
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/operation-not-allowed') {
        msg = "Email/Password sign-in is disabled in your Firebase Console. Go to Authentication > Sign-in method to enable it.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "This email is already registered.";
      }
      toast({ variant: "destructive", title: "Registration Error", description: msg });
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'category':
        return (
          <div className="space-y-6">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Join ShopyKart</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select your business type</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => updateFormData('category', 'Food')} className={cn("p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all active:scale-95", formData.category === 'Food' ? "border-primary bg-primary/5" : "border-border")}>
                <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Utensils className="h-10 w-10" /></div>
                <span className="font-black uppercase italic text-xs">Food</span>
              </button>
              <button onClick={() => updateFormData('category', 'Grocery')} className={cn("p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all active:scale-95", formData.category === 'Grocery' ? "border-primary bg-primary/5" : "border-border")}>
                <div className="bg-primary/10 p-4 rounded-2xl text-primary"><ShoppingBag className="h-10 w-10" /></div>
                <span className="font-black uppercase italic text-xs">Grocery</span>
              </button>
            </div>
            <Button disabled={!formData.category} onClick={() => setStep('store-info')} className="w-full h-14 rounded-2xl bg-primary font-black uppercase italic">NEXT</Button>
          </div>
        );
      case 'store-info':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Store Details</h2>
            <Input placeholder={formData.category === 'Food' ? 'Restaurant Name' : 'Store Name'} value={formData.storeName} onChange={(e) => updateFormData('storeName', e.target.value)} className="h-12 rounded-xl" />
            
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => logoInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30 group">
                {formData.logo ? <img src={formData.logo} className="h-full w-full object-cover" alt="Logo" /> : <><Camera className="h-6 text-muted-foreground group-hover:text-primary transition-colors" /><span className="text-[8px] font-black uppercase mt-1">Upload Logo</span></>}
              </div>
              <div onClick={() => coverInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30 group">
                {formData.cover ? <img src={formData.cover} className="h-full w-full object-cover" alt="Cover" /> : <><ImageIcon className="h-6 text-muted-foreground group-hover:text-primary transition-colors" /><span className="text-[8px] font-black uppercase mt-1">Upload Cover</span></>}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
              <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Location Info</label>
              <Select value={formData.zone} onValueChange={(val) => updateFormData('zone', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="Select Zone" /></SelectTrigger>
                <SelectContent className="rounded-2xl"><SelectItem value="Ranipur">Ranipur (284205)</SelectItem><SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem></SelectContent>
              </Select>
              
              <div className="bg-muted/20 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase tracking-widest">Store GPS Coordinates</label><Button variant="ghost" size="sm" onClick={handleGetLocation} className="h-6 text-[10px] text-primary font-black hover:bg-primary/10">FETCH GPS</Button></div>
                <div className="grid grid-cols-2 gap-2"><Input placeholder="Latitude" value={formData.lat} readOnly className="h-9 text-[10px] bg-white/50 border-none font-bold" /><Input placeholder="Longitude" value={formData.lng} readOnly className="h-9 text-[10px] bg-white/50 border-none font-bold" /></div>
              </div>
            </div>

            <Input placeholder="FSSAI License No. (Optional)" value={formData.fssai} onChange={(e) => updateFormData('fssai', e.target.value)} className="h-12 rounded-xl" />

            <div className="flex gap-4 pt-4"><Button variant="outline" onClick={() => setStep('category')} className="flex-1 h-12 rounded-xl font-black uppercase">BACK</Button><Button disabled={!formData.storeName || !formData.zone} onClick={() => setStep('owner-info')} className="flex-[2] h-12 bg-primary rounded-xl font-black uppercase italic">NEXT</Button></div>
          </div>
        );
      case 'owner-info':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center">Owner Info</h2>
            <div className="grid grid-cols-2 gap-3"><Input placeholder="First Name" value={formData.firstName} onChange={(e) => updateFormData('firstName', e.target.value)} className="h-12 rounded-xl" /><Input placeholder="Last Name" value={formData.lastName} onChange={(e) => updateFormData('lastName', e.target.value)} className="h-12 rounded-xl" /></div>
            <Input placeholder="Phone Number" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)} className="h-12 rounded-xl" />
            <Input placeholder="Email Address" type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} className="h-12 rounded-xl" />
            <Input placeholder="Create Password" type="password" value={formData.password} onChange={(e) => updateFormData('password', e.target.value)} className="h-12 rounded-xl" />
            <Input placeholder="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => updateFormData('confirmPassword', e.target.value)} className="h-12 rounded-xl" />
            <div className="flex gap-4 pt-4"><Button variant="outline" onClick={() => setStep('store-info')} className="flex-1 h-12 rounded-xl font-black uppercase">BACK</Button><Button disabled={!formData.email || !formData.password} onClick={() => setStep('commission')} className="flex-[2] h-12 bg-primary rounded-xl font-black uppercase italic">SUBMIT</Button></div>
          </div>
        );
      case 'commission':
        return (
          <div className="space-y-6 text-center py-4">
            <div className="bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <div className="bg-black text-white p-8 rounded-[2.5rem] space-y-4 shadow-2xl border border-primary/20">
              <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">₹5 COMMISSION</span>
              <p className="text-sm font-bold leading-relaxed text-gray-300 uppercase tracking-tight">Restaurant will pay ₹5 commission to Shopykart from each order. Access all features of vendor panel, customer interaction, and delivery management.</p>
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full h-16 bg-primary rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-primary/30">
              {loading ? <div className="flex items-center gap-2"><Loader2 className="h-6 w-6 animate-spin" /> SUBMITTING...</div> : "I AGREE & SUBMIT"}
            </Button>
            <Button variant="ghost" onClick={() => setStep('owner-info')} className="text-xs font-black uppercase text-muted-foreground">Go Back</Button>
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-6 py-12 animate-in fade-in zoom-in duration-500">
            <div className="relative mx-auto w-24 h-24">
               <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" />
               <div className="relative bg-blue-500 h-24 w-24 rounded-full flex items-center justify-center shadow-xl">
                 <CheckCircle2 className="h-14 w-14 text-white" />
               </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">SUBMITTED!</h2>
              <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-4">Your application is under review. Admin will enable your access soon.</p>
            </div>
            <div className="bg-muted/30 p-6 rounded-3xl mx-4">
               <p className="text-xs font-bold text-foreground uppercase tracking-tight">You can login within <span className="text-primary">12 hours</span> after approval.</p>
            </div>
            <Button onClick={() => router.push('/vendor/login')} className="w-full h-14 rounded-2xl bg-black font-black uppercase italic tracking-tighter mt-4">BACK TO LOGIN</Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardContent className="p-8">{renderStep()}</CardContent>
      </Card>
    </div>
  );
}
