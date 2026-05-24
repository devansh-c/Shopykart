"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Loader2, Link as LinkIcon, Megaphone, ExternalLink, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { Switch } from '@/components/ui/switch';

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
    adImageUrl: '',
    adLinkUrl: '',
    adTitle: '',
    adDescription: '',
    isAdEnabled: true,
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
      });
    }
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      const compressed = await compressImage(base64, 1080, 1920);
      setFormData(prev => ({ ...prev, adImageUrl: compressed }));
      toast({ title: "Ad Image Loaded", description: "Save changes to make it live." });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      // We merge into the same branding doc to maintain compatibility with AdOverlay
      await updateDoc(doc(firestore, 'app_settings', 'branding'), {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Ads Updated!", description: "Monetization settings are now live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl pb-20">
      <div className="space-y-6 bg-[#0B0B0B] p-8 md:p-12 rounded-[3rem] border border-primary/20 shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-48 bg-primary/5 -skew-x-12 translate-x-20" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10">
                <Megaphone className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter">Monetization Hub</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Manage Sponsored Interstitial Ads</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 self-start md:self-center">
              <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                {formData.isAdEnabled ? 'AD STATUS: ACTIVE' : 'AD STATUS: PAUSED'}
              </span>
              <Switch 
                checked={formData.isAdEnabled}
                onCheckedChange={(checked) => setFormData({...formData, isAdEnabled: checked})}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Ad Creative (9:16 vertical)</label>
              <div 
                onClick={() => adInputRef.current?.click()}
                className="relative aspect-[9/16] w-full max-w-[280px] mx-auto border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/5 hover:border-primary/50 hover:bg-white/10 transition-all group"
              >
                {formData.adImageUrl ? (
                  <>
                    <img src={formData.adImageUrl} className="h-full w-full object-cover" alt="Ad Preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-white p-3 rounded-full text-black"><ImageIcon className="h-6 w-6" /></div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-center p-8">
                    <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <ImageIcon className="h-8 w-8 opacity-20" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-500 leading-relaxed">Upload 1080x1920<br/>Sponsored Image</span>
                  </div>
                )}
              </div>
              <input type="file" ref={adInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
              <p className="text-[9px] text-center text-gray-500 font-bold uppercase tracking-widest">Recommended format: .JPG or .PNG</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Sponsor Headline</label>
                <Input 
                  value={formData.adTitle}
                  onChange={(e) => setFormData({...formData, adTitle: e.target.value})}
                  placeholder="e.g. 50% Off at New Gym!" 
                  className="h-14 bg-white/5 border-white/10 text-white rounded-2xl font-black text-lg focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ad Description</label>
                <Textarea 
                  value={formData.adDescription}
                  onChange={(e) => setFormData({...formData, adDescription: e.target.value})}
                  placeholder="Tell your customers about this offer..." 
                  className="bg-white/5 border-white/10 text-white rounded-2xl font-medium min-h-[120px] text-sm focus-visible:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Destination Link (URL/WhatsApp)</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                  <Input 
                    value={formData.adLinkUrl}
                    onChange={(e) => setFormData({...formData, adLinkUrl: e.target.value})}
                    placeholder="https://wa.me/91..." 
                    className="pl-12 h-14 bg-white/5 border-primary/20 text-white rounded-2xl font-bold focus-visible:ring-primary/20"
                  />
                </div>
              </div>

              <div className="bg-primary/10 p-6 rounded-[2rem] border border-primary/20 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black text-primary uppercase">Monetization Tip</span>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">
                  Local shops ko mahine ka subscription bechein. Yeh screen app open hone par har customer ko dikhayi jayegi, jisse unhe massive visibility milegi!
                </p>
              </div>

              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="w-full h-16 rounded-[2rem] bg-primary hover:bg-primary/90 text-white font-black uppercase italic text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all"
              >
                {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
                PUBLISH SPONSORED AD
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
