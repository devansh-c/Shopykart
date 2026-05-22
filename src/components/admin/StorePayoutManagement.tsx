
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  CircleDollarSign, 
  Store, 
  ArrowUpRight, 
  Loader2, 
  Search, 
  Plus, 
  History,
  IndianRupee,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function StorePayoutManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all vendors
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: vendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter(v => 
      v.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone?.includes(searchQuery)
    );
  }, [vendors, searchQuery]);

  const handleProcessPayout = async (vendorId: string, storeName: string) => {
    if (!firestore || !payoutAmount || isNaN(Number(payoutAmount))) {
      toast({ variant: "destructive", title: "Invalid Amount" });
      return;
    }

    const amount = Number(payoutAmount);
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Amount must be greater than 0" });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Update Vendor's wallet balance
      const vendorRef = doc(firestore, 'vendors', vendorId);
      await updateDoc(vendorRef, {
        walletBalance: increment(amount),
        lastPayoutAt: serverTimestamp()
      });

      // 2. Add to Vendor's payout history sub-collection
      const historyRef = collection(firestore, 'vendors', vendorId, 'payout_history');
      await addDoc(historyRef, {
        amount: amount,
        note: payoutNote || 'Monthly Settlement',
        date: serverTimestamp(),
        status: 'Completed',
        type: 'credit'
      });

      toast({ 
        title: "Payout Successful!", 
        description: `₹${amount} has been added to ${storeName}'s dashboard.` 
      });
      setPayoutAmount('');
      setPayoutNote('');
    } catch (err) {
      console.error("Payout error:", err);
      toast({ variant: "destructive", title: "Payout Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Settlement Hub</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Release payments to partner stores</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by store name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !vendors ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((store: any) => (
            <div key={store.id} className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm hover:shadow-xl transition-all group flex flex-col">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-primary/10 bg-muted">
                   <img src={store.imageUrl} className="h-full w-full object-cover" alt="" />
                </div>
                <div>
                   <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight">{store.storeName}</h3>
                   <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{store.town}</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-3xl p-5 mb-6 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Current Balance</span>
                    <span className="text-xl font-black italic text-primary">₹{store.walletBalance?.toFixed(2) || '0.00'}</span>
                 </div>
                 <div className="pt-3 border-t border-dashed border-gray-300 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Last Payout</span>
                    <span className="text-xs font-bold">{store.lastPayoutAt ? 'Recently Released' : 'No History'}</span>
                 </div>
              </div>

              <Dialog>
                 <DialogTrigger asChild>
                    <Button className="w-full h-14 rounded-2xl bg-[#0B0B0B] hover:bg-primary font-black uppercase italic shadow-xl active:scale-95 transition-all">
                       <Plus className="h-5 w-5 mr-2" />
                       PAYOUT NOW
                    </Button>
                 </DialogTrigger>
                 <DialogContent className="rounded-[2.5rem] max-w-sm">
                    <DialogHeader>
                       <DialogTitle className="font-black italic uppercase text-center text-xl">Release Payment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 pt-4">
                       <div className="text-center bg-primary/5 p-4 rounded-3xl border border-primary/10">
                          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Paying to</p>
                          <h4 className="text-xl font-black italic uppercase text-primary tracking-tighter">{store.storeName}</h4>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount to Transfer (₹)</label>
                          <div className="relative">
                             <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                             <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={payoutAmount}
                                onChange={e => setPayoutAmount(e.target.value)}
                                className="h-16 rounded-2xl bg-muted/20 border-none pl-12 text-2xl font-black italic"
                             />
                          </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Admin Note (Optional)</label>
                          <Input 
                             placeholder="e.g. Oct Week 4 Settlement" 
                             value={payoutNote}
                             onChange={e => setPayoutNote(e.target.value)}
                             className="h-12 rounded-xl bg-muted/20 border-none font-bold"
                          />
                       </div>

                       <div className="bg-amber-50 p-4 rounded-2xl flex gap-3">
                          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                          <p className="text-[9px] font-bold text-amber-800 uppercase leading-relaxed">
                             This amount will be added to the store's "Available to Withdraw" section permanently.
                          </p>
                       </div>

                       <Button 
                          onClick={() => handleProcessPayout(store.id, store.storeName)}
                          disabled={isProcessing || !payoutAmount}
                          className="w-full h-16 bg-green-600 hover:bg-green-700 rounded-3xl font-black uppercase italic text-lg shadow-xl shadow-green-100"
                       >
                          {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM & RELEASE"}
                       </Button>
                    </div>
                 </DialogContent>
              </Dialog>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <CircleDollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No partner stores found</p>
          </div>
        )}
      </div>
    </div>
  );
}
