
"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Globe, Type, FileText, Loader2, Camera, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

export function BrandingManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

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
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle || '',
        siteDescription: settings.siteDescription || '',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || '',
      });
    }
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      // Favicon should be small, Logo can be medium
      const compressed = await compressImage(base64, field === 'logoUrl' ? 600 : 64, field === 'logoUrl' ? 300 : 64);
      setFormData(prev => ({ ...prev, [field]: compressed }));
      toast({ title: "Image Selected", description: "Click Save to apply changes." });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'app_settings', 'branding'), {
        ...formData,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Branding Updated!", description: "SEO and Logo changes are now live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Check permissions." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SEO Settings */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><Globe className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">SEO Meta Data</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Website Title</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  value={formData.siteTitle}
                  onChange={(e) => setFormData({...formData, siteTitle: e.target.value})}
                  placeholder="e.g. ShopyKart | Premium Delivery" 
                  className="pl-12 h-12 rounded-xl border-muted bg-muted/5 font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">SEO Description</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                <Textarea 
                  value={formData.siteDescription}
                  onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                  placeholder="Describe your service for Google search..." 
                  className="pl-12 py-3 rounded-xl border-muted bg-muted/5 font-medium min-h-[120px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Branding */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><ImageIcon className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Visual Assets</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">App Logo</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="h-32 w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20 group hover:border-primary/40 transition-all"
              >
                {formData.logoUrl ? (
                  <div className="relative w-full h-full p-4">
                    <img src={formData.logoUrl} className="h-full w-full object-contain" alt="Logo Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="text-white h-6 w-6" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-6 w-6 mb-1" />
                    <span className="text-[8px] font-black uppercase">Upload Logo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Browser Favicon (ICO/PNG)</label>
              <div className="flex items-center gap-4">
                <div 
                  onClick={() => faviconInputRef.current?.click()}
                  className="h-16 w-16 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer overflow-hidden bg-muted/20 group hover:border-primary/40 transition-all"
                >
                  {formData.faviconUrl ? (
                    <img src={formData.faviconUrl} className="h-8 w-8 object-contain" alt="Favicon" />
                  ) : (
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">Small square icon for browser tabs.</p>
                  <Button variant="ghost" onClick={() => faviconInputRef.current?.click()} className="text-[10px] font-black text-primary p-0 h-auto uppercase mt-1">Change Icon</Button>
                </div>
              </div>
              <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/x-icon, image/jpeg" onChange={(e) => handleImageUpload(e, 'faviconUrl')} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full md:w-auto px-12 h-16 rounded-2xl bg-[#0B0B0B] text-white font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all"
        >
          {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Save className="h-6 w-6 mr-2" />}
          PUBLISH ALL CHANGES
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl">
        <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
          <span className="font-black">Note:</span> SEO changes might take a few minutes to reflect across all pages. Favicon updates usually require a page refresh or cache clear to show in browser tabs.
        </p>
      </div>
    </div>
  );
}
