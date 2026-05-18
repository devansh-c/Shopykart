
"use client"

import { useEffect, useState } from 'react';
import { Sparkles, Tag, Calendar, ChevronRight } from 'lucide-react';
import { getPersonalizedOfferSuggestions, PersonalizedOfferSuggestionsOutput } from '@/ai/flows/personalized-offer-suggestions-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function PersonalizedOffers() {
  const [offersData, setOffersData] = useState<PersonalizedOfferSuggestionsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchOffers() {
      try {
        const result = await getPersonalizedOfferSuggestions({
          userId: 'user-premium-01',
          pastOrdersSummary: 'The user has a refined palate, preferring artisanal pizzas and gourmet burgers. They value quality over quantity and often order for special occasions.',
          browsingHistorySummary: 'Recently explored premium dessert collections and trending healthy bowls.'
        });
        setOffersData(result);
      } catch (error) {
        console.error("Failed to fetch offers", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOffers();
  }, []);

  const handleRedeem = (title: string) => {
    toast({
      title: "Offer Activated!",
      description: `${title} has been linked to your account.`,
    });
  };

  if (loading || !offersData?.offers || offersData.offers.length === 0) return null;

  return (
    <div className="py-8">
      <div className="flex items-center justify-between px-4 mb-6">
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-2xl mr-3">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black italic tracking-tighter text-headline">Curated For You</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">AI-driven gourmet suggestions</p>
          </div>
        </div>
      </div>
      
      <div className="flex overflow-x-auto space-x-6 px-4 no-scrollbar pb-4">
        {offersData.offers.map((offer, idx) => (
          <div 
            key={idx} 
            className="min-w-[300px] premium-card p-6 bg-gradient-to-br from-white to-[#FFF5F5] flex flex-col justify-between border-2 border-primary/5"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="bg-primary text-white text-[9px] font-black px-3 py-1.5 rounded-full flex items-center shadow-lg shadow-primary/20 italic uppercase tracking-tighter">
                  <Tag className="h-3 w-3 mr-1.5" />
                  {offer.discount}
                </span>
                <div className="flex items-center text-muted-foreground text-[10px] font-bold">
                  <Calendar className="h-3 w-3 mr-1" />
                  Ends {offer.validUntil}
                </div>
              </div>
              <h3 className="font-black text-xl leading-tight mb-2 italic tracking-tight">{offer.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-medium">{offer.description}</p>
            </div>
            
            <button 
              onClick={() => handleRedeem(offer.title)}
              className="mt-6 text-[10px] font-black text-primary uppercase tracking-widest flex items-center group active:translate-x-1 transition-all"
            >
              REDEEM OFFER
              <ChevronRight className="h-3 w-3 ml-1 group-hover:ml-2 transition-all" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
