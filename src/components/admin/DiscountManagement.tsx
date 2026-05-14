
"use client"

import { useState } from 'react';
import { Plus, Trash2, Copy, Percent, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';

const gradients = [
  'from-[#ff4b4b] to-[#dc2626]',
  'from-[#f59e0b] to-[#d97706]',
  'from-[#4f46e5] to-[#3730a3]',
  'from-[#059669] to-[#047857]',
];

export function DiscountManagement() {
  const firestore = useFirestore();
  const { data: coupons, loading } = useCollection(firestore ? collection(firestore, 'coupons') : null);
  const { toast } = useToast();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [type, setType] = useState('EVERYDAY');
  const [selectedGradient, setSelectedGradient] = useState(gradients[0]);

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'coupons', id);
    deleteDoc(docRef).catch(async (e) => {
      const err = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
      errorEmitter.emit('permission-error', err);
    });
    toast({ title: "Coupon Deleted", description: "The promo code has been deactivated." });
  };

  const handleSave = () => {
    if (!firestore || !code || !discount) return;

    const couponData = {
      code: code.toUpperCase(),
      discount,
      minOrder,
      type,
      gradient: selectedGradient,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(firestore, 'coupons'), couponData)
      .then(() => {
        setIsAddOpen(false);
        resetForm();
        toast({ title: "Coupon Created", description: "Your new promo code is live!" });
      })
      .catch(async (e) => {
        const err = new FirestorePermissionError({ path: 'coupons', operation: 'create', requestResourceData: couponData });
        errorEmitter.emit('permission-error', err);
      });
  };

  const resetForm = () => {
    setCode('');
    setDiscount('');
    setMinOrder('');
    setType('EVERYDAY');
    setSelectedGradient(gradients[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-xl font-black italic uppercase">Promo & Discounts</h2>
          <p className="text-xs text-muted-foreground font-bold">Manage active promotional codes</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              New Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase">Create Promo Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code</label>
                  <Input value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. SAVE20" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Discount</label>
                  <Input value={discount} onChange={e => setDiscount(e.target.value)} placeholder="e.g. 20% OFF" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min Order Condition</label>
                <Input value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="e.g. Min order ₹200" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category Type</label>
                <Input value={type} onChange={e => setType(e.target.value)} placeholder="e.g. FIRST ORDER" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Theme Color</label>
                <div className="flex gap-3">
                  {gradients.map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGradient(g)}
                      className={cn(
                        "h-8 flex-1 rounded-lg bg-gradient-to-r border-2",
                        g,
                        selectedGradient === g ? "border-black scale-105" : "border-transparent"
                      )}
                    />
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} className="w-full bg-primary font-black uppercase italic h-12 rounded-xl mt-4">Active Coupon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : coupons && coupons.length > 0 ? (
          coupons.map((coupon: any) => (
            <div 
              key={coupon.id}
              className={`rounded-[2rem] bg-gradient-to-r ${coupon.gradient} p-6 flex text-white shadow-xl relative overflow-hidden group border border-white/10`}
            >
              <div className="flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <h3 className="text-4xl font-black leading-none italic tracking-tighter">{coupon.discount}</h3>
                  <p className="text-[10px] font-bold opacity-80 mt-2 uppercase tracking-widest">{coupon.minOrder}</p>
                </div>
                <div className="bg-white/20 backdrop-blur-md self-start px-4 py-1.5 rounded-full mt-4 border border-white/10">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{coupon.type}</span>
                </div>
              </div>
              
              <div className="w-[1px] bg-white/20 mx-4 border-dashed border-l" />
              
              <div className="w-24 flex flex-col items-center justify-center relative z-10">
                <div className="border-2 border-dashed border-white/30 p-2 rounded-2xl mb-3 w-full text-center bg-black/10">
                  <span className="text-sm font-black tracking-widest uppercase">{coupon.code}</span>
                </div>
                <button 
                  onClick={() => handleDelete(coupon.id)}
                  className="h-10 w-10 bg-red-500/80 hover:bg-red-600 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
