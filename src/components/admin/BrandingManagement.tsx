"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Globe, Loader2, Link as LinkIcon, BellRing, Coins, IndianRupee, Send, ShieldCheck, Zap, Megaphone, ExternalLink } from 'lucide-react';
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
  const adInputRef = useRef<HTMLInputElement>(null);

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
    // Ad Settings
    adImageUrl: '',
    adLinkUrl: '',
    adTitle: '',
    adDescription: '',
    isAdEnabled: true,
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
        adImageUrl: settings.adImageUrl || '',
        adLinkUrl: settings.adLinkUrl || '',
        adTitle: settings.adTitle || 'Upgrade Your Lifestyle',
        adDescription: settings.adDescription || 'Experience premium quality products delivered instantly.',
        isAdEnabled: settings.isAdEnabled !== false,
      });
    }
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const dimensions = field === 'adImageUrl' ? 1080 : field === 'logoUrl' ? 600 : 128;
      const compressed = await compressImage(base64, dimensions, dimensions === 1080 ? 1920 : dimensions);
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
      });
      toast({ title: "Settings Saved!", description: "All branding and ad changes are now live." });
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
        
        {/* Monetization & Ad Control */}
        <div className="lg:col-span-2 space-y-6 bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-primary/20 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-10" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-xl text-primary border border-primary/20"><Megaphone className="h-6 w-6" /></div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Monetization Hub</h3>
                  <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Sell ad space to local businesses</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{formData.isAdEnabled ? 'AD ACTIVE' : 'AD PAUSED'}</span>
                <Switch 
                  checked={formData.isAdEnabled}
                  onCheckedChange={(checked) => setFormData({...formData, isAdEnabled: checked})}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div 
                  onClick={() => adInputRef.current?.click()}
                  className="relative aspect-[9/16] max-w-[200px] mx-auto border-2 border-dashed border-white/20 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 hover:border-primary transition-all"
                >
                  {formData.adImageUrl ? (
                    <img src={formData.adImageUrl} className="h-full w-full object-cover" alt="Ad Preview" />
                  ) : (
                    <div className="flex flex-col items-center text-center p-4">
                      <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                      <span className="text-[10px] font-black uppercase text-gray-500">Upload Sponsored Image (9:16)</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={adInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'adImageUrl')} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sponsor Headline</label>
                  <Input 
                    value={formData.adTitle}
                    onChange={(e) => setFormData({...formData, adTitle: e.target.value})}
                    placeholder="e.g. New Gym Opening!" 
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sponsor Description</label>
                  <Textarea 
                    value={formData.adDescription}
                    onChange={(e) => setFormData({...formData, adDescription: e.target.value})}
                    placeholder="Short marketing text..." 
                    className="bg-white/5 border-white/10 text-white rounded-xl font-medium min-h-[80px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Target Link (WhatsApp or URL)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    <Input 
                      value={formData.adLinkUrl}
                      onChange={(e) => setFormData({...formData, adLinkUrl: e.target.value})}
                      placeholder="https://wa.me/91..." 
                      className="pl-12 h-12 bg-white/5 border-primary/20 text-white rounded-xl font-bold focus-visible:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20">
                  <p className="text-[9px] font-bold text-primary uppercase leading-relaxed">
                    💡 TIP: local businesses ko mahine ka subscription bechein. Yeh screen har naye/purane customer ko dikhayi jayegi!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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

        {/* Telegram Alerts */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-600"><Send className="h-5 w-5" /></div>
              <h3 className="text-lg font-black italic uppercase">Telegram Integration</h3>
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
