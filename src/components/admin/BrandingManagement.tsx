
"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Globe, Loader2, Link as LinkIcon, BellRing, Coins, IndianRupee, Send, ShieldCheck, Zap, ThermometerSun, AlertTriangle, Clock, CalendarClock, Truck, UserX, ReceiptText, FileText, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export function BrandingManagement() {
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
    telegramBotToken: '',
    telegramChatId: '',
    enableTelegram: false,
    isHeatWaveEnabled: false,
    heatWaveAutoMode: false,
    heatWaveStartTime: '6:00 PM',
    heatWaveEndTime: '7:00 PM',
    emergencyType: 'busy',
    // Receipt Customization
    receiptHeader: 'SHOPYKART PREMIUM DELIVERY\nMain Road, Mauranipur\nGSTIN: 09ABCDE1234F1Z5',
    receiptFooter: 'Thank you for choosing ShopyKart!\nThis is a computer generated invoice.',
    receiptThankYou: 'Enjoy your delicious meal!',
    showGstOnReceipt: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle || '',
        siteDescription: settings.siteDescription || '',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
        notificationLogoUrl: settings.notificationLogoUrl || '',
        coinValue: settings.coinValue ? settings.coinValue.toString() : '0.5',
        telegramBotToken: settings.telegramBotToken || '',
        telegramChatId: settings.telegramChatId || '',
        enableTelegram: settings.enableTelegram || false,
        isHeatWaveEnabled: settings.isHeatWaveEnabled || false,
        heatWaveAutoMode: settings.heatWaveAutoMode || false,
        heatWaveStartTime: settings.heatWaveStartTime || '6:00 PM',
        heatWaveEndTime: settings.heatWaveEndTime || '7:00 PM',
        emergencyType: settings.emergencyType || 'heat',
        receiptHeader: settings.receiptHeader || 'SHOPYKART PREMIUM DELIVERY\nMain Road, Mauranipur\nGSTIN: 09ABCDE1234F1Z5',
        receiptFooter: settings.receiptFooter || 'Thank you for choosing ShopyKart!\nThis is a computer generated invoice.',
        receiptThankYou: settings.receiptThankYou || 'Enjoy your delicious meal!',
        showGstOnReceipt: settings.showGstOnReceipt !== false,
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
  };

  const handleTestTelegram = async () => {
    if (!formData.telegramBotToken || !formData.telegramChatId) {
      toast({ variant: "destructive", title: "Missing Credentials", description: "Please enter Bot Token and Chat ID first." });
      return;
    }

    setIsTesting(true);
    const testMsg = `🔔 SHOPYKART TEST ALERT\n\nYour Telegram system is now ACTIVE and connected correctly! ✅`;
    const url = `https://api.telegram.org/bot${formData.telegramBotToken.trim()}/sendMessage?chat_id=${formData.telegramChatId.trim()}&text=${encodeURIComponent(testMsg)}`;

    try {
      await fetch(url, { mode: 'no-cors' });
      toast({ title: "Test Sent!", description: "Check your Telegram bot." });
    } catch (err) {
      toast({ variant: "destructive", title: "Test Failed" });
    } finally {
      setIsTesting(false);
    }
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
      toast({ title: "Settings Saved!", description: "All changes including receipt designs are now live." });
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
        <TabsList className="bg-white border p-1 rounded-2xl mb-8 w-full md:w-auto h-auto grid grid-cols-2 md:flex">
           <TabsTrigger value="brand" className="rounded-xl px-8 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Identity & Apps</TabsTrigger>
           <TabsTrigger value="receipt" className="rounded-xl px-8 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Receipt Designer</TabsTrigger>
           <TabsTrigger value="emergency" className="rounded-xl px-8 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Emergency</TabsTrigger>
           <TabsTrigger value="automation" className="rounded-xl px-8 py-3 data-[state=active]:bg-black data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest transition-all">Automation</TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="space-y-8 mt-0">
          <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-primary/10 p-2 rounded-xl text-primary"><ImageIcon className="h-5 w-5" /></div>
              <h3 className="text-lg font-black italic uppercase">Visual Identity</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Main App Logo</label>
                <div onClick={() => logoInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer bg-muted/20 overflow-hidden">
                  {formData.logoUrl ? <img src={formData.logoUrl} className="h-full w-full object-contain p-4" /> : <ImageIcon className="h-8 w-8 opacity-20" />}
                </div>
                <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Global Notification Logo</label>
                <div onClick={() => notifyInputRef.current?.click()} className="h-32 border-2 border-dashed border-primary/20 rounded-3xl flex items-center justify-center cursor-pointer bg-primary/5 overflow-hidden">
                  {formData.notificationLogoUrl ? <img src={formData.notificationLogoUrl} className="h-full w-full object-contain p-4" /> : <BellRing className="h-8 w-8 text-primary opacity-20" />}
                </div>
                <input type="file" ref={notifyInputRef} className="hidden" accept="image/png" onChange={(e) => handleImageUpload(e, 'notificationLogoUrl')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Favicon (Tab Icon)</label>
                <div onClick={() => faviconInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer bg-muted/20">
                  {formData.faviconUrl ? <img src={formData.faviconUrl} className="h-10 w-10 object-contain" /> : <LinkIcon className="h-6 w-6 opacity-20" />}
                </div>
                <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/x-icon" onChange={(e) => handleImageUpload(e, 'faviconUrl')} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Site Title (SEO)</label>
                  <Input value={formData.siteTitle} onChange={e => setFormData({...formData, siteTitle: e.target.value})} className="h-12 rounded-xl font-bold" />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Economy: 1 Coin = ? INR</label>
                  <Input type="number" step="0.1" value={formData.coinValue} onChange={e => setFormData({...formData, coinValue: e.target.value})} className="h-12 rounded-xl font-black italic text-primary" />
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="receipt" className="space-y-8 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm space-y-6">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><ReceiptText className="h-5 w-5" /></div>
                  <h3 className="text-lg font-black italic uppercase">Receipt Configuration</h3>
               </div>

               <div className="space-y-5">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Store Address / Header</label>
                     <Textarea 
                       value={formData.receiptHeader} 
                       onChange={e => setFormData({...formData, receiptHeader: e.target.value})}
                       className="min-h-[120px] rounded-2xl font-bold text-xs" 
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Catchy Thank You Note</label>
                     <Input 
                       value={formData.receiptThankYou} 
                       onChange={e => setFormData({...formData, receiptThankYou: e.target.value})}
                       className="h-12 rounded-xl font-bold text-primary italic" 
                     />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Footer Legal/Terms</label>
                     <Textarea 
                       value={formData.receiptFooter} 
                       onChange={e => setFormData({...formData, receiptFooter: e.target.value})}
                       className="min-h-[80px] rounded-2xl text-[10px] font-bold" 
                     />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                     <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                        <span className="text-[10px] font-black uppercase">Auto-Calculate Taxes</span>
                     </div>
                     <Switch checked={formData.showGstOnReceipt} onCheckedChange={v => setFormData({...formData, showGstOnReceipt: v})} />
                  </div>
               </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-dashed border-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute top-4 left-4"><Badge className="bg-blue-600 text-white font-black text-[8px] uppercase">Live Preview</Badge></div>
               <div className="w-full max-w-[300px] bg-white shadow-2xl p-6 border-t-[6px] border-black space-y-4 font-mono text-[10px]">
                  <div className="text-center space-y-1">
                     <h4 className="font-black text-xs uppercase">SHOPYKART</h4>
                     <p className="whitespace-pre-line leading-tight opacity-60 uppercase">{formData.receiptHeader}</p>
                  </div>
                  <div className="border-y border-dashed py-2 space-y-1">
                     <div className="flex justify-between font-black uppercase"><span>Item x1</span><span>₹199.00</span></div>
                     <div className="flex justify-between font-black uppercase"><span>Item x2</span><span>₹450.00</span></div>
                  </div>
                  <div className="space-y-1">
                     <div className="flex justify-between font-black"><span>TOTAL</span><span>₹649.00</span></div>
                     <p className="text-center italic font-bold pt-2 text-primary">{formData.receiptThankYou}</p>
                  </div>
                  <div className="text-center opacity-40 text-[7px] pt-4 uppercase">
                     {formData.receiptFooter}
                  </div>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="mt-0">
          <div className="space-y-6 bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-xl text-orange-500 border border-orange-500/20"><AlertTriangle className="h-5 w-5" /></div>
                <h3 className="text-lg font-black italic uppercase">Emergency Restriction</h3>
              </div>
              <Switch checked={formData.isHeatWaveEnabled} onCheckedChange={(checked) => setFormData({...formData, isHeatWaveEnabled: checked})} className="data-[state=checked]:bg-orange-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  <Select value={formData.emergencyType} onValueChange={(val) => setFormData({...formData, emergencyType: val})}>
                    <SelectTrigger className="h-11 rounded-xl bg-white/5 border-white/10 text-white font-bold">
                      <SelectValue placeholder="Select Reason" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                      <SelectItem value="heat">Extreme Heat Wave (48°C)</SelectItem>
                      <SelectItem value="busy">High Delivery Demand</SelectItem>
                      <SelectItem value="no_delivery">Delivery Partners Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-black uppercase text-blue-400">Auto Scheduler</span>
                    <Switch checked={formData.heatWaveAutoMode} onCheckedChange={(checked) => setFormData({...formData, heatWaveAutoMode: checked})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input value={formData.heatWaveStartTime} onChange={e => setFormData({...formData, heatWaveStartTime: e.target.value})} placeholder="6:00 PM" className="h-10 rounded-xl bg-white/5 border-none text-white text-xs" />
                    <Input value={formData.heatWaveEndTime} onChange={e => setFormData({...formData, heatWaveEndTime: e.target.value})} placeholder="7:00 PM" className="h-10 rounded-xl bg-white/5 border-none text-white text-xs" />
                  </div>
               </div>
               <div className="flex items-center justify-center p-6 bg-orange-500/5 rounded-3xl border border-orange-500/10 text-center">
                  <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase italic">
                    Emergency mode on hote hi customer ordering block ho jayegi aur custom reason screen par dikhega.
                  </p>
               </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="automation" className="mt-0">
          <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-xl text-blue-600"><Send className="h-5 w-5" /></div>
                <h3 className="text-lg font-black italic uppercase">Telegram Integration</h3>
              </div>
              <Switch checked={formData.enableTelegram} onCheckedChange={(checked) => setFormData({...formData, enableTelegram: checked})} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <Input value={formData.telegramBotToken} onChange={e => setFormData({...formData, telegramBotToken: e.target.value})} placeholder="Bot Token" className="h-12 rounded-xl bg-muted/5 border-none font-bold" />
                  <Input value={formData.telegramChatId} onChange={e => setFormData({...formData, telegramChatId: e.target.value})} placeholder="Chat ID" className="h-12 rounded-xl bg-muted/5 border-none font-bold" />
                  <Button onClick={handleTestTelegram} disabled={isTesting} variant="outline" className="w-full h-12 rounded-xl border-blue-100 text-blue-600 font-black uppercase text-[10px]">
                    {isTesting ? "SENDING..." : "TEST CONNECTION"}
                  </Button>
               </div>
               <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed italic">
                    Is bot ke zariye aapko har order aur status update ka real-time notification aapke phone par Telegram ke zariye milega.
                  </p>
               </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center pt-10">
        <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto px-16 h-18 rounded-[2rem] bg-[#0B0B0B] text-white font-black uppercase italic text-lg shadow-2xl transition-all hover:bg-primary">
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
          PUBLISH ALL SETTINGS
        </Button>
      </div>
    </div>
  );
}
