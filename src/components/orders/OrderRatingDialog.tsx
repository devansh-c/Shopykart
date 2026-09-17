
'use client';

import { useState } from 'react';
import { Star, Loader2, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OrderRatingDialogProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderRatingDialog({ order, isOpen, onClose }: OrderRatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!firestore || !user || rating === 0) return;

    setIsSubmitting(true);
    try {
      const reviewId = `rev_${order.id}`;
      const reviewData = {
        orderId: order.id,
        customerOrderNumber: order.customerOrderNumber,
        userId: user.uid,
        customerName: order.customerName || 'Premium User',
        vendorId: order.vendorId || order.items?.[0]?.vendorId,
        restaurantName: order.restaurantName,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      };

      // 1. Save review to main collection
      await setDoc(doc(firestore, 'reviews', reviewId), reviewData);
      
      // 2. Mark order as rated
      await updateDoc(doc(firestore, 'orders', order.id), {
        isRated: true,
        customerRating: rating,
        ratedAt: serverTimestamp()
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Error", description: "Could not submit rating." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !isSubmitting && !isSuccess && (val ? null : onClose())}>
      <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
        <div className="bg-primary h-1.5 w-full" />
        
        <div className="p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center text-center py-10 animate-in zoom-in duration-500">
               <div className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center shadow-xl shadow-green-100 border-[6px] border-white mb-6">
                  <CheckCircle2 className="h-12 w-12 text-white stroke-[3]" />
               </div>
               <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">THANK YOU!</h2>
               <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-2">Rating Published Successfully</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col items-center text-center space-y-2">
                 <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-2 border border-amber-100 shadow-inner">
                    <Star className="h-8 w-8 fill-amber-500" />
                 </div>
                 <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Rate Experience</DialogTitle>
                 <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed px-4">
                   How was your meal from <span className="text-primary">{order.restaurantName}</span>?
                 </DialogDescription>
              </div>

              <div className="flex justify-center gap-2 py-2">
                 {[1, 2, 3, 4, 5].map((star) => (
                   <button 
                    key={star}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 active:scale-90 transition-transform"
                   >
                     <Star 
                      className={cn(
                        "h-10 w-10 transition-all duration-200",
                        (hoveredRating || rating) >= star ? "text-amber-400 fill-amber-400" : "text-gray-100 fill-gray-50"
                      )} 
                     />
                   </button>
                 ))}
              </div>

              <div className="space-y-4">
                 <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                    <Textarea 
                      placeholder="TELL US MORE (OPTIONAL)..."
                      value={comment}
                      onChange={e => setComment(e.target.value.toUpperCase())}
                      className="min-h-[120px] pl-10 rounded-[1.5rem] bg-gray-50 border-none font-bold text-xs uppercase focus-visible:ring-1 focus-visible:ring-primary/20 p-4"
                    />
                 </div>

                 <Button 
                   onClick={handleSubmit}
                   disabled={isSubmitting || rating === 0}
                   className="w-full h-16 bg-black hover:bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-xl transition-all"
                 >
                   {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH RATING"}
                 </Button>
              </div>

              <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">ShopyKart Real Feedback</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
