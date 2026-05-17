"use client"

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Utensils, 
  ShoppingBag, 
  ChevronLeft, 
  Camera, 
  CheckCircle2,
  ShieldCheck,
  ImageIcon,
  Eye,
  EyeOff,
  Loader2,
  LocateFixed,
  Star
} from 'lucide-react';
import { useFirestore, useAuth } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { compressImage } from '@/lib/image-utils';

type Step = 'category' | 'store-info' | 'owner-info' | 'commission' | 'success';

export default function VendorRegistrationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('category');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '', 
    storeName: '',
    logo: '',
    cover: '',
    zone: '', 
    plusCode: '', 
    addressLine: '', 
    state: 'Uttar Pradesh', 
    rating: '4.5', 
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
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      // Compress immediately to prevent Firestore document size limit error
      const compressed = await compressImage(base64, type === 'cover' ? 1200 : 400, type === 'cover' ? 600 : 400);
      updateFormData(type, compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Error", description: "GPS not supported." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const code = `${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`;
        updateFormData('plusCode', code);
        toast({ title: "Location Captured", description: `Plus Code: ${code}` });
      },
      () => {
        toast({ variant: "destructive", title: "GPS Error", description: "Please enter manually." });
      }
    );
  };

  const validateStep = () => {
    if (step === 'category') return !!formData.category;
    if (step === 'store-info') {
      return !!formData.storeName && !!formData.logo && !!formData.cover && !!formData.zone && !!formData.addressLine && !!formData.state;
    }
    if (step === 'owner-info') {
      const basic = !!formData.firstName && !!formData.lastName && !!formData.phone && !!formData.email && !!formData.password;
      if (!basic) return false;
      if (formData.phone.length !== 10) return false;
      if (formData.password !== formData.confirmPassword) return false;
      return formData.password.length >= 6;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!firestore || !auth || isProcessing) return;
    setIsProcessing(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.trim().toLowerCase(), 
        formData.password
      );
      const user = userCredential.user;

      const vendorData = {
        id: user.uid,
        storeName: formData.storeName,
        category: formData.category,
        imageUrl: formData.logo,
        bannerUrl: formData.cover,
        town: formData.zone,
        plusCode: formData.plusCode,
        address: formData.addressLine,
        state: formData.state,
        fssai: formData.fssai,
        rating: parseFloat(formData.rating) || 4.5,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email.trim().toLowerCase(),
        status: 'approved',
        isOnline: true,
        createdAt: serverTimestamp(),
        walletBalance: 0
      };

      const vRef = doc(firestore, 'vendors', user.uid);
      await setDoc(vRef, vendorData);

      const appRef = doc(firestore, 'vendor_applications', user.uid);
      await setDoc(appRef, vendorData);

      setStep('success');
      toast({ title: "Account Activated!", description: "Your store is now live on ShopyKart." });

    } catch (err: any) {
      console.error("Registration failed:", err);
      if (err.code === 'auth/email-already-in-use') {
        toast({ variant: "destructive", title: "Error", description: "Email already exists." });
        setStep('owner-info'); 
      } else {
        toast({ variant: "destructive", title: "Database Error", description: "Registration failed." });
      }
    } finally {
      setIsProcessing(false);
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
              <Button disabled={!formData.category} onClick={() => setStep('store-info')} className="w-full h-14 rounded-2xl bg-primary font-black uppercase italic shadow-lg shadow-primary/20">NEXT</Button>
            </div>
          )}

          {step === 'store-info' && (
            <div className="space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar pr-1">
              <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white z-10 py-1">
                <button onClick={() => setStep('category')} className="p-2 bg-muted rounded-xl"><ChevronLeft className="h-4 w-4" /></button>
                <h2 className="text-xl font-black italic uppercase">Store Info</h2>
              </div>
              
              <Input placeholder="Store Name *" value={formData.storeName} onChange={(e) => updateFormData('storeName', e.target.value)} className="h-12 rounded-xl" />
              
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => logoInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                  {formData.logo ? <img src={formData.logo} className="h-full w-full object-cover" alt="Logo" /> : <><Camera className="h-5 text-muted-foreground" /><span className="text-[8px] font-black uppercase mt-1">Logo *</span></>}
                </div>
                <div onClick={() => coverInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                  {formData.cover ? <img src={formData.cover} className="h-full w-full object-cover" alt="Cover" /> : <><ImageIcon className="h-5 text-muted-foreground" /><span className="text-[8px] font-black uppercase mt-1">Banner *</span></>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Plus Code / Location</label>
                  <button onClick={handleGetLocation} className="text-primary text-[9px] font-black uppercase flex items-center gap-1"><LocateFixed className="h-2.5 w-2.5" /> Auto Fill</button>
                </div>
                <Input placeholder="Enter Plus Code or GPS" value={formData.plusCode} onChange={(e) => updateFormData('plusCode', e.target.value)} className="h-12 rounded-xl" />
              </div>

              <Select value={formData.zone} onValueChange={(val) => updateFormData('zone', val)}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="Select Town / Zone *" /></SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="Ranipur">Ranipur (284205)</SelectItem>
                  <SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem>
                </SelectContent>
              </Select>

              <Textarea 
                placeholder="Store Address Line (e.g. Near Main Market) *" 
                value={formData.addressLine} 
                onChange={(e) => updateFormData('addressLine', e.target.value)} 
                className="rounded-xl min-h-[80px]"
              />

              <Input placeholder="Store State *" value={formData.state} onChange={(e) => updateFormData('state', e.target.value)} className="h-12 rounded-xl" />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Initial Rating</label>
                   <Input type="number" step="0.1" max="5" placeholder="Rating (e.g. 4.5)" value={formData.rating} onChange={(e) => updateFormData('rating', e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">FSSAI (Optional)</label>
                   <Input placeholder="FSSAI Number" value={formData.fssai} onChange={(e) => updateFormData('fssai', e.target.value)} className="h-12 rounded-xl" />
                </div>
              </div>

              <Button disabled={!validateStep()} onClick={() => setStep('owner-info')} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic shadow-lg shadow-primary/20">NEXT STEP</Button>
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
              <Input placeholder="Phone Number *" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className="h-12 rounded-xl" maxLength={10} />
              <Input placeholder="Email Address *" type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} className="h-12 rounded-xl" />
              <div className="relative">
                <Input placeholder="Password *" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => updateFormData('password', e.target.value)} className="h-12 rounded-xl pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <Input placeholder="Confirm Password *" type="password" value={formData.confirmPassword} onChange={(e) => updateFormData('confirmPassword', e.target.value)} className="h-12 rounded-xl" />
              <Button disabled={!validateStep()} onClick={() => setStep('commission')} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic mt-4 shadow-lg shadow-primary/20">REVIEW & SUBMIT</Button>
            </div>
          )}

          {step === 'commission' && (
            <div className="space-y-6 text-center">
              <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              
              {/* Premium Commission Box Matching Screenshot */}
              <div className="bg-black text-white p-10 rounded-[3rem] space-y-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <ShieldCheck className="h-12 w-12" />
                </div>
                <div className="flex justify-center">
                  <span className="bg-[#EF4444] text-white text-[10px] font-black px-5 py-2 rounded-full uppercase italic tracking-tighter">
                    ₹5 COMMISSION
                  </span>
                </div>
                <p className="text-base font-black leading-tight text-white uppercase italic tracking-tighter">
                  PER SUCCESSFUL ORDER<br />CHARGED.
                </p>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={isProcessing}
                className="w-full h-16 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-3xl font-black uppercase italic text-lg shadow-xl shadow-red-200 active:scale-95 transition-all"
              >
                I AGREE & SUBMIT
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6 py-10 animate-in zoom-in duration-500">
              <div className="relative mx-auto w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20" />
                <div className="relative bg-blue-600 h-24 w-24 rounded-full flex items-center justify-center shadow-xl shadow-blue-200">
                  <CheckCircle2 className="h-14 w-14 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-black italic uppercase text-blue-600">LIVE NOW!</h2>
              <p className="text-xs font-black text-muted-foreground uppercase px-4">Account activated. Your store is now visible on Home Page.</p>
              <Button onClick={() => router.push('/vendor/dashboard')} className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black uppercase italic text-lg shadow-xl shadow-blue-200">ENTER DASHBOARD</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
    </div>
  );
}
