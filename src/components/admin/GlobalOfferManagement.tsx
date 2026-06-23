"use client"

import { useState, useEffect } from 'react';
import { Zap, Save, Loader2, IndianRupee, Percent, ShieldCheck, AlertCircle, Sparkles, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function GlobalOfferManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const offerRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global_offer');
  }, [firestore]);

  const { data: offer, loading } = useDoc<any>(offerRef);

  const [formData, setFormData] = useState({
    title: 'Holi Special Flash Sale',
    type: 'percentage',
    value: '10',
    isActive: false,
    subtitle: 'Limited Time Store-wide Discount'
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title || 'Flash Sale',
        type: offer.type || 'percentage',
        value: offer.value ? offer.value.toString() : '0',
        isActive: offer.isActive || false,
        subtitle: offer.subtitle || 'Special Price Slash'
      });
    }
  }, [offer]);

  const handleSave = async () => {
    if (!firestore) return;
    setIsSaving(true);
    try {
      await setDoc(doc(firestore, 'app_settings', 'global_offer'), {
        ...formData,
        value: parseFloat(formData.value) || 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ 
        title: formData.isActive ? "Flash Sale Active! 🚀" : "Sale Deactivated",
        description: `Every product now reflects your ${formData.value}${formData.type === 'percentage' ? '%' : '₹'} discount.` 
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-4">
              <div className="bg-primary/20 p-4 rounded-3xl border border-primary/20">
                 <Zap className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">Offer Master</h3>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Control store-wide prices in real-time</p>
              </div>
           </div>
           
           <div className="bg-white/5 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
              <span className={cn("text-xs font-black uppercase tracking-widest", formData.isActive ? "text-green-400" : "text-gray-500")}>
                {formData.isActive ? 'SYSTEM ACTIVE' : 'SYSTEM OFFLINE'}
              </span>
              <Switch 
                checked={formData.isActive}
                onCheckedChange={(val) => setFormData({...formData, isActive: val})}
                className="data-[state=checked]:bg-green-500"
              />
           </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
            <div className="space-y-4">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Campaign Title</label>
                  <Input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g. MEGA FLASH SALE"
                    className="h-14 rounded-2xl font-black bg-muted/20 border-none"
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Campaign Subtitle</label>
                  <Input 
                    value={formData.subtitle} 
                    onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    placeholder="e.g. Best price of the season"
                    className="h-12 rounded-xl bg-muted/20 border-none font-bold"
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Discount Mode</label>
                     <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none font-black italic">
                           <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl">
                           <SelectItem value="percentage" className="font-bold py-3 uppercase italic">PERCENTAGE (%)</SelectItem>
                           <SelectItem value="fixed" className="font-bold py-3 uppercase italic">FIXED (₹)</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Value</label>
                     <div className="relative">
                        {formData.type === 'percentage' ? (
                          <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                        ) : (
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                        )}
                        <Input 
                          type="number" 
                          value={formData.value} 
                          onChange={e => setFormData({...formData, value: e.target.value})}
                          className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-black text-xl italic text-primary"
                        />
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex gap-4">
               <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0" />
               <p className="text-[9px] font-bold text-blue-700 uppercase leading-relaxed">
                 Ye settings save karte hi poori app mein prices update ho jayenge. MRP same rahegi, lekin Selling Price discounted dikhega.
               </p>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full h-18 bg-black hover:bg-primary text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl transition-all">
               {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
               PUBLISH GLOBAL OFFER
            </Button>
         </div>

         <div className="bg-gray-50 p-10 rounded-[3rem] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
            <div className="absolute top-4 left-4"><Badge className="bg-primary text-white font-black text-[8px] uppercase tracking-widest">Customer Preview</Badge></div>
            
            <div className="w-full max-w-[280px] bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 p-6 space-y-4">
               <div className="h-32 w-full bg-muted rounded-2xl overflow-hidden relative">
                  <img src="https://picsum.photos/seed/burger/400/300" className="w-full h-full object-cover" />
                  {formData.isActive && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-bounce">
                      {formData.title}
                    </div>
                  )}
               </div>
               <div>
                  <h4 className="font-black italic uppercase text-sm mb-1">Gourmet Burger</h4>
                  <div className="flex items-baseline gap-2">
                     <span className="text-2xl font-black text-primary italic">
                        ₹ {formData.isActive ? (formData.type === 'percentage' ? (100 * (1 - parseFloat(formData.value)/100)).toFixed(0) : (100 - parseFloat(formData.value)).toFixed(0)) : '100'}
                     </span>
                     {formData.isActive && <span className="text-xs font-bold text-gray-400 line-through">₹100</span>}
                  </div>
                  {formData.isActive && (
                    <div className="mt-2 flex items-center gap-1.5 text-[8px] font-black text-green-600 uppercase tracking-widest">
                       <Sparkles className="h-2.5 w-2.5" /> 
                       SAVE {formData.value}{formData.type === 'percentage' ? '%' : ' FIXED'} WITH GLOBAL DEAL
                    </div>
                  )}
               </div>
               <Button disabled className="w-full h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 font-black text-[9px] uppercase">
                  ADD TO CART
               </Button>
            </div>

            <div className="flex flex-col items-center text-center gap-1">
               <AlertCircle className="h-5 w-5 text-gray-400 mb-1" />
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Real-time Calculation Preview</p>
            </div>
         </div>
      </div>
    </div>
  );
}
