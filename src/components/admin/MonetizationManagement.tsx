"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Loader2, Link as LinkIcon, Megaphone, ExternalLink, Sparkles, Globe, Smartphone, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export function MonetizationManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const adInputRef = useRef<HTMLInputElement>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: settings, loading } = useDoc<any>(settingsRef);

  const [formData, setFormData] = useState({
    // Sponsored Ads
    adImageUrl: '',
    adLinkUrl: '',
    adTitle: '',
    adDescription: '',
    isAdEnabled: true,
    
    // AdSense Settings
    isAdSenseEnabled: false,
    adSensePublisherId: '',
    adSenseSlotId: '',
    
    // AdMob Settings
    isAdMobEnabled: false,
    adMobAppId: '',
    adMobBannerUnitId: '',
    adMobInterstitialUnitId: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        adImageUrl: settings.adImageUrl || '',
        adLinkUrl: settings.adLinkUrl || '',
        adTitle: settings.adTitle || 'Upgrade Your Lifestyle',
        adDescription: settings.adDescription || 'Experience premium quality products delivered instantly.',
        isAdEnabled: settings.isAdEnabled !== false,
        
        isAdSenseEnabled: settings.isAdSenseEnabled || false,
        adSensePublisherId: settings.adSensePublisherId || '',
        adSenseSlotId: settings.adSenseSlotId || '',
        
        isAdMobEnabled: settings.isAdMobEnabled || false,
        adMobAppId: settings.adMobAppId || '',
        adMobBannerUnitId: settings.adMobBannerUnitId || '',
        adMobInterstitialUnitId: settings.adMobInterstitialUnitId || '',
      });
    }
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      // Optimized for mobile screen ads (approx 9:16)
      const compressed = await compressImage(base64, 600, 1066);
      setFormData(prev => ({ ...prev, adImageUrl: compressed }));
      toast({ title: "Ad Image Loaded", description: "Save changes to make it live." });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(firestore, 'app_settings', 'branding'), {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Monetization Updated!", description: "All ad settings are now live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
      {/* 1. Sponsored Banners (Current Revenue) */}
      <div className="space-y-6 bg-white p-8 rounded-[3rem] border border-border/50 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/10">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Direct Sponsorship</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manual Banner Ads (Instant Cash)</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/20 px-4 py-2 rounded-2xl border border-border/50">
            <span className="text-[9px] font-black uppercase text-gray-500">Status</span>
            <Switch 
              checked={formData.isAdEnabled}
              onCheckedChange={(checked) => setFormData({...formData, isAdEnabled: checked})}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Ad Creative (Vertical Optimized)</label>
            <div 
              onClick={() => adInputRef.current?.click()}
              className="relative aspect-[9/16] w-full max-w-[240px] mx-auto border-2 border-dashed border-border rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20 hover:border-primary/40 hover:bg-primary/5 transition-all group"
            >
              {formData.adImageUrl ? (
                <>
                  <img src={formData.adImageUrl} className="h-full w-full object-cover" alt="Ad Preview" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-white p-3 rounded-full text-black"><ImageIcon className="h-5 w-5" /></div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center p-6">
                  <ImageIcon className="h-8 w-8 opacity-10 mb-2" />
                  <span className="text-[9px] font-black uppercase text-gray-400">Upload Banner</span>
                </div>
              )}
            </div>
            <input type="file" ref={adInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          <div className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sponsor Headline</label>
              <Input 
                value={formData.adTitle}
                onChange={(e) => setFormData({...formData, adTitle: e.target.value})}
                placeholder="e.g. 50% Off at New Gym!" 
                className="h-12 rounded-xl bg-muted/10 border-none font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ad Description</label>
              <Textarea 
                value={formData.adDescription}
                onChange={(e) => setFormData({...formData, adDescription: e.target.value})}
                placeholder="Details about the offer..." 
                className="rounded-xl bg-muted/10 border-none font-medium min-h-[100px] text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Destination URL</label>
              <Input 
                value={formData.adLinkUrl}
                onChange={(e) => setFormData({...formData, adLinkUrl: e.target.value})}
                placeholder="https://..." 
                className="h-12 rounded-xl bg-primary/5 border-none font-bold text-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. Google AdSense (Web) */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-100">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-black italic uppercase tracking-tight">AdSense (Web)</h3>
            </div>
            <Switch 
              checked={formData.isAdSenseEnabled}
              onCheckedChange={(val) => setFormData({...formData, isAdSenseEnabled: val})}
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Publisher ID (ca-pub-xxx)</label>
              <Input 
                value={formData.adSensePublisherId}
                onChange={(e) => setFormData({...formData, adSensePublisherId: e.target.value})}
                placeholder="pub-xxxxxxxxxxxxxxxx"
                className="h-11 rounded-xl bg-muted/5 border-border font-bold text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Ad Slot ID</label>
              <Input 
                value={formData.adSenseSlotId}
                onChange={(e) => setFormData({...formData, adSenseSlotId: e.target.value})}
                placeholder="xxxxxxxxxx"
                className="h-11 rounded-xl bg-muted/5 border-border font-bold text-sm"
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
              <Code className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                AdSense will only show ads once your domain is approved by Google.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Google AdMob (Mobile App) */}
        <div className="space-y-6 bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2.5 rounded-xl border border-primary/20">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-black italic uppercase tracking-tight">AdMob (Mobile)</h3>
            </div>
            <Switch 
              checked={formData.isAdMobEnabled}
              onCheckedChange={(val) => setFormData({...formData, isAdMobEnabled: val})}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-1">AdMob App ID</label>
              <Input 
                value={formData.adMobAppId}
                onChange={(e) => setFormData({...formData, adMobAppId: e.target.value})}
                placeholder="ca-app-pub-xxx~yyy"
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white font-bold text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Banner Unit ID</label>
              <Input 
                value={formData.adMobBannerUnitId}
                onChange={(e) => setFormData({...formData, adMobBannerUnitId: e.target.value})}
                placeholder="ca-app-pub-xxx/zzz"
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white font-bold text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Interstitial Unit ID</label>
              <Input 
                value={formData.adMobInterstitialUnitId}
                onChange={(e) => setFormData({...formData, adMobInterstitialUnitId: e.target.value})}
                placeholder="ca-app-pub-xxx/aaa"
                className="h-11 rounded-xl bg-white/5 border-white/10 text-white font-bold text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-10">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full md:w-auto px-16 h-16 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-lg shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all"
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
          PUBLISH ALL MONETIZATION
        </Button>
      </div>
    </div>
  );
}
