
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
  MapPin,
  Fingerprint
} from 'lucide-react';
import { useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
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

  // Fetch zones for assignment
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);
  
  const [formData, setFormData] = useState({
    category: '', 
    storeName: '',
    storeId: '', // NEW: Store ID system
    logo: '',
    cover: '',
    zoneId: '', 
    plusCode: '', 
    addressLine: '', 
    state: 'Uttar Pradesh', 
    rating: '4.5', 
    fssai: '', 
    firstName: '',
    lastName: '',
    phone: '',
    email: '', // Backend will use virtual email if storeId is primary
    password: '',
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
      const hasNumber = /\d/.test(formData.storeId);
      return !!formData.storeName && !!formData.storeId && hasNumber && !!formData.logo && !!formData.cover && !!formData.zoneId && !!formData.addressLine;
    }
    if (step === 'owner-info') {
      return !!formData.firstName && !!formData.lastName && !!formData.phone && !!formData.password && formData.phone.length === 10;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!firestore || !auth || isProcessing) return;
    setIsProcessing(true);

    const cleanStoreId = formData.storeId.trim().toLowerCase();

    try {
      // 1. Check if Store ID exists
      const q = query(collection(firestore, 'vendors'), where('storeId', '==', cleanStoreId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        toast({ 
          variant: "destructive", 
          title: "Already Store Created", 
          description: "This Store ID is taken. Please use a different number." 
        });
        setIsProcessing(false);
        setStep('store-info');
        return;
      }

      // 2. Generate Virtual Email for Firebase Auth
      const virtualEmail = `${cleanStoreId}@vendors.shopykart.com`;

      // 3. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, virtualEmail, formData.password);
      const user = userCredential.user;

      const selectedZone = zones?.find(z => z.id === formData.zoneId);

      const storeData = {
        id: user.uid,
        storeId: cleanStoreId,
        storeName: formData.storeName,
        category: formData.category,
        imageUrl: formData.logo,
        bannerUrl: formData.cover,
        zoneId: formData.zoneId,
        town: selectedZone?.name || 'Local',
        plusCode: formData.plusCode,
        address: formData.addressLine,
        state: formData.state,
        fssai: formData.fssai,
        rating: parseFloat(formData.rating) || 4.5,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: virtualEmail,
        status: 'approved',
        isOnline: true,
        walletBalance: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(firestore, 'vendors', user.uid), storeData);
      setStep('success');
      toast({ title: "Store Created!", description: `ID: ${cleanStoreId} is now live.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
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
              
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Official Name</label>
                <Input placeholder="e.g. Sharma Sweets" value={formData.storeName} onChange={(e) => updateFormData('storeName', e.target.value)} className="h-12 rounded-xl font-bold" />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-primary ml-1 flex items-center gap-1"><Fingerprint className="h-2.5 w-2.5" /> Unique Store ID (Name + Number)</label>
                <Input 
                  placeholder="e.g. SharmaSweets709" 
                  value={formData.storeId} 
                  onChange={(e) => updateFormData('storeId', e.target.value.replace(/\s/g, ''))} 
                  className="h-12 rounded-xl bg-primary/5 border-primary/20 font-black italic uppercase tracking-widest text-primary" 
                />
                <p className="text-[8px] font-bold text-gray-400 uppercase px-1">ID must contain at least one number (0-9).</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => logoInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                  {formData.logo ? <img src={formData.logo} className="h-full w-full object-cover" alt="Logo" /> : <><Camera className="h-5 text-muted-foreground" /><span className="text-[8px] font-black uppercase mt-1">Logo *</span></>}
                </div>
                <div onClick={() => coverInputRef.current?.click()} className="h-28 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                  {formData.cover ? <img src={formData.cover} className="h-full w-full object-cover" alt="Cover" /> : <><ImageIcon className="h-5 text-muted-foreground" /><span className="text-[8px] font-black uppercase mt-1">Banner *</span></>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Serving Zone *</label>
                <Select value={formData.zoneId} onValueChange={(val) => updateFormData('zoneId', val)}>
                   <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                      <SelectValue placeholder="Assign Serving Zone" />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl">
                      {zones?.map((zone: any) => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name} ({zone.city})</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Address Line</label>
                 <Textarea 
                  placeholder="Full Address Details..." 
                  value={formData.addressLine} 
                  onChange={(e) => updateFormData('addressLine', e.target.value)} 
                  className="rounded-xl min-h-[80px]"
                />
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
              
              <div className="relative">
                <Input placeholder="Login Password *" type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => updateFormData('password', e.target.value)} className="h-12 rounded-xl pr-10" />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <Button disabled={!validateStep()} onClick={() => setStep('commission')} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic mt-4 shadow-lg shadow-primary/20">REVIEW & SUBMIT</Button>
            </div>
          )}

          {step === 'commission' && (
            <div className="space-y-6 text-center">
              <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              
              <div className="bg-black text-white p-10 rounded-[3rem] space-y-4 shadow-2xl relative overflow-hidden">
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
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "I AGREE & SUBMIT"}
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
              <h2 className="text-2xl font-black italic uppercase text-blue-600">BUSINESS LIVE!</h2>
              <p className="text-xs font-black text-muted-foreground uppercase px-4">Your Store ID is: <span className="text-black">{formData.storeId}</span>. Use this ID to login.</p>
              <Button onClick={() => router.push('/vendor/login')} className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black uppercase italic text-lg shadow-xl shadow-blue-200">LOGIN TO DASHBOARD</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
    </div>
  );
}
