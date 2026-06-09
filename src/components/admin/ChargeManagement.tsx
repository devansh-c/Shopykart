
"use client"

import { useState } from 'react';
import { Plus, Trash2, Receipt, IndianRupee, Loader2, Info, Percent, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ChargeManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);

  const { data: charges, loading } = useCollection<any>(chargesQuery);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('fixed');
  const [value, setValue] = useState('');

  const handleSave = async () => {
    if (!firestore || !name || !value) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name and value are required." });
      return;
    }

    const chargeData = {
      name: name.trim(),
      type: type,
      value: parseFloat(value),
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'checkout_charges'), chargeData);
      setIsAddOpen(false);
      setName('');
      setValue('');
      setType('fixed');
      toast({ title: "Charge Added", description: `${name} is now live on checkout.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error Saving" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'checkout_charges', id));
      toast({ title: "Charge Removed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error Deleting" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Tax & Bill Charges</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Manage platform fees, packaging, and local taxes</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="h-12 bg-primary hover:bg-primary/90 text-white rounded-[1.25rem] font-black uppercase italic shadow-xl shadow-primary/20 px-6">
              <Plus className="h-5 w-5 mr-2" />
              NEW EXTRA CHARGE
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">Configure Charge</DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Charge Identity</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. GST, Packaging Fee" className="h-14 rounded-2xl font-bold bg-muted/20 border-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Calculation Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-14 rounded-2xl font-bold bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="fixed" className="font-bold py-3 text-xs uppercase italic">Fixed (₹)</SelectItem>
                      <SelectItem value="percentage" className="font-bold py-3 text-xs uppercase italic">Percent (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Value Amount</label>
                  <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="h-14 rounded-2xl font-black bg-muted/20 border-none text-lg italic" />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 border border-blue-100/50">
                 <Zap className="h-4 w-4 text-blue-500 shrink-0" />
                 <p className="text-[9px] font-bold text-blue-700 uppercase leading-relaxed">
                   This charge will be applied to EVERY checkout bill instantly.
                 </p>
              </div>

              <Button onClick={handleSave} className="w-full h-16 bg-black hover:bg-primary text-white rounded-3xl font-black uppercase italic shadow-xl transition-all mt-2">
                ACTIVATE NOW
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !charges ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
             <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing billing records...</span>
          </div>
        ) : charges && charges.length > 0 ? (
          charges.map((charge) => (
            <div key={charge.id} className="bg-white p-8 rounded-[2.5rem] border border-border/60 shadow-sm flex flex-col group hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
               {/* Background Watermark */}
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Receipt className="h-24 w-24 -rotate-12" />
               </div>
               
               <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                     <Receipt className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black italic uppercase tracking-tighter text-xl leading-none truncate">{charge.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                       <div className="bg-muted px-2 py-0.5 rounded-full border border-border/50">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{charge.type === 'fixed' ? 'Fixed Fee' : 'Percentage Tax'}</span>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="flex items-baseline gap-1 mb-8 relative z-10">
                 <span className="text-4xl font-black italic tracking-tighter text-gray-900">
                    {charge.type === 'fixed' ? `₹${charge.value}` : `${charge.value}%`}
                 </span>
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">per order</span>
               </div>

               <div className="mt-auto pt-6 border-t border-dashed border-gray-100 flex items-center justify-between relative z-10">
                  <Badge className="bg-green-50 text-green-700 border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">
                     <ShieldCheck className="h-2.5 w-2.5 mr-1" /> ACTIVE ON BILL
                  </Badge>
                  <button 
                    onClick={() => handleDelete(charge.id)}
                    className="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-muted/50">
            <div className="bg-muted/10 h-20 w-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Receipt className="h-10 w-10 text-muted-foreground/20" />
            </div>
            <p className="text-muted-foreground font-black italic uppercase tracking-[0.2em] text-sm">No Tax Records Found</p>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-2">Start by adding packaging fees or GST.</p>
          </div>
        )}
      </div>
    </div>
  );
}
