"use client"

import { useState, useEffect } from 'react';
import { Zap, Save, Loader2, IndianRupee, Percent, ShieldCheck, AlertCircle, Sparkles, Power, Lock, Unlock } from 'lucide-react';
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
    isClosedAfterMilestone: true,
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
        isClosedAfterMilestone: offer.isClosedAfterMilestone !== false,
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
        title: formData.isActive ? "Campaign Published! 🚀" : "Campaign Offline",
        description: formData.isClosedAfterMilestone 
          ? "Showoff mode active: Customers will see discount on home but pay full price." 
          : "Real sale active: Everyone gets the discount price!" 
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

               {/* THE NEW MILESTONE TOGGLE */}
               <div className={cn(
                 "p-6 rounded-[2rem] border-2 transition-all space-y-4",
                 formData.isClosedAfterMilestone ? "border-amber-100 bg-amber-50/50" : "border-green-100 bg-green-50/50"
               )}>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl text-white", formData.isClosedAfterMilestone ? "bg-amber-500" : "bg-green-500")}>
                           {formData.isClosedAfterMilestone ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black uppercase tracking-tight">Close Sale (Milestone Mode)</span>
                           <span className="text-[8px] font-bold text-muted-foreground uppercase">Showoff mode vs Real Discount</span>
                        </div>
                     </div>
                     <Switch 
                      checked={formData.isClosedAfterMilestone}
                      onCheckedChange={(val) => setFormData({...formData, isClosedAfterMilestone: val})}
                      className="data-[state=checked]:bg-amber-500"
                     />
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase">
                    {formData.isClosedAfterMilestone 
                      ? "ON: Customers will see discount on Home page but will pay ORIGINAL price at checkout with a 'Sale Closed' notice."
                      : "OFF: Customers will get the REAL discount everywhere, including Checkout."}
                  </p>
               </div>
            </div>

            <Button onClick={handleSave} disabled={isSaving} className="w-full h-18 bg-black hover:bg-primary text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl transition-all">
               {isSaving ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Save className="h-6 w-6 mr-3" />}
               PUBLISH CONFIGURATION
            </Button>
         </div>

         <div className="bg-gray-50 p-10 rounded-[3rem] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
            <div className="absolute top-4 left-4"><Badge className="bg-primary text-white font-black text-[8px] uppercase tracking-widest">Pricing Preview</Badge></div>
            
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
                  <div className="mt-4 p-3 bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20">
                     <p className="text-[8px] font-black text-muted-foreground uppercase leading-tight">
                       Checkout Reality:<br/>
                       <span className={cn("text-[10px]", formData.isClosedAfterMilestone ? "text-red-500" : "text-green-600")}>
                         {formData.isClosedAfterMilestone ? "PAY FULL PRICE (₹100)" : `PAY DISCOUNTED (₹${formData.type === 'percentage' ? (100 * (1 - parseFloat(formData.value)/100)).toFixed(0) : (100 - parseFloat(formData.value)).toFixed(0)})`}
                       </span>
                     </p>
                  </div>
               </div>
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
