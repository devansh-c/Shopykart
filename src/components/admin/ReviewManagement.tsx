
"use client"

import { useState } from 'react';
import { Star, Edit, Trash2, Search, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const initialReviews = [
  { id: 'r1', product: 'Cheese loaded French fries', user: 'Amit K.', rating: 5, comment: 'Absolutely delicious! The best in town.', date: 'Oct 24, 2023' },
  { id: 'r2', product: 'Chilli Attack Pasta', user: 'Sara S.', rating: 4, comment: 'Very fresh and hot. Loved the packaging.', date: 'Oct 22, 2023' },
  { id: 'r3', product: 'Classic Veggie Burger', user: 'John D.', rating: 3, comment: 'Good, but could be more spicy.', date: 'Oct 20, 2023' },
];

export function ReviewManagement() {
  const [reviews, setReviews] = useState(initialReviews);
  const { toast } = useToast();
  const [editingReview, setEditingReview] = useState<any>(null);

  const handleDelete = (id: string) => {
    setReviews(reviews.filter(r => r.id !== id));
    toast({ title: "Review Deleted", description: "The customer review has been removed." });
  };

  const handleUpdateReview = () => {
    setReviews(reviews.map(r => r.id === editingReview.id ? editingReview : r));
    setEditingReview(null);
    toast({ title: "Review Updated", description: "Changes saved successfully." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reviews by user or product..." className="pl-10 h-10 bg-muted/50 border-none rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="bg-white p-6 rounded-2xl border hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
              <div className="flex gap-4">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base">{rev.user}</h3>
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter bg-muted px-2 py-0.5 rounded-full">
                      {rev.product}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("h-3 w-3", s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                    ))}
                    <span className="text-[10px] font-bold text-muted-foreground ml-2">{rev.date}</span>
                  </div>
                  <p className="text-sm text-foreground/80 italic leading-relaxed">"{rev.comment}"</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-xl text-blue-500"
                      onClick={() => setEditingReview(rev)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  {editingReview && (
                    <DialogContent className="rounded-3xl max-w-md">
                      <DialogHeader>
                        <DialogTitle className="font-black italic uppercase">Edit Customer Review</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rating</label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <button key={s} onClick={() => setEditingReview({...editingReview, rating: s})}>
                                <Star className={cn("h-6 w-6", s <= editingReview.rating ? "fill-primary text-primary" : "text-gray-200")} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Comment</label>
                          <Textarea 
                            value={editingReview.comment}
                            onChange={(e) => setEditingReview({...editingReview, comment: e.target.value})}
                            className="rounded-2xl h-32"
                          />
                        </div>
                        <Button 
                          onClick={handleUpdateReview}
                          className="w-full bg-primary font-black uppercase italic h-12 rounded-xl"
                        >
                          SAVE CHANGES
                        </Button>
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => handleDelete(rev.id)} 
                  className="h-10 w-10 rounded-xl text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
