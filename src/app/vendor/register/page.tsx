
"use client"

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Fingerprint,
  HeartPulse,
  User,
  Lock,
  Sparkles
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
import { compressImage } from '@/lib/image-utils';

type Step = 'form' | 'commission' | 'success';

function RegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const isMedicalFlow = typeParam === 'Medical';
  const isBeautyFlow = typeParam === 'Beauty';
  
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  
  const [step, setStep] = useState<Step>('form');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch zones for assignment (Required for visibility in app)
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);
  
  const [formData, setFormData] = useState({
    storeName: '',
    storeId: '', 
    ownerName: '',
    phone: '',
    zoneId: '', 
    password: '',
    confirmPassword: '',
  });

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const hasNumber = /\d/.test(formData.storeId);
    return (
      !!formData.storeName && 
      !!formData.storeId && 
      hasNumber && 
      !!formData.ownerName && 
      !!formData.phone && 
      formData.phone.length === 10 &&
      !!formData.password && 
      formData.password === formData.confirmPassword &&
      !!formData.zoneId
    );
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
          title: "ID Not Available", 
          description: "This Store ID is taken. Use a different name + number combination." 
        });
        setIsProcessing(false);
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
        category: isMedicalFlow ? 'Medical' : isBeautyFlow ? 'Beauty' : 'Food', 
        town: selectedZone?.name || 'Local',
        zoneId: formData.zoneId,
        firstName: formData.ownerName.split(' ')[0] || '',
        lastName: formData.ownerName.split(' ').slice(1).join(' ') || '',
        fullName: formData.ownerName,
        phone: formData.phone,
        email: virtualEmail,
        password: formData.password, 
        status: 'approved',
        isOnline: true,
        walletBalance: 0,
        imageUrl: isMedicalFlow ? 'https://picsum.photos/seed/medical/400/400' : isBeautyFlow ? 'https://picsum.photos/seed/beauty/400/400' : 'https://picsum.photos/seed/food/400/400',
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
          {step === 'form' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className={cn(
                  "mx-auto h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-2",
                  isMedicalFlow ? "bg-teal-50 text-teal-600" : isBeautyFlow ? "bg-rose-50 text-rose-600" : "bg-primary/5 text-primary"
                )}>
                  {isMedicalFlow ? <HeartPulse className="h-8 w-8" /> : isBeautyFlow ? <Sparkles className="h-8 w-8" /> : <Utensils className="h-8 w-8" />}
                </div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                  {isMedicalFlow ? 'Join as Medical Store' : isBeautyFlow ? 'Join as Beauty Store' : 'Vendor Registration'}
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enter Business Credentials</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Business Name</label>
                  <div className="relative">
                    <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="e.g. City Cosmetics" 
                      value={formData.storeName} 
                      onChange={e => updateFormData('storeName', e.target.value)} 
                      className="h-12 pl-12 rounded-xl font-bold bg-muted/20 border-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={cn(
                    "text-[9px] font-black uppercase ml-1 flex items-center gap-1",
                    isMedicalFlow ? "text-teal-600" : isBeautyFlow ? "text-rose-600" : "text-primary"
                  )}>
                    <Fingerprint className="h-2.5 w-2.5" /> Unique Store ID (Name + Number)
                  </label>
                  <Input 
                    placeholder="e.g. BeautyQueen709" 
                    value={formData.storeId} 
                    onChange={e => updateFormData('storeId', e.target.value.replace(/\s/g, ''))} 
                    className={cn(
                      "h-12 rounded-xl border-2 font-black italic uppercase tracking-widest",
                      isMedicalFlow ? "bg-teal-50 border-teal-100 text-teal-600" : 
                      isBeautyFlow ? "bg-rose-50 border-rose-100 text-rose-600" : 
                      "bg-primary/5 border-primary/10 text-primary"
                    )} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Store Owner Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Owner Full Name" 
                      value={formData.ownerName} 
                      onChange={e => updateFormData('ownerName', e.target.value)} 
                      className="h-12 pl-12 rounded-xl font-bold bg-muted/20 border-none" 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Phone Number</label>
                  <Input 
                    type="tel"
                    placeholder="10 Digit Number" 
                    value={formData.phone} 
                    onChange={e => updateFormData('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} 
                    className="h-12 rounded-xl font-bold bg-muted/20 border-none" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Serving Zone</label>
                  <Select value={formData.zoneId} onValueChange={(val) => updateFormData('zoneId', val)}>
                     <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                        <SelectValue placeholder="Assign Serving Area" />
                     </SelectTrigger>
                     <SelectContent className="rounded-2xl">
                        {zones?.map((zone: any) => (
                          <SelectItem key={zone.id} value={zone.id}>{zone.name} ({zone.city})</SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Password</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={formData.password} 
                      onChange={e => updateFormData('password', e.target.value)} 
                      className="h-12 rounded-xl bg-muted/20 border-none font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Confirm</label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={formData.confirmPassword} 
                      onChange={e => updateFormData('confirmPassword', e.target.value)} 
                      className="h-12 rounded-xl bg-muted/20 border-none font-bold" 
                    />
                  </div>
                </div>
              </div>

              <Button 
                disabled={!validateForm()} 
                onClick={() => setStep('commission')} 
                className="w-full h-16 rounded-2xl bg-black hover:bg-gray-900 text-white font-black uppercase italic shadow-xl transition-all"
              >
                NEXT STEP
              </Button>
            </div>
          )}

          {step === 'commission' && (
            <div className="space-y-8 text-center py-4">
              <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mx-auto">
                <ShieldCheck className="h-10 w-10 text-primary" />
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">Agreement</h2>
                <div className="bg-[#0B0B0B] text-white p-10 rounded-[3rem] space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-center">
                    <span className="bg-[#EF4444] text-white text-[10px] font-black px-5 py-2 rounded-full uppercase italic tracking-tighter">
                      ₹5 COMMISSION
                    </span>
                  </div>
                  <p className="text-base font-black leading-tight text-white uppercase italic tracking-tighter">
                    PER SUCCESSFUL ORDER<br />CHARGED.
                  </p>
                  <div className="absolute top-0 right-0 h-full w-24 bg-white/5 -skew-x-12 translate-x-10" />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed px-6">
                  By submitting, you agree to pay ₹5 on every order processed through the ShopyKart network.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isProcessing}
                  className={cn(
                    "w-full h-16 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all",
                    isMedicalFlow ? "bg-teal-600 hover:bg-teal-700" : isBeautyFlow ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary/90"
                  )}
                >
                  {isProcessing ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : "I AGREE & SUBMIT"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setStep('form')}
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                >
                  Back to form
                </Button>
              </div>
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
              <h2 className="text-3xl font-black italic uppercase text-blue-600 leading-none">BUSINESS LIVE!</h2>
              <div className="bg-muted/30 p-5 rounded-2xl border border-dashed border-muted-foreground/20">
                <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Your Login ID:</p>
                <span className="text-lg font-black text-black italic uppercase tracking-widest">{formData.storeId}</span>
              </div>
              <Button onClick={() => router.push(isMedicalFlow ? '/vendor/login?type=Medical' : isBeautyFlow ? '/vendor/login?type=Beauty' : '/vendor/login')} className="w-full h-16 rounded-[2rem] bg-black text-white font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all">
                LOGIN TO DASHBOARD
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VendorRegistrationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <RegistrationContent />
    </Suspense>
  );
}
