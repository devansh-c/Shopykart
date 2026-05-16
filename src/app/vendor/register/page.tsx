
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
  Image as ImageIcon,
  Lock,
  Eye,
  EyeOff
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
  const [showPassword, setShowPassword] = useState(false);
  
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

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => updateFormData(type, reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Error", description: "GPS not supported." });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateFormData('lat', pos.coords.latitude.toFixed(6));
        updateFormData('lng', pos.coords.longitude.toFixed(6));
        setLoading(false);
        toast({ title: "Location Captured", description: "Coordinates updated automatically." });
      },
      () => {
        setLoading(false);
        toast({ variant: "destructive", title: "GPS Error", description: "Please enter coordinates manually." });
      }
    );
  };

  const isPasswordStrong = (pw: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pw);
  };

  const validateStep = () => {
    if (step === 'category') return !!formData.category;
    if (step === 'store-info') {
      return !!formData.storeName && !!formData.logo && !!formData.cover && !!formData.zone && !!formData.lat && !!formData.lng;
    }
    if (step === 'owner-info') {
      const basic = !!formData.firstName && !!formData.lastName && !!formData.phone && !!formData.email && !!formData.password;
      if (!basic) return false;
      if (formData.phone.length !== 10) return false;
      if (formData.password !== formData.confirmPassword) return false;
      return isPasswordStrong(formData.password);
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!firestore || !auth) return;
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const vendorData = {
        ...formData,
        id: user.uid,
        status: 'approved', // Auto-approve instantly
        createdAt: serverTimestamp(),
        imageUrl: formData.logo,
        bannerUrl: formData.cover,
        town: formData.zone,
        rating: 4.5,
        walletBalance: 0
      };

      await setDoc(doc(firestore, 'vendors', user.uid), vendorData);
      // Optional: keep application for record
      await setDoc(doc(firestore, 'vendor_applications', user.uid), vendorData);
      
      await signOut(auth);
      
      // Play success ring sound
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});

      // Instant transition to success
      setStep('success');
      setLoading(false);
      
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Error", description: err.message });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardContent className="p-8">
          {step === 'category' && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Business Type</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">All fields are mandatory</p>
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
          )}

          {step === 'store-info' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep('category')} className="p-2 bg-muted rounded-xl"><ChevronLeft className="h-4 w-4" /></button>
                <h2 className="text-xl font-black italic uppercase">Store Info</h2>
              </div>
              
              <Input placeholder="Store / Restaurant Name *" value={formData.storeName} onChange={(e) => updateFormData('storeName', e.target.value)} className="h-12 rounded-xl" />
              
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => logoInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                  {formData.logo ? <img src={formData.logo} className="h-full w-full object-cover" /> : <><Camera className="h-5 text-muted-foreground" /><span className="text-[8px] font-black uppercase mt-1">Store Logo *</span></>}
                </div>
                <div onClick={() => coverInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                  {formData.cover ? <img src={formData.cover} className="h-full w-full object-cover" /> : <><ImageIcon className="h-5 text-muted-foreground" /><span className="text-[8px] font-black uppercase mt-1">Banner Image *</span></>}
                </div>
              </div>

              <Select value={formData.zone} onValueChange={(val) => updateFormData('zone', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="Select Town / Zone *" /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Ranipur">Ranipur (284205)</SelectItem>
                  <SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem>
                </SelectContent>
              </Select>

              <div className="bg-muted/20 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">GPS Coordinates *</label>
                  <Button variant="ghost" size="sm" onClick={handleGetLocation} className="h-6 text-[10px] text-primary font-black">GET GPS</Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Lat" value={formData.lat} onChange={(e) => updateFormData('lat', e.target.value)} className="h-10 text-xs bg-white" />
                  <Input placeholder="Lng" value={formData.lng} onChange={(e) => updateFormData('lng', e.target.value)} className="h-10 text-xs bg-white" />
                </div>
              </div>

              <Input placeholder="FSSAI License (Optional)" value={formData.fssai} onChange={(e) => updateFormData('fssai', e.target.value)} className="h-12 rounded-xl" />

              <Button disabled={!validateStep()} onClick={() => setStep('owner-info')} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic mt-4">NEXT STEP</Button>
            </div>
          )}

          {step === 'owner-info' && (
            <div className="space-y-4">
               <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep('store-info')} className="p-2 bg-muted rounded-xl"><ChevronLeft className="h-4 w-4" /></button>
                <h2 className="text-xl font-black italic uppercase">Owner Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="First Name *" value={formData.firstName} onChange={(e) => updateFormData('firstName', e.target.value)} className="h-12 rounded-xl" />
                <Input placeholder="Last Name *" value={formData.lastName} onChange={(e) => updateFormData('lastName', e.target.value)} className="h-12 rounded-xl" />
              </div>

              <Input 
                placeholder="Phone Number (10 Digits) *" 
                value={formData.phone} 
                onChange={(e) => updateFormData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                className="h-12 rounded-xl" 
                maxLength={10}
              />
              <Input placeholder="Email Address *" type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} className="h-12 rounded-xl" />
              
              <div className="relative">
                <Input 
                  placeholder="Create Strong Password *" 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={(e) => updateFormData('password', e.target.value)} 
                  className="h-12 rounded-xl pr-10" 
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Input 
                placeholder="Confirm Password *" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={(e) => updateFormData('confirmPassword', e.target.value)} 
                className="h-12 rounded-xl" 
              />

              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Password Requirements:</p>
                <ul className="text-[9px] font-bold text-muted-foreground space-y-1">
                  <li className={formData.password.length >= 8 ? "text-green-600" : ""}>• Min 8 characters</li>
                  <li className={/[A-Z]/.test(formData.password) ? "text-green-600" : ""}>• At least 1 Uppercase letter</li>
                  <li className={/\d/.test(formData.password) ? "text-green-600" : ""}>• At least 1 Number</li>
                  <li className={/[@$!%*?&]/.test(formData.password) ? "text-green-600" : ""}>• At least 1 Special character (@, $, !)</li>
                </ul>
              </div>

              <Button disabled={!validateStep()} onClick={() => setStep('commission')} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic mt-4">REVIEW & SUBMIT</Button>
            </div>
          )}

          {step === 'commission' && (
            <div className="space-y-6 text-center">
              <div className="bg-primary/10 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-2"><ShieldCheck className="h-10 w-10 text-primary" /></div>
              <div className="bg-black text-white p-8 rounded-[2.5rem] space-y-4 shadow-2xl">
                <span className="bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">₹5 COMMISSION</span>
                <p className="text-sm font-bold leading-relaxed text-gray-300 uppercase tracking-tight">Per successful order commission will be charged. Full panel access included.</p>
              </div>
              <Button onClick={handleSubmit} disabled={loading} className="w-full h-16 bg-primary rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-primary/30">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "I AGREE & SUBMIT"}
              </Button>
              <button onClick={() => setStep('owner-info')} className="text-xs font-black uppercase text-muted-foreground">Go Back</button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6 py-10 animate-in zoom-in duration-500">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                <div className="relative bg-blue-600 h-24 w-24 rounded-full flex items-center justify-center shadow-xl shadow-blue-200">
                  <CheckCircle2 className="h-14 w-14 text-white animate-in zoom-in duration-300" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-blue-600">LIVE NOW!</h2>
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest px-4 leading-relaxed">
                  Your account is activated. You can now login and start selling your products instantly.
                </p>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => router.push('/vendor/login')} 
                  className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic text-lg shadow-xl shadow-blue-200 transition-all active:scale-95"
                >
                  LOGIN NOW
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
    </div>
  );
}
