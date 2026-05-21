
"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Globe, Type, FileText, Loader2, Camera, Link as LinkIcon, Eye, BellRing, Trash2, Coins, IndianRupee, Send, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { cn } from '@/lib/utils';
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
      // Using no-cors as it's a simple GET notification
      await fetch(url, { mode: 'no-cors' });
      toast({ title: "Test Sent!", description: "Check your Telegram bot. If you don't see it, check your ID/Token." });
    } catch (err) {
      toast({ variant: "destructive", title: "Test Failed", description: "Check your internet and credentials." });
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
      toast({ title: "Settings Saved!", description: "Global configuration updated successfully." });
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
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Bot Token</label>
              <Input 
                value={formData.telegramBotToken}
                onChange={(e) => setFormData({...formData, telegramBotToken: e.target.value})}
                placeholder="123456:ABC-DEF..." 
                className="h-12 rounded-xl bg-muted/5 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Chat ID</label>
              <Input 
                value={formData.telegramChatId}
                onChange={(e) => setFormData({...formData, telegramChatId: e.target.value})}
                placeholder="-100123456789" 
                className="h-12 rounded-xl bg-muted/5 font-bold"
              />
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handleTestTelegram}
                disabled={isTesting}
                variant="outline"
                className="w-full h-12 rounded-xl border-blue-100 text-blue-600 font-black uppercase italic text-[10px] tracking-widest hover:bg-blue-50"
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                TEST CONNECTION NOW
              </Button>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                <p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                  Important: Ensure your bot is added to the group/chat before testing.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Economy Settings */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
           <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-600"><Coins className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Reward Economy</h3>
          </div>
          
          <div className="space-y-4">
             <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-amber-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-800">Value of 1 Coin</span>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex-1">
                      <Input 
                        type="number" 
                        step="0.01"
                        value={formData.coinValue}
                        onChange={(e) => setFormData({...formData, coinValue: e.target.value})}
                        className="h-14 rounded-2xl border-amber-200 bg-white font-black italic text-xl text-amber-700 text-center"
                      />
                   </div>
                   <div className="text-sm font-black text-amber-900 uppercase italic">Rupees</div>
                </div>
             </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl text-primary"><Globe className="h-5 w-5" /></div>
              <h3 className="text-lg font-black italic uppercase">SEO Configuration</h3>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Google Search Title</label>
              <Input 
                value={formData.siteTitle}
                onChange={(e) => setFormData({...formData, siteTitle: e.target.value})}
                placeholder="e.g. ShopyKart | Fastest Delivery in Ranipur" 
                className="h-14 rounded-2xl border-muted bg-muted/5 font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Meta Description</label>
              <Textarea 
                value={formData.siteDescription}
                onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                className="rounded-2xl border-muted bg-muted/5 font-medium min-h-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Visual Identity */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><ImageIcon className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Visual Identity</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">App Logo</label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Favicon</label>
                <div onClick={() => faviconInputRef.current?.click()} className="h-24 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer bg-muted/20">
                  {formData.faviconUrl ? <img src={formData.faviconUrl} className="h-10 w-10 object-contain" alt="" /> : <LinkIcon className="h-5 w-5 opacity-20" />}
                </div>
                <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/x-icon" onChange={(e) => handleImageUpload(e, 'faviconUrl')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Notify Icon</label>
                <div onClick={() => notifyInputRef.current?.click()} className="h-24 border-2 border-dashed rounded-2xl border-primary/20 flex items-center justify-center cursor-pointer bg-primary/5">
                  {formData.notificationLogoUrl ? <img src={formData.notificationLogoUrl} className="h-10 w-10 object-contain" alt="" /> : <BellRing className="h-5 w-5 text-primary opacity-40" />}
                </div>
                <input type="file" ref={notifyInputRef} className="hidden" accept="image/png" onChange={(e) => handleImageUpload(e, 'notificationLogoUrl')} />
              </div>
            </div>
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
