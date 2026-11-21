'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Camera, User, Phone, MapPin, KeyRound, Loader2, ChevronLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { slugify } from '@/lib/utils';

/**
 * @fileOverview Hotel Partner Registration Flow.
 */
export default function HotelRegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'success'>('form');
  
  const [formData, setFormData] = useState({
    hotelName: '',
    loginId: '',
    ownerName: '',
    phone: '',
    price: '',
    zoneId: '',
    address: '',
    password: '',
  });

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 800, 600);
      setPhoto(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || loading) return;

    if (!photo) {
      toast({ variant: "destructive", title: "Photo Required" });
      return;
    }

    setLoading(true);
    const cleanId = formData.loginId.trim().toLowerCase();

    try {
      const q = query(collection(firestore, 'hotels'), where('loginId', '==', cleanId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast({ variant: "destructive", title: "ID Taken", description: "Choose another login ID." });
        setLoading(false);
        return;
      }

      const hotelRef = doc(collection(firestore, 'hotels'));
      await setDoc(hotelRef, {
        id: hotelRef.id,
        name: formData.hotelName.trim().toUpperCase(),
        loginId: cleanId,
        ownerName: formData.ownerName.trim().toUpperCase(),
        phone: formData.phone,
        address: formData.address.trim().toUpperCase(),
        pricePerNight: parseFloat(formData.price),
        zoneId: formData.zoneId,
        password: formData.password,
        imageUrl: photo,
        rating: 4.5,
        status: 'approved',
        amenities: ['Free WiFi', 'AC', 'Parking', 'TV'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setStep('success');
    } catch (err) {
      toast({ variant: "destructive", title: "Registration Failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 py-12">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white">
        <CardContent className="p-8">
          {step === 'form' ? (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="text-center space-y-1">
                 <div className="mx-auto bg-amber-50 h-16 w-16 rounded-2xl flex items-center justify-center text-amber-600 mb-2 border border-amber-100">
                    <Building2 className="h-8 w-8" />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">Join Hotelवाले</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Premium Partner Enrollment</p>
              </div>

              <div className="flex flex-col items-center gap-3">
                 <div onClick={() => fileInputRef.current?.click()} className="h-28 w-44 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-primary transition-all">
                    {photo ? <img src={photo} className="h-full w-full object-cover" alt="Selected hotel photo" /> : <div className="flex flex-col items-center gap-1"><Camera className="h-6 w-6 text-gray-300" /><span className="text-[8px] font-black uppercase text-gray-400">Upload Hotel Photo</span></div>}
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Hotel Name</label>
                    <Input placeholder="E.G. HOTEL BELLEVUE" value={formData.hotelName} onChange={e => setFormData({...formData, hotelName: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-bold uppercase" required />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Custom Login ID</label>
                       <Input placeholder="MYHOTEL99" value={formData.loginId} onChange={e => setFormData({...formData, loginId: e.target.value.toLowerCase()})} className="h-12 rounded-xl bg-muted/20 border-none font-black uppercase" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Security Pin</label>
                       <Input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-black" required />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Owner Name</label>
                       <Input placeholder="NAME" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-bold" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Phone</label>
                       <Input type="tel" placeholder="10 DIGITS" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g,'')})} className="h-12 rounded-xl bg-muted/20 border-none font-bold" required />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Base Price ₹</label>
                       <Input type="number" placeholder="999" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-black text-amber-600" required />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Serving Zone</label>
                       <Select value={formData.zoneId} onValueChange={(v) => setFormData({...formData, zoneId: v})}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Select Area" /></SelectTrigger>
                          <SelectContent className="rounded-2xl">
                             {zones?.map((z: any) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                          </SelectContent>
                       </Select>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Complete Address</label>
                    <Input placeholder="STREET, AREA, CITY" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-bold uppercase" required />
                 </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full h-18 rounded-[2rem] bg-black hover:bg-amber-600 text-white font-black uppercase italic text-lg shadow-xl transition-all">
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "JOIN NETWORK"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-10 space-y-6 animate-in zoom-in duration-500">
               <div className="h-24 w-24 bg-green-500 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-green-100">
                  <CheckCircle2 className="h-12 w-12" />
               </div>
               <h2 className="text-3xl font-black italic uppercase text-green-600 leading-none">CONGRATS!</h2>
               <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed px-4">
                  Aapka hotel network mein add ho gaya hai. Ab aap login karke bookings manage kar sakte hain.
               </p>
               <Button onClick={() => router.push('/hotel/login')} className="w-full h-16 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-xl">ENTER DASHBOARD</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}