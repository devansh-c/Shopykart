"use client"

import { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Image as ImageIcon, 
  Loader2, 
  BellRing, 
  Smartphone, 
  ReceiptText, 
  Trash2, 
  MonitorSmartphone,
  CheckCircle2,
  Info,
  Type,
  ExternalLink,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function BrandingManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const notifyInputRef = useRef<HTMLInputElement>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: settings, loading } = useDoc<any>(settingsRef);

  const [formData, setFormData] = useState({
    siteTitle: '',
    siteDescription: '',
    logoUrl: '',
    faviconUrl: '',
    notificationLogoUrl: '',
    coinValue: '0.5',
    receiptHeader: 'SHOPYKART PREMIUM DELIVERY\nMain Road, Mauranipur\nGSTIN: 09ABCDE1234F1Z5',
    receiptFooter: 'Thank you for choosing ShopyKart!\nThis is a computer generated invoice.',
    receiptThankYou: 'Enjoy your delicious meal!',
    showGstOnReceipt: true,
    vapidKey: ''
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle || '',
        siteDescription: settings.siteDescription || '',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        notificationLogoUrl: settings.notificationLogoUrl || '',
        coinValue: settings.coinValue ? settings.coinValue.toString() : '0.5',
        receiptHeader: settings.receiptHeader || 'SHOPYKART PREMIUM DELIVERY\nMain Road, Mauranipur\nGSTIN: 09ABCDE1234F1Z5',
        receiptFooter: settings.receiptFooter || 'Thank you for choosing ShopyKart!\nThis is a computer generated invoice.',
        receiptThankYou: settings.receiptThankYou || 'Enjoy your delicious meal!',
        showGstOnReceipt: settings.showGstOnReceipt !== false,
        vapidKey: settings.vapidKey || ''
      });
    }
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const dimensions = field === 'logoUrl' ? 600 : 128;
      const compressed = await compressImage(base64, dimensions, dimensions);
      setFormData(prev => ({ ...prev, [field]: compressed }));
      toast({ title: "Image Loaded", description: "Save changes to make it live." });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteImage = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
    toast({ title: "Asset Removed", description: "Save changes to apply permanently." });
  };

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'app_settings', 'branding'), {
        ...formData,
        coinValue: parseFloat(formData.coinValue) || 0.5,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      toast({ title: "Settings Saved!", description: "Branding and receipts are now live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-20">
      <Tabs defaultValue="brand" className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl mb-8 w-full md:w-auto h-auto grid grid-cols-4 md:flex">
           <TabsTrigger value="brand" className="rounded-xl px-6 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[9px] tracking-widest transition-all">Identity</TabsTrigger>
           <TabsTrigger value="apk-icons" className="rounded-xl px-6 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[9px] tracking-widest transition-all">App Icons</TabsTrigger>
           <TabsTrigger value="notify" className="rounded-xl px-6 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[9px] tracking-widest transition-all">Cloud Notifications</TabsTrigger>
           <TabsTrigger value="receipt" className="rounded-xl px-6 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[9px] tracking-widest transition-all">Receipts</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-8 mt-0">
          <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-xl text-primary"><ImageIcon className="h-5 w-5" /></div>
              <h3 className="text-lg font-black italic uppercase">Visual Identity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2 relative group">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Main App Logo</label>
                <div 
                  onClick={() => !formData.logoUrl && logoInputRef.current?.click()} 
                  className={cn(
                    "h-32 border-2 border-dashed rounded-3xl flex items-center justify-center bg-muted/20 overflow-hidden relative",
                    !formData.logoUrl && "cursor-pointer"
                  )}
                >
                  {formData.logoUrl ? (
                    <>
                      <img src={formData.logoUrl} className="h-full w-full object-contain p-4" alt="Logo" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); logoInputRef.current?.click(); }} className="bg-white p-2 rounded-lg text-black hover:bg-gray-100"><ImageIcon className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteImage('logoUrl'); }} className="bg-red-50 p-2 rounded-lg text-white hover:bg-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </>
                  ) : (
                    <ImageIcon className="h-8 w-8 opacity-20" />
                  )}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
              </div>

              <div className="space-y-2 relative group">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Notification Icon</label>
                <div 
                  onClick={() => !formData.notificationLogoUrl && notifyInputRef.current?.click()} 
                  className={cn(
                    "h-32 border-2 border-dashed border-primary/20 rounded-3xl flex items-center justify-center bg-primary/5 overflow-hidden relative",
                    !formData.notificationLogoUrl && "cursor-pointer"
                  )}
                >
                  {formData.notificationLogoUrl ? (
                    <>
                      <img src={formData.notificationLogoUrl} className="h-full w-full object-contain p-4" alt="Notify" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); notifyInputRef.current?.click(); }} className="bg-white p-2 rounded-lg text-black hover:bg-gray-100"><ImageIcon className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteImage('notificationLogoUrl'); }} className="bg-red-50 p-2 rounded-lg text-white hover:bg-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </>
                  ) : (
                    <BellRing className="h-8 w-8 text-primary opacity-20" />
                  )}
                </div>
                <input type="file" ref={notifyInputRef} className="hidden" accept="image/png" onChange={(e) => handleImageUpload(e, 'notificationLogoUrl')} />
              </div>

              <div className="space-y-2 relative group">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Favicon (Tab)</label>
                <div 
                  onClick={() => !formData.faviconUrl && faviconInputRef.current?.click()} 
                  className={cn(
                    "h-32 border-2 border-dashed rounded-3xl flex items-center justify-center bg-muted/20 relative",
                    !formData.faviconUrl && "cursor-pointer"
                  )}
                >
                  {formData.faviconUrl ? (
                    <>
                      <img src={formData.faviconUrl} className="h-10 w-10 object-contain" alt="Favicon" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); faviconInputRef.current?.click(); }} className="bg-white p-2 rounded-lg text-black hover:bg-gray-100"><ImageIcon className="h-4 w-4" /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteImage('faviconUrl'); }} className="bg-red-50 p-2 rounded-lg text-white hover:bg-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </>
                  ) : (
                    <ImageIcon className="h-6 w-6 opacity-20" />
                  )}
                </div>
                <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/x-icon" onChange={(e) => handleImageUpload(e, 'faviconUrl')} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="apk-icons" className="mt-0">
          <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/5 shadow-2xl text-white relative overflow-hidden">
             <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-5">
                   <div className="h-16 w-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl">
                      <MonitorSmartphone className="h-8 w-8" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black italic uppercase tracking-tighter">APK Launcher Icons</h2>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Change logos on phone home screen</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <h3 className="text-lg font-black italic uppercase text-primary">Process for Logos:</h3>
                      <div className="space-y-4">
                        {[
                          { step: "01", text: "Apne PC par ek 1024x1024 size ka PNG logo banayein aur uska naam 'icon.png' rakhein." },
                          { step: "02", text: "Project ke root folder mein 'assets' naam ka folder banayein (agar nahi hai)." },
                          { step: "03", text: "Apna logo us folder mein dal dein (assets/icon.png)." },
                          { step: "04", text: "GitHub par code push karein. Humara build system automatically naye icons generate kar dega." }
                        ].map((item, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <span className="text-primary font-black italic text-xl leading-none">{item.step}</span>
                            <p className="text-[11px] font-bold text-gray-300 uppercase leading-relaxed">{item.text}</p>
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 flex flex-col justify-center text-center space-y-6">
                      <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping" />
                        <div className="relative h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-white/5">
                           <ImageIcon className="h-10 w-10 text-gray-200" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-black italic uppercase">Bypass Manual Work</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                          Ye system automatically 18+ different sizes ke Android icons banayega taaki logo kabhi phate nahi.
                        </p>
                      </div>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
          </div>
        </TabsContent>

        <TabsContent value="notify" className="mt-0">
          <div className="bg-white p-8 rounded-[3rem] border border-border/50 shadow-sm space-y-8">
             <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 shadow-inner">
                   <KeyRound className="h-7 w-7" />
                </div>
                <div>
                   <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Push Configuration</h2>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Connect Firebase Cloud Messaging</p>
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-blue-600 ml-1">FCM VAPID KEY (Web Push)</label>
                   <Input 
                      value={formData.vapidKey} 
                      onChange={e => setFormData({...formData, vapidKey: e.target.value})}
                      placeholder="Paste long key from Firebase Console Settings..." 
                      className="h-14 rounded-2xl bg-gray-50 border-none font-bold"
                   />
                </div>
                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex items-start gap-4">
                   <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                   <div className="space-y-2">
                      <p className="text-[10px] font-bold text-blue-800 uppercase leading-relaxed">
                         Go to Firebase Console &gt; Project Settings &gt; Cloud Messaging &gt; Web Configuration. Generate Key and paste here.
                      </p>
                      <button className="text-[9px] font-black text-blue-600 underline uppercase tracking-widest">Open Console Guide</button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center space-y-3">
                   <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shadow-sm">
                      <ShieldCheck className="h-6 w-6" />
                   </div>
                   <h4 className="text-sm font-black uppercase italic">Safe Storage</h4>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">User tokens are encrypted and stored per device.</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center space-y-3">
                   <div className="h-12 w-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                      <BellRing className="h-6 w-6" />
                   </div>
                   <h4 className="text-sm font-black uppercase italic">Real-time Delivery</h4>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">Order updates will trigger instant background bells.</p>
                </div>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="receipt" className="space-y-8 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><ReceiptText className="h-5 w-5" /></div>
                  <h3 className="text-lg font-black italic uppercase">Receipt Design</h3>
               </div>

               <div className="space-y-5">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Header Address</label>
                     <Textarea value={formData.receiptHeader} onChange={e => setFormData({...formData, receiptHeader: e.target.value})} className="min-h-[120px] rounded-2xl font-bold text-xs" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Thank You Note</label>
                     <Input value={formData.receiptThankYou} onChange={e => setFormData({...formData, receiptThankYou: e.target.value})} className="h-12 rounded-xl font-bold text-primary italic" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                     <span className="text-[10px] font-black uppercase">Show GST Details</span>
                     <Switch checked={formData.showGstOnReceipt} onCheckedChange={v => setFormData({...formData, showGstOnReceipt: v})} />
                  </div>
               </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-dashed border-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
               <Badge className="absolute top-4 left-4 bg-blue-600 text-white font-black text-[8px] uppercase">Preview</Badge>
               <div className="w-full max-w-[280px] bg-white shadow-2xl p-6 border-t-[6px] border-black space-y-4 font-mono text-[10px]">
                  <div className="text-center space-y-1">
                     <h4 className="font-black text-xs uppercase">SHOPYKART</h4>
                     <p className="whitespace-pre-line leading-tight opacity-60 uppercase">{formData.receiptHeader}</p>
                  </div>
                  <div className="border-y border-dashed py-2 flex justify-between font-black uppercase"><span>TOTAL</span><span>₹649.00</span></div>
                  <p className="text-center italic font-bold pt-2 text-primary">{formData.receiptThankYou}</p>
               </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-10">
        <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto px-16 h-18 rounded-[2rem] bg-[#0B0B0B] text-white font-black uppercase italic text-lg shadow-2xl transition-all hover:bg-primary">
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
          SAVE ALL CHANGES
        </Button>
      </div>
    </div>
  );
}
