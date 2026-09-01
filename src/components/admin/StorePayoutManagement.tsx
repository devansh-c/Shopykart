
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
  AlertCircle,
  Building2,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function StorePayoutManagement() {
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
      v.phone?.includes(searchQuery) ||
      v.storeId?.toLowerCase().includes(searchQuery.toLowerCase())
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
        note: payoutNote || 'Standard Settlement',
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
            placeholder="Search ID or store name..." 
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
                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-primary/10 bg-muted shrink-0">
                   <img src={store.imageUrl || 'https://picsum.photos/seed/store/200/200'} className="h-full w-full object-cover" alt="" />
                </div>
                <div className="min-w-0">
                   <h3 className="font-black text-lg italic uppercase tracking-tighter leading-none truncate">{store.storeName}</h3>
                   <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{store.town} • {store.storeId}</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-3xl p-5 mb-6 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Wallet Balance</span>
                    <span className="text-xl font-black italic text-primary">₹{store.walletBalance?.toFixed(2) || '0.00'}</span>
                 </div>
                 <div className="pt-3 border-t border-dashed border-gray-300">
                    {store.kycCompleted ? (
                      <div className="flex items-center gap-2 text-green-600">
                         <ShieldCheck className="h-3 w-3" />
                         <span className="text-[9px] font-black uppercase tracking-widest">Bank Details Linked</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                         <AlertCircle className="h-3 w-3" />
                         <span className="text-[9px] font-black uppercase tracking-widest">KYC Pending</span>
                      </div>
                    )}
                 </div>
              </div>

              <Dialog>
                 <DialogTrigger asChild>
                    <Button className={cn(
                      "w-full h-14 rounded-2xl font-black uppercase italic shadow-xl active:scale-95 transition-all",
                      store.kycCompleted ? "bg-[#0B0B0B] hover:bg-primary" : "bg-gray-100 text-gray-400"
                    )}>
                       <Plus className="h-5 w-5 mr-2" />
                       PAY NOW
                    </Button>
                 </DialogTrigger>
                 <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white">
                    <DialogHeader className="p-8 pb-4">
                       <DialogTitle className="font-black italic uppercase text-center text-2xl tracking-tighter text-gray-900">Release Payout</DialogTitle>
                    </DialogHeader>
                    <div className="p-8 pt-0 space-y-6 overflow-y-auto no-scrollbar max-h-[80vh]">
                       <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/10 flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center border text-primary">
                             <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-[9px] font-black uppercase text-muted-foreground">Store Hub</p>
                            <h4 className="text-lg font-black italic uppercase text-primary leading-none">{store.storeName}</h4>
                          </div>
                       </div>

                       {store.kycCompleted ? (
                         <div className="bg-[#0B0B0B] p-6 rounded-[2rem] text-white shadow-xl space-y-4">
                            <div className="flex items-center gap-2 text-primary">
                               <CreditCard className="h-4 w-4" />
                               <span className="text-[10px] font-black uppercase tracking-widest">Bank Identity</span>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                               <div>
                                  <span className="text-[7px] font-black uppercase text-gray-500">Account Holder</span>
                                  <p className="text-xs font-black uppercase italic">{store.accountHolderName}</p>
                               </div>
                               <div className="flex justify-between">
                                  <div>
                                     <span className="text-[7px] font-black uppercase text-gray-500">A/C Number</span>
                                     <p className="text-sm font-black tracking-widest">{store.accountNumber}</p>
                                  </div>
                                  <div>
                                     <span className="text-[7px] font-black uppercase text-gray-500">IFSC</span>
                                     <p className="text-sm font-black tracking-widest text-primary">{store.ifscCode}</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 text-center">
                            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-red-800 uppercase">Warning: Store has not added bank details yet.</p>
                         </div>
                       )}

                       <div className="space-y-4 pt-2">
                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Transfer Amount (₹)</label>
                             <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input 
                                   type="number" 
                                   placeholder="0.00" 
                                   value={payoutAmount}
                                   onChange={e => setPayoutAmount(e.target.value)}
                                   className="h-16 rounded-2xl bg-gray-50 border-none pl-12 text-2xl font-black italic text-gray-900"
                                />
                             </div>
                          </div>

                          <div className="space-y-1.5">
                             <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Memo</label>
                             <Input 
                                placeholder="e.g. Weekly Settlement" 
                                value={payoutNote}
                                onChange={e => setPayoutNote(e.target.value)}
                                className="h-12 rounded-xl bg-gray-50 border-none font-bold"
                             />
                          </div>
                       </div>

                       <Button 
                          onClick={() => handleProcessPayout(store.id, store.storeName)}
                          disabled={isProcessing || !payoutAmount || !store.kycCompleted}
                          className="w-full h-18 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-xl shadow-xl shadow-green-100 transition-all active:scale-95"
                       >
                          {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                            <><Banknote className="h-6 w-6 mr-2" /> RELEASE PAYMENT</>
                          )}
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
