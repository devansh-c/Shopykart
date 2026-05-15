
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
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateFormData('lat', pos.coords.latitude.toFixed(6));
        updateFormData('lng', pos.coords.longitude.toFixed(6));
        setLoading(false);
      },
      () => setLoading(false)
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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const vendorData = {
        ...formData,
        id: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        imageUrl: formData.logo,
        bannerUrl: formData.cover,
        town: formData.zone // Sync zone with town for filtering
      };

      // Initiate writes
      setDoc(doc(firestore, 'vendors', user.uid), vendorData)
        .catch(async () => {
           errorEmitter.emit('permission-error', new FirestorePermissionError({
             path: `vendors/${user.uid}`, operation: 'create', requestResourceData: vendorData
           }));
        });

      setDoc(doc(firestore, 'vendor_applications', user.uid), vendorData)
        .catch(async () => {
           errorEmitter.emit('permission-error', new FirestorePermissionError({
             path: `vendor_applications/${user.uid}`, operation: 'create', requestResourceData: vendorData
           }));
        });

      await auth.signOut();
      setStep('success');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'category':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center">Select Category</h2>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => updateFormData('category', 'Food')} className={cn("p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all", formData.category === 'Food' ? "border-primary bg-primary/5" : "border-border")}>
                <div className="bg-primary/10 p-4 rounded-2xl text-primary"><Utensils className="h-10 w-10" /></div>
                <span className="font-black uppercase italic">Food</span>
              </button>
              <button onClick={() => updateFormData('category', 'Grocery')} className={cn("p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all", formData.category === 'Grocery' ? "border-primary bg-primary/5" : "border-border")}>
                <div className="bg-primary/10 p-4 rounded-2xl text-primary"><ShoppingBag className="h-10 w-10" /></div>
                <span className="font-black uppercase italic">Grocery</span>
              </button>
            </div>
            <Button disabled={!formData.category} onClick={() => setStep('store-info')} className="w-full h-14 rounded-2xl bg-primary font-black uppercase italic">NEXT</Button>
          </div>
        );
      case 'store-info':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Store Details</h2>
            <Input placeholder={formData.category === 'Food' ? 'Restaurant Name' : 'Store Name'} value={formData.storeName} onChange={(e) => updateFormData('storeName', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <div onClick={() => logoInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                {formData.logo ? <img src={formData.logo} className="h-full w-full object-cover" /> : <><Camera className="h-6 text-muted-foreground" /><span className="text-[8px] font-black uppercase">Logo</span></>}
              </div>
              <div onClick={() => coverInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                {formData.cover ? <img src={formData.cover} className="h-full w-full object-cover" /> : <><ImageIcon className="h-6 text-muted-foreground" /><span className="text-[8px] font-black uppercase">Cover</span></>}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
              <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
            </div>
            <Select value={formData.zone} onValueChange={(val) => updateFormData('zone', val)}>
              <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Zone" /></SelectTrigger>
              <SelectContent><SelectItem value="Ranipur">Ranipur (284205)</SelectItem><SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem></SelectContent>
            </Select>
            <div className="bg-muted/20 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between items-center"><label className="text-[10px] font-black uppercase">Store GPS</label><Button variant="ghost" size="sm" onClick={handleGetLocation} className="h-6 text-[10px] text-primary">FETCH</Button></div>
              <div className="grid grid-cols-2 gap-2"><Input placeholder="Lat" value={formData.lat} readOnly className="h-8 text-[10px]" /><Input placeholder="Lng" value={formData.lng} readOnly className="h-8 text-[10px]" /></div>
            </div>
            <div className="flex gap-4"><Button variant="outline" onClick={() => setStep('category')} className="flex-1 h-12 rounded-xl">BACK</Button><Button onClick={() => setStep('owner-info')} className="flex-[2] h-12 bg-primary rounded-xl font-black uppercase italic">NEXT</Button></div>
          </div>
        );
      case 'owner-info':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center">Owner Info</h2>
            <div className="grid grid-cols-2 gap-2"><Input placeholder="First Name" value={formData.firstName} onChange={(e) => updateFormData('firstName', e.target.value)} /><Input placeholder="Last Name" value={formData.lastName} onChange={(e) => updateFormData('lastName', e.target.value)} /></div>
            <Input placeholder="Phone" value={formData.phone} onChange={(e) => updateFormData('phone', e.target.value)} />
            <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => updateFormData('email', e.target.value)} />
            <Input placeholder="Password" type="password" value={formData.password} onChange={(e) => updateFormData('password', e.target.value)} />
            <Input placeholder="Confirm Password" type="password" value={formData.confirmPassword} onChange={(e) => updateFormData('confirmPassword', e.target.value)} />
            <div className="flex gap-4"><Button variant="outline" onClick={() => setStep('store-info')} className="flex-1 h-12 rounded-xl">BACK</Button><Button onClick={() => setStep('commission')} className="flex-[2] h-12 bg-primary rounded-xl font-black uppercase italic">SUBMIT</Button></div>
          </div>
        );
      case 'commission':
        return (
          <div className="space-y-6 text-center">
            <ShieldCheck className="h-16 w-16 text-primary mx-auto" />
            <div className="bg-black text-white p-6 rounded-[2rem] space-y-4 shadow-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">₹5 COMMISSION</span>
              <p className="text-xs font-bold leading-relaxed text-gray-300 uppercase">Restaurant will pay ₹5 commission to Shopykart from each order. Access all features of vendor panel and user interaction.</p>
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic">{loading ? "SUBMITTING..." : "I AGREE & SUBMIT"}</Button>
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-6 py-10">
            <div className="bg-green-500 h-20 w-20 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce"><CheckCircle2 className="h-12 w-12 text-white" /></div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">SUCCESS!</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase">Form Submitted. Login within 12 hours after approval.</p>
            <Button onClick={() => router.push('/vendor/login')} className="w-full h-12 rounded-xl bg-black font-black uppercase italic">BACK TO LOGIN</Button>
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
