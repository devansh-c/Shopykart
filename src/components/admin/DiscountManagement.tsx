"use client"

import { useState } from 'react';
import { Plus, Trash2, Copy, Percent, Loader2, Tag, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function DiscountManagement() {
  const firestore = useFirestore();
  
  const couponsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'coupons');
  }, [firestore]);

  const { data: coupons, loading } = useCollection<any>(couponsQuery);
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [minOrder, setMinOrder] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Delete this coupon?")) {
      try {
        await deleteDoc(doc(firestore, 'coupons', id));
        toast({ title: "Coupon Deleted" });
      } catch (e) {
        toast({ variant: "destructive", title: "Error" });
      }
    }
  };

  const handleSave = async () => {
    if (!firestore || !code || !discountValue || isProcessing) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }

    setIsProcessing(true);
    const couponData = {
      code: code.toUpperCase().trim(),
      discountValue: parseFloat(discountValue),
      discountType: discountType,
      // For legacy display support
      discount: discountType === 'percentage' ? `${discountValue}% OFF` : `₹${discountValue} OFF`,
      minOrder: minOrder ? `Min order ₹${minOrder}` : 'No Min Order',
      minOrderValue: parseFloat(minOrder) || 0,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'coupons'), couponData);
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Coupon Published! 🚀" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountValue('');
    setDiscountType('percentage');
    setMinOrder('');
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-black italic uppercase">Promo & Discounts</h2>
          <p className="text-xs text-muted-foreground font-bold">Manage active promotional codes</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl font-black uppercase italic text-[10px] tracking-widest">
              <Plus className="h-4 w-4 mr-2" />
              New Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2.5rem] p-8 border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase text-center text-xl">Create Promo Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Code (Upper Case)</label>
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SAVEYOU" className="h-14 rounded-2xl font-black italic text-lg border-none bg-muted/20" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Discount Mode</label>
                  <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                    <SelectTrigger className="h-14 rounded-2xl font-bold bg-muted/20 border-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="percentage" className="font-bold py-3 uppercase italic text-xs">Percent (%)</SelectItem>
                      <SelectItem value="fixed" className="font-bold py-3 uppercase italic text-xs">Rupees (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Value</label>
                  <div className="relative">
                    {discountType === 'percentage' ? (
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    ) : (
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    )}
                    <Input 
                      type="number" 
                      value={discountValue} 
                      onChange={e => setDiscountValue(e.target.value)} 
                      placeholder="0" 
                      className="h-14 pl-12 rounded-2xl font-black text-xl italic bg-muted/20 border-none text-primary" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Min. Order (₹)</label>
                <Input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="e.g. 299" className="h-14 rounded-2xl font-bold bg-muted/20 border-none" />
              </div>
              
              <Button onClick={handleSave} disabled={isProcessing} className="w-full bg-black hover:bg-primary text-white font-black uppercase italic h-16 rounded-[2rem] shadow-xl transition-all mt-4 text-lg">
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ACTIVATE COUPON'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coupons && coupons.length > 0 ? (
          coupons.map((coupon: any) => (
            <div 
              key={coupon.id}
              className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm flex flex-col group relative overflow-hidden transition-all hover:shadow-xl"
            >
              <div className="flex justify-between items-start mb-4">
                 <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                    <Tag className="h-6 w-6" />
                 </div>
                 <button 
                  onClick={() => handleDelete(coupon.id)}
                  className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                 <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Code: {coupon.code}</span>
                 <h3 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">
                    {coupon.discountValue}{coupon.discountType === 'percentage' ? '%' : '₹'} OFF
                 </h3>
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-gray-100">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">{coupon.minOrder || 'No min order'}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No promo codes active</p>
          </div>
        )}
      </div>
    </div>
  );
}
