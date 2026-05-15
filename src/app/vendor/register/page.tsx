
"use client"

import { useState, useRef } from 'react';
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

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormData(type, reader.result as string);
      toast({ title: "Image Added", description: `${type === 'logo' ? 'Logo' : 'Cover'} selected successfully.` });
    };
    reader.readAsDataURL(file);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: "Error", description: "Geolocation not supported." });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateFormData('lat', pos.coords.latitude.toFixed(6));
        updateFormData('lng', pos.coords.longitude.toFixed(6));
        setLoading(false);
        toast({ title: "Location Set", description: "Coordinates captured successfully." });
      },
      () => {
        setLoading(false);
        toast({ variant: "destructive", title: "Error", description: "Could not fetch location." });
      }
    );
  };

  const handleSubmit = async () => {
    if (!firestore || !auth) return;
    
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: "destructive", title: "Password Mismatch", description: "Passwords do not match." });
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const vendorData = {
        ...formData,
        id: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        // We use 'storeName' and 'imageUrl' (logo) to match common entity properties
        imageUrl: formData.logo,
        bannerUrl: formData.cover
      };

      await setDoc(doc(firestore, 'vendors', user.uid), vendorData);
      await setDoc(doc(firestore, 'vendor_applications', user.uid), vendorData);

      await auth.signOut();
      setStep('success');
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Registration Error", 
        description: err.message || "Failed to submit application." 
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'category':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center">Select Category</h2>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => updateFormData('category', 'Food')}
                className={cn(
                  "p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all",
                  formData.category === 'Food' ? "border-primary bg-primary/5 scale-105" : "border-border hover:border-primary/20"
                )}
              >
                <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Utensils className="h-10 w-10" /></div>
                <span className="font-black uppercase italic">Food</span>
              </button>
              <button 
                onClick={() => updateFormData('category', 'Grocery')}
                className={cn(
                  "p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all",
                  formData.category === 'Grocery' ? "border-primary bg-primary/5 scale-105" : "border-border hover:border-primary/20"
                )}
              >
                <div className="bg-primary/10 p-4 rounded-2xl text-primary"><ShoppingBag className="h-10 w-10" /></div>
                <span className="font-black uppercase italic">Grocery</span>
              </button>
            </div>
            <Button 
              disabled={!formData.category}
              onClick={() => setStep('store-info')}
              className="w-full h-14 rounded-2xl bg-primary font-black uppercase italic"
            >
              NEXT <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        );

      case 'store-info':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Store Details</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{formData.category === 'Food' ? 'Restaurant Name' : 'Store Name'}</label>
                <Input placeholder="Enter Name" value={formData.storeName} onChange={(e) => updateFormData('storeName', e.target.value)} className="h-12 rounded-xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Upload Logo</label>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="h-28 w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                  >
                    {formData.logo ? (
                      <img src={formData.logo} className="h-full w-full object-cover" alt="Logo" />
                    ) : (
                      <>
                        <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-[8px] font-black uppercase text-muted-foreground">Gallery</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Upload Cover</label>
                  <div 
                    onClick={() => coverInputRef.current?.click()}
                    className="h-28 w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
                  >
                    {formData.cover ? (
                      <img src={formData.cover} className="h-full w-full object-cover" alt="Cover" />
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-[8px] font-black uppercase text-muted-foreground">Gallery</span>
                      </>
                    )}
                  </div>
                  <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Select Zone</label>
                <Select value={formData.zone} onValueChange={(val) => updateFormData('zone', val)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Pick Area" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="Ranipur">Ranipur (284205)</SelectItem>
                    <SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted/20 p-4 rounded-2xl space-y-4 border border-border/50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-muted-foreground">Set Store Location (GPS)</label>
                  <Button variant="ghost" size="sm" onClick={handleGetLocation} className="text-[10px] font-black uppercase text-primary h-7">
                    <LocateFixed className="h-3 w-3 mr-1" /> FETCH
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Latitude" value={formData.lat} readOnly className="h-10 rounded-lg bg-white/50 text-[10px] font-bold" />
                  <Input placeholder="Longitude" value={formData.lng} readOnly className="h-10 rounded-lg bg-white/50 text-[10px] font-bold" />
                </div>
              </div>

              {formData.category === 'Food' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">FSSAI No. (Optional)</label>
                  <Input placeholder="14-digit Number" value={formData.fssai} onChange={(e) => updateFormData('fssai', e.target.value)} className="h-12 rounded-xl" />
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('category')} className="h-14 rounded-2xl flex-1 font-black uppercase italic">BACK</Button>
              <Button 
                onClick={() => setStep('owner-info')}
                className="h-14 rounded-2xl flex-[2] bg-primary font-black uppercase italic"
              >
                NEXT <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );

      case 'owner-info':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Owner Info</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name" value={formData.firstName} onChange={(e) => updateFormData('firstName', e.target.value)} className="h-12 rounded-xl" />
                <Input placeholder="Last Name" value={formData.lastName} onChange={(e) => updateFormData('lastName', e.target.value)} className="h-12 rounded-xl" />
              </div>
              <Input placeholder="Phone Number" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Email Address" type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Create Password" type="password" value={formData.password} onChange={(e) => updateFormData('password', e.target.value)} className="h-12 rounded-xl" />
              <Input placeholder="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => updateFormData('confirmPassword', e.target.value)} className="h-12 rounded-xl" />
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep('store-info')} className="h-14 rounded-2xl flex-1 font-black uppercase italic">BACK</Button>
              <Button 
                onClick={() => setStep('commission')}
                className="h-14 rounded-2xl flex-[2] bg-primary font-black uppercase italic"
              >
                SUBMIT
              </Button>
            </div>
          </div>
        );

      case 'commission':
        return (
          <div className="space-y-8 animate-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Agreement</h2>
            </div>

            <div className="bg-gradient-to-br from-[#0B0B0B] to-[#1A1A1A] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="bg-primary/20 self-start px-4 py-1.5 rounded-full border border-primary/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">₹5 COMMISSION</span>
                </div>
                
                <p className="text-xs text-gray-300 font-bold uppercase tracking-widest leading-relaxed">
                  Restaurant will pay ₹5 commission to Shopykart from each order. You will get access of all features in vendor panel and user interaction.
                </p>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-primary" /> Full Access to Panel
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <CheckCircle2 className="h-3 w-3 text-primary" /> Real-time Store Visibility
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 font-black uppercase italic text-lg shadow-xl shadow-primary/20"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "I AGREE & SUBMIT"}
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-6 py-10 animate-in zoom-in duration-500">
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping duration-1000" />
              <div className="relative bg-white shadow-xl rounded-full p-6 border-4 border-green-500">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">SUBMITTED SUCCESSFULLY</h2>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Form Received</p>
            </div>

            <div className="bg-muted/30 p-6 rounded-3xl border border-dashed border-muted-foreground/30">
              <p className="text-xs font-bold leading-relaxed text-muted-foreground">
                Your form has been submitted. <br />
                <span className="text-black font-black uppercase">You can login within 12 hours</span> after approval.
              </p>
            </div>

            <Button 
              onClick={() => router.push('/vendor/login')}
              className="w-full h-14 rounded-2xl bg-black text-white font-black uppercase italic"
            >
              BACK TO LOGIN
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardContent className="p-10">
          {renderStep()}
        </CardContent>
      </Card>
      
      {step !== 'success' && (
        <div className="mt-8 flex items-center gap-3 opacity-30">
          <Info className="h-4 w-4" />
          <span className="text-[8px] font-black uppercase tracking-[0.3em]">Official Onboarding Portal</span>
        </div>
      )}
    </div>
  );
}
