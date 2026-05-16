
"use client"

import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { ChevronLeft, Minus, Plus, Star, Share2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import * as mockData from '@/lib/mock-data';

export default function ProductDetailsPage() {
  const { productId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { addToCart, cart } = useCart();
  const [instructions, setInstructions] = useState('');
  
  // Rating & Review State
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const firestore = useFirestore();
  const productRef = useMemoFirebase(() => {
    if (!firestore || !productId) return null;
    return doc(firestore, 'products', productId as string);
  }, [firestore, productId]);

  const { data: dbProduct, loading: dbLoading } = useDoc<any>(productRef);
  
  // Products Query for Related Items
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: allDbProducts } = useCollection<any>(productsQuery);

  // Combine DB and Mock Data for the current product
  const product = useMemo(() => {
    if (dbProduct) return dbProduct;
    return mockData.allProducts.find((p: any) => p.id === productId);
  }, [dbProduct, productId]);

  // Combined loading state: only show spinner if we have NO data at all
  const loading = dbLoading && !product;

  const cartItem = cart.find(item => item.id === productId);
  const [localQuantity, setLocalQuantity] = useState(1);

  // Mocked global reviews
  const [mockReviews] = useState([
    { id: 'r1', user: 'Amit K.', rating: 5, comment: 'Absolutely delicious! The best in town.', date: '2 days ago' },
    { id: 'r2', user: 'Sara S.', rating: 4, comment: 'Very fresh and hot. Loved the packaging.', date: '5 days ago' },
  ]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center flex-col">
        <h2 className="text-2xl font-black uppercase italic">Product Not Found</h2>
        <p className="text-muted-foreground mt-2 mb-6">The item you are looking for doesn't exist.</p>
        <Button onClick={() => router.push('/menu')} className="bg-primary rounded-2xl h-12 px-8 font-bold">Back to Menu</Button>
      </div>
    );
  }

  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/800/600`;

  const handleAddToCart = () => {
    addToCart({ ...product, imageUrl, quantity: localQuantity });
    toast({ title: "Added to Cart", description: `${product.name} added successfully.` });
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this delicious ${product.name} on ShopyKart!`,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link Copied", description: "Product link copied." });
      } catch (err) {
        toast({ variant: "destructive", title: "Failed to Copy" });
      }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') await copyToClipboard();
      }
    } else {
      await copyToClipboard();
    }
  };

  const handleSubmitReview = () => {
    if (userRating === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please select a rating." });
      return;
    }
    setHasSubmitted(true);
    setIsEditing(false);
    toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
  };

  const relatedProducts = useMemo(() => {
    const baseItems = (allDbProducts && allDbProducts.length > 0) ? allDbProducts : mockData.allProducts;
    return baseItems.filter((p: any) => p.id !== productId).slice(0, 8);
  }, [allDbProducts, productId]);

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-border/50">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-black uppercase italic tracking-tight">Item Details</h1>
        <button 
          onClick={handleShare} 
          className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-foreground active:scale-90"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      <div className="relative w-full aspect-[4/3] bg-muted">
        <Image 
          src={imageUrl} 
          alt={product.name} 
          fill 
          className="object-cover"
          priority
        />
      </div>

      <div className="relative z-10 -mt-8 bg-white rounded-t-[2.5rem] px-6 pt-8 pb-4">
        <div className="flex items-center justify-center mb-6">
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </div>

        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-black text-foreground leading-tight max-w-[80%]">{product.name}</h2>
          {product.isVeg && (
            <div className="h-6 w-6 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mt-1">
              <div className="h-full w-full bg-green-600 rounded-full" />
            </div>
          )}
        </div>

        <div className="text-2xl font-black text-primary mb-6">₹{product.price.toFixed(2)}</div>

        <div className="space-y-4 mb-8">
          <h3 className="text-base font-black text-foreground uppercase tracking-tight">Special instructions</h3>
          <Textarea 
            placeholder="E.g. no onions, extra sauce..." 
            className="rounded-2xl bg-muted/30 border-muted h-24 focus-visible:ring-primary/20"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="space-y-6 mb-12 border-t pt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">
              {hasSubmitted && !isEditing ? "Your Review" : "Give Rating"}
            </h3>
            {hasSubmitted && !isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs font-bold text-primary"
                onClick={() => setIsEditing(true)}
              >
                EDIT REVIEW
              </Button>
            )}
          </div>

          {( !hasSubmitted || isEditing ) ? (
            <div className="space-y-4 bg-muted/20 p-5 rounded-3xl border border-border/40">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setUserRating(star)}
                    className="focus:outline-none transition-transform active:scale-90"
                  >
                    <Star 
                      className={cn(
                        "h-8 w-8 transition-colors",
                        star <= userRating ? "fill-primary text-primary" : "text-gray-300"
                      )} 
                    />
                  </button>
                ))}
              </div>
              <Textarea 
                placeholder="Share your experience..." 
                className="rounded-2xl bg-white border-muted h-24 focus-visible:ring-primary/20"
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
              />
              <Button 
                onClick={handleSubmitReview}
                className="w-full bg-primary font-black uppercase italic rounded-xl h-12"
              >
                {isEditing ? "UPDATE REVIEW" : "SUBMIT RATING"}
              </Button>
            </div>
          ) : (
            <div className="bg-primary/5 p-5 rounded-3xl border border-primary/10">
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={cn(
                      "h-4 w-4",
                      star <= userRating ? "fill-primary text-primary" : "text-gray-200"
                    )} 
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-foreground italic">"{userReview || 'No comment provided.'}"</p>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Customer Reviews ({mockReviews.length})</h4>
            <div className="space-y-4">
              {mockReviews.map((rev) => (
                <div key={rev.id} className="flex gap-4 items-start border-b border-muted pb-4 last:border-0">
                  <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center font-bold text-xs uppercase">
                    {rev.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold">{rev.user}</span>
                      <span className="text-[10px] text-muted-foreground">{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={cn("h-3 w-3", s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-foreground uppercase tracking-tight">People also ordered</h3>
            </div>
            <div className="overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
              <div className="flex space-x-4">
                {relatedProducts.map((prod: any) => (
                  <Link key={prod.id} href={`/product/${prod.id}`}>
                    <div className="min-w-[200px] bg-white rounded-3xl border border-border/40 p-3 shadow-sm flex flex-col group active:scale-95 transition-all">
                      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                        <img 
                          src={prod.imageUrl || `https://picsum.photos/seed/${prod.id}/300/300`} 
                          alt={prod.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="font-bold text-sm truncate">{prod.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-black text-primary">₹{prod.price}</span>
                        <div className="bg-primary/10 text-primary p-2 rounded-xl">
                          <Plus className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border/50 p-4 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <div className="flex items-center bg-muted/50 rounded-2xl h-14 px-2">
            <button 
              onClick={() => setLocalQuantity(Math.max(1, localQuantity - 1))}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-lg font-black">{localQuantity}</span>
            <button 
              onClick={() => setLocalQuantity(localQuantity + 1)}
              className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-white transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={handleAddToCart}
            className="flex-1 h-14 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            Add to Cart • ₹{(product.price * localQuantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
