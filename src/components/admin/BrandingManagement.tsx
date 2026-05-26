
"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Globe, Loader2, Link as LinkIcon, BellRing, Coins, IndianRupee, Send, ShieldCheck, Zap, ThermometerSun, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { Switch } from '@/components/ui/switch';

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
    heatWaveStartTime: '1:00 PM',
    heatWaveEndTime: '3:00 PM',
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
        heatWaveStartTime: settings.heatWaveStartTime || '1:00 PM',
        heatWaveEndTime: settings.heatWaveEndTime || '3:00 PM',
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
      toast({ title: "Settings Saved!", description: "All branding and emergency changes are now live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Visual Identity & Master Logo Control */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><ImageIcon className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Master Brand Control</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Main App Logo</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="h-32 w-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20 relative"
              >
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} className="h-full w-full object-contain p-4" alt="Logo Preview" />
                ) : (
                  <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                )}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Global Notification Logo</label>
              <div 
                onClick={() => notifyInputRef.current?.click()}
                className="h-32 w-full border-2 border-dashed border-primary/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-primary/5 relative"
              >
                {formData.notificationLogoUrl ? (
                  <img src={formData.notificationLogoUrl} className="h-full w-full object-contain p-4" alt="Notify Preview" />
                ) : (
                  <BellRing className="h-8 w-8 text-primary opacity-20" />
                )}
              </div>
              <p className="text-[7px] font-bold text-center text-primary uppercase mt-1">This image will appear in all mobile alerts.</p>
              <input type="file" ref={notifyInputRef} className="hidden" accept="image/png" onChange={(e) => handleImageUpload(e, 'notificationLogoUrl')} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Favicon (Tab Icon)</label>
              <div onClick={() => faviconInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-3xl flex items-center justify-center cursor-pointer bg-muted/20">
                {formData.faviconUrl ? <img src={formData.faviconUrl} className="h-10 w-10 object-contain" alt="" /> : <LinkIcon className="h-6 w-6 opacity-20" />}
              </div>
              <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/x-icon" onChange={(e) => handleImageUpload(e, 'faviconUrl')} />
            </div>
          </div>
        </div>

        {/* Emergency & Safety Protocols Card */}
        <div className="space-y-6 bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/20 p-2 rounded-xl text-orange-500 border border-orange-500/20"><ThermometerSun className="h-5 w-5" /></div>
              <h3 className="text-lg font-black italic uppercase">Emergency Mode</h3>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black uppercase text-gray-500">{formData.isHeatWaveEnabled ? 'ACTIVE' : 'OFF'}</span>
               <Switch 
                checked={formData.isHeatWaveEnabled}
                onCheckedChange={(checked) => setFormData({...formData, isHeatWaveEnabled: checked})}
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-gray-500 ml-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Start Time
                   </label>
                   <Input 
                      value={formData.heatWaveStartTime}
                      onChange={(e) => setFormData({...formData, heatWaveStartTime: e.target.value})}
                      placeholder="e.g. 1:00 PM"
                      className="h-11 rounded-xl bg-white/5 border-white/10 text-white font-bold"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black uppercase text-gray-500 ml-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> End Time
                   </label>
                   <Input 
                      value={formData.heatWaveEndTime}
                      onChange={(e) => setFormData({...formData, heatWaveEndTime: e.target.value})}
                      placeholder="e.g. 3:00 PM"
                      className="h-11 rounded-xl bg-white/5 border-white/10 text-white font-bold"
                   />
                </div>
             </div>

             <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-orange-500 uppercase leading-tight">Status Display</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 leading-relaxed">
                    Jab yeh ON hoga, Customers ko screen par dikhega ki {formData.heatWaveStartTime} se {formData.heatWaveEndTime} tak orders band hain.
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* Telegram Alerts */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-600"><Send className="h-5 w-5" /></div>
              <h3 className="text-lg font-black italic uppercase">Telegram Alerts</h3>
            </div>
            <Switch 
              checked={formData.enableTelegram}
              onCheckedChange={(checked) => setFormData({...formData, enableTelegram: checked})}
            />
          </div>
          
          <div className="space-y-4">
            <Input 
              value={formData.telegramBotToken}
              onChange={(e) => setFormData({...formData, telegramBotToken: e.target.value})}
              placeholder="Bot Token" 
              className="h-12 rounded-xl bg-muted/5 font-bold"
            />
            <Input 
              value={formData.telegramChatId}
              onChange={(e) => setFormData({...formData, telegramChatId: e.target.value})}
              placeholder="Admin Chat ID" 
              className="h-12 rounded-xl bg-muted/5 font-bold"
            />
            <Button onClick={handleTestTelegram} disabled={isTesting} variant="outline" className="w-full h-12 rounded-xl border-blue-100 text-blue-600 font-black uppercase text-[10px]">
              {isTesting ? "SENDING..." : "TEST TELEGRAM CONNECTION"}
            </Button>
          </div>
        </div>

        {/* Economy Settings */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-600"><Coins className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Reward Economy</h3>
          </div>
          <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
             <div className="flex items-center gap-2 mb-4">
                <IndianRupee className="h-4 w-4 text-amber-600" />
                <span className="text-[10px] font-black uppercase text-amber-800">Value of 1 Coin (INR)</span>
             </div>
             <Input 
                type="number" 
                step="0.01"
                value={formData.coinValue}
                onChange={(e) => setFormData({...formData, coinValue: e.target.value})}
                className="h-14 rounded-2xl border-amber-200 bg-white font-black italic text-xl text-amber-700 text-center"
             />
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full md:w-auto px-16 h-16 rounded-3xl bg-[#0B0B0B] text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all hover:bg-primary"
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
          SAVE ALL SETTINGS
        </Button>
      </div>
    </div>
  );
}
