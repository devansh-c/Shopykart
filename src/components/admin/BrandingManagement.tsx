"use client"

import { useState, useEffect, useRef } from 'react';
import { Save, Image as ImageIcon, Globe, Type, FileText, Loader2, Camera, Link as LinkIcon, Eye } from 'lucide-react';
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
      // Favicon should be tiny, Logo can be medium
      const compressed = await compressImage(base64, field === 'logoUrl' ? 600 : 64, field === 'logoUrl' ? 300 : 64);
      setFormData(prev => ({ ...prev, [field]: compressed }));
      toast({ title: "Image Loaded", description: "Save changes to make it live." });
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
      toast({ title: "Branding Live!", description: "Google will index these changes soon." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SEO Settings */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-xl text-primary"><Globe className="h-5 w-5" /></div>
              <h3 className="text-lg font-black italic uppercase">SEO Configuration</h3>
            </div>
            <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
              Indexing Active
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Google Search Title</label>
              <div className="relative">
                <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  value={formData.siteTitle}
                  onChange={(e) => setFormData({...formData, siteTitle: e.target.value})}
                  placeholder="e.g. ShopyKart | Fastest Delivery in Ranipur" 
                  className="pl-12 h-14 rounded-2xl border-muted bg-muted/5 font-bold focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Meta Description (160 characters max)</label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                <Textarea 
                  value={formData.siteDescription}
                  onChange={(e) => setFormData({...formData, siteDescription: e.target.value})}
                  placeholder="Order fresh food and groceries from local stores..." 
                  className="pl-12 py-4 rounded-2xl border-muted bg-muted/5 font-medium min-h-[140px] focus-visible:ring-primary/20"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
              <Eye className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase">Search Preview</p>
                <p className="text-sm font-bold text-blue-800 line-clamp-1 mt-1">{formData.siteTitle || 'Website Title'}</p>
                <p className="text-xs text-blue-700/70 line-clamp-2 mt-1 italic">{formData.siteDescription || 'Your description will appear here on Google search results.'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Visual Identity */}
        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><ImageIcon className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Visual Identity</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">App Logo (Best: Transparent PNG)</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="h-40 w-full border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20 group hover:border-primary/40 transition-all relative"
              >
                {formData.logoUrl ? (
                  <>
                    <img src={formData.logoUrl} className="h-full w-full object-contain p-6" alt="Logo Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Camera className="text-white h-8 w-8" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-muted-foreground">
                    <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                    <span className="text-[10px] font-black uppercase">Upload Main Logo</span>
                  </div>
                )}
              </div>
              <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Favicon Icon</label>
                <div 
                  onClick={() => faviconInputRef.current?.click()}
                  className="h-24 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20 group hover:border-primary/40 transition-all"
                >
                  {formData.faviconUrl ? (
                    <img src={formData.faviconUrl} className="h-8 w-8 object-contain" alt="Favicon" />
                  ) : (
                    <LinkIcon className="h-5 w-5 opacity-20" />
                  )}
                </div>
                <input type="file" ref={faviconInputRef} className="hidden" accept="image/png, image/x-icon, image/jpeg" onChange={(e) => handleImageUpload(e, 'faviconUrl')} />
              </div>
              <div className="flex flex-col justify-center">
                 <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                   "Search engines show this small icon next to your website title in tabs and mobile results."
                 </p>
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
          SAVE & DEPLOY CHANGES
        </Button>
      </div>
    </div>
  );
}
