
"use client"

import { useState } from 'react';
import { Plus, Trash2, Receipt, IndianRupee, Loader2, Info, Percent } from 'lucide-react';
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
      toast({ variant: "destructive", title: "Missing Fields" });
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-black italic uppercase">Checkout Charges</h2>
          <p className="text-xs text-muted-foreground font-bold">Manage Taxes, Packaging & Surge Fees</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B0B] hover:bg-primary rounded-xl font-black uppercase italic text-xs tracking-widest">
              <Plus className="h-4 w-4 mr-2" />
              New Charge
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase text-center">Configure Charge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Charge Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. GST, Packaging Fee" className="h-12 rounded-xl font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="fixed">Fixed (₹)</SelectItem>
                      <SelectItem value="percentage">Percent (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Value</label>
                  <Input type="number" value={value} onChange={e => setValue(e.target.value)} placeholder="0.00" className="h-12 rounded-xl font-bold" />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full bg-primary h-14 rounded-2xl font-black uppercase italic shadow-xl mt-2">
                ACTIVATE CHARGE
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-amber-50 p-6 rounded-[2rem] border-2 border-dashed border-amber-200 flex gap-4">
         <Info className="h-6 w-6 text-amber-600 shrink-0" />
         <p className="text-[11px] font-bold text-amber-800 leading-relaxed uppercase">
           Yeh charges seedhe customer ke checkout bill mein judenge. "Percentage" total order value par calculate hoga.
         </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !charges ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : charges && charges.length > 0 ? (
          charges.map((charge) => (
            <div key={charge.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden">
               <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-gray-500">
                     <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase tracking-tighter text-lg leading-tight">{charge.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       {charge.type === 'fixed' ? <IndianRupee className="h-3 w-3 text-primary" /> : <Percent className="h-3 w-3 text-blue-500" />}
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{charge.type} Charge</span>
                    </div>
                  </div>
               </div>

               <div className="text-3xl font-black italic tracking-tighter mb-6">
                 {charge.type === 'fixed' ? `₹${charge.value}` : `${charge.value}%`}
               </div>

               <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleDelete(charge.id)}
                className="absolute top-4 right-4 h-10 w-10 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
               >
                 <Trash2 className="h-4 w-4" />
               </Button>

               <div className="mt-auto pt-4 border-t border-dashed border-gray-100">
                  <Badge className="bg-green-50 text-green-700 border-none font-black text-[9px] uppercase tracking-widest">Active on Checkout</Badge>
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No extra charges configured</p>
          </div>
        )}
      </div>
    </div>
  );
}
