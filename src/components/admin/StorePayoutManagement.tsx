
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
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
  Banknote,
  Timer,
  QrCode,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function StorePayoutManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);

  // Fetch all payout requests
  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'payout_requests'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: requests, loading: requestsLoading } = useCollection<any>(requestsQuery);

  // Fetch all vendors for manual payouts
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), orderBy('storeName', 'asc'));
  }, [firestore]);
  const { data: vendors, loading: vendorsLoading } = useCollection<any>(vendorsQuery);

  const pendingRequests = useMemo(() => requests?.filter(r => r.status === 'Pending') || [], [requests]);

  const handleProcessPayout = async () => {
    if (!firestore || !activeRequest || isProcessing) return;

    setIsProcessing(true);
    try {
      // 1. Update Vendor's wallet balance to 0 (since we paid the pending amount)
      const vendorRef = doc(firestore, 'vendors', activeRequest.vendorId);
      await updateDoc(vendorRef, {
        walletBalance: 0,
        lastPayoutAt: serverTimestamp()
      });

      // 2. Mark the request as Completed
      const requestRef = doc(firestore, 'payout_requests', activeRequest.id);
      await updateDoc(requestRef, {
        status: 'Completed',
        paidAt: serverTimestamp()
      });

      // 3. Add to Payout History sub-collection
      const historyRef = collection(firestore, 'vendors', activeRequest.vendorId, 'payout_history');
      await addDoc(historyRef, {
        amount: activeRequest.amount,
        date: new Date().toISOString(),
        status: 'Completed',
        upiId: activeRequest.upiId,
        requestId: activeRequest.id
      });

      toast({ title: "Settlement Confirmed! ✅", description: `₹${activeRequest.amount.toFixed(0)} marked as settled for ${activeRequest.storeName}.` });
      setIsQrOpen(false);
      setActiveRequest(null);
    } catch (err) {
      toast({ variant: "destructive", title: "Settlement Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!firestore || !confirm("Reject this request?")) return;
    await deleteDoc(doc(firestore, 'payout_requests', id));
    toast({ title: "Request Rejected" });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl pb-32">
      <div className="bg-[#0B0B0B] p-10 rounded-[3rem] border border-white/5 shadow-2xl text-white relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="h-20 w-20 bg-primary/20 rounded-[1.75rem] flex items-center justify-center text-primary border border-primary/20">
                  <Banknote className="h-10 w-10" />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Settlement Hub</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                    <Timer className="h-3 w-3" /> {pendingRequests.length} Pending Withdrawal Requests
                  </p>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12 pointer-events-none" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
         {/* PENDING REQUESTS SIDE */}
         <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter ml-2 flex items-center gap-3">
               <AlertCircle className="h-5 w-5 text-amber-500" /> Withdrawal Queue
            </h3>
            
            <div className="space-y-4">
               {requestsLoading ? (
                 <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
               ) : pendingRequests.length > 0 ? (
                 pendingRequests.map((req: any) => (
                   <div key={req.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-amber-100 shadow-sm flex flex-col group hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
                               <Store className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                               <h4 className="font-black text-base uppercase italic leading-none truncate pr-10">{req.storeName}</h4>
                               <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block">Requested {format(new Date(req.createdAt?.seconds * 1000 || Date.now()), 'dd MMM, hh:mm a')}</span>
                            </div>
                         </div>
                         <button onClick={() => handleRejectRequest(req.id)} className="h-8 w-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center active:scale-90 transition-all"><X className="h-4 w-4" /></button>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-5 flex items-center justify-between border border-gray-100 mb-6">
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amount Due</span>
                            <div className="text-2xl font-black italic text-gray-900 tracking-tighter">₹ {req.amount.toFixed(0)}</div>
                         </div>
                         <div className="text-right">
                            <span className="text-[8px] font-black text-primary uppercase tracking-widest block mb-1">Target UPI</span>
                            <span className="text-xs font-black text-primary tracking-widest">{req.upiId}</span>
                         </div>
                      </div>

                      <Button 
                        onClick={() => { setActiveRequest(req); setIsQrOpen(true); }}
                        className="w-full h-14 bg-green-600 hover:bg-black text-white rounded-[1.25rem] font-black uppercase italic text-sm shadow-lg shadow-green-100 transition-all"
                      >
                         <QrCode className="h-5 w-5 mr-2" /> PAY & SETTLE NOW
                      </Button>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed flex flex-col items-center">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <p className="font-black uppercase text-[10px] text-muted-foreground">Queue is empty. No pending payments.</p>
                 </div>
               )}
            </div>
         </div>

         {/* COMPLETED HISTORY SIDE */}
         <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-tighter ml-2 flex items-center gap-3">
               <History className="h-5 w-5 text-gray-400" /> Recent Settlements
            </h3>
            <div className="bg-white rounded-[3rem] border border-border shadow-sm p-6 overflow-y-auto no-scrollbar max-h-[600px] space-y-3">
               {requests?.filter(r => r.status === 'Completed').slice(0, 10).map((h: any) => (
                 <div key={h.id} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-white">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center border border-green-100"><CheckCircle2 className="h-5 w-5" /></div>
                       <div>
                          <h4 className="text-[11px] font-black uppercase italic truncate max-w-[120px]">{h.storeName}</h4>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">{format(new Date(h.paidAt?.seconds * 1000 || Date.now()), 'dd MMM')}</span>
                       </div>
                    </div>
                    <span className="text-sm font-black italic text-green-600">₹{h.amount.toFixed(0)}</span>
                 </div>
               ))}
               {!requests?.some(r => r.status === 'Completed') && (
                 <div className="text-center py-20 opacity-20"><History className="h-12 w-12 mx-auto mb-2" /><p className="font-black uppercase text-[10px]">No recent payouts</p></div>
               )}
            </div>
         </div>
      </div>

      {/* DYNAMIC SETTLEMENT MODAL */}
      <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
         <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
            <div className="bg-green-600 h-[2px] w-full" />
            <div className="p-10 space-y-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Banknote className="h-32 w-32 rotate-12" /></div>
               
               <div className="space-y-2 relative z-10">
                  <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto border border-green-100 shadow-inner"><QrCode className="h-8 w-8" /></div>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Scan to Settle</DialogTitle>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Payable to {activeRequest?.storeName}</p>
               </div>

               <div className="bg-gray-50 p-6 rounded-[2.5rem] border-4 border-dashed border-gray-200 relative group animate-in zoom-in duration-500">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=${activeRequest?.upiId}&pn=${activeRequest?.storeName}&am=${activeRequest?.amount}&cu=INR`)}`} 
                    className="h-48 w-48 mx-auto relative z-10 shadow-2xl" 
                    alt="Scan to Pay" 
                  />
                  <div className="mt-6 space-y-1">
                     <span className="text-[10px] font-black text-primary uppercase italic tracking-widest">Payout Amount</span>
                     <h4 className="text-4xl font-black italic text-gray-900 tracking-tighter leading-none">₹{activeRequest?.amount.toFixed(0)}</h4>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 text-left">
                     <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                     <p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                        Pehle apne mobile se payment confirm karein. Phir hi neeche ka button dabayein taaki vendor ka wallet balance 0 ho sake.
                     </p>
                  </div>
                  
                  <Button 
                    onClick={handleProcessPayout} 
                    disabled={isProcessing}
                    className="w-full h-18 bg-black hover:bg-green-600 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl transition-all"
                  >
                     {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM AS PAID"}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
