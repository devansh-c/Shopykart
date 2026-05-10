"use client"

import { useEffect, useState } from 'react';
import { Sparkles, Tag, Calendar } from 'lucide-react';
import { getPersonalizedOfferSuggestions, PersonalizedOfferSuggestionsOutput } from '@/ai/flows/personalized-offer-suggestions-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export function PersonalizedOffers() {
  const [offersData, setOffersData] = useState<PersonalizedOfferSuggestionsOutput | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchOffers() {
      try {
        const result = await getPersonalizedOfferSuggestions({
          userId: 'user-123',
          pastOrdersSummary: 'User frequently orders pizza and burgers. Occasionally orders desserts.',
          browsingHistorySummary: 'Recently viewed premium steak houses and high-rated sushi places.'
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
      description: `${title} will be applied at checkout.`,
    });
  };

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="min-w-[280px] h-32 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!offersData?.offers || offersData.offers.length === 0) return null;

  return (
    <div className="py-4">
      <div className="flex items-center px-4 mb-4">
        <div className="bg-amber-100 p-1.5 rounded-lg mr-2">
          <Sparkles className="h-4 w-4 text-amber-600" />
        </div>
        <h2 className="text-lg font-bold">Recommended for You</h2>
      </div>
      
      <div className="flex overflow-x-auto space-x-4 px-4 no-scrollbar">
        {offersData.offers.map((offer, idx) => (
          <div 
            key={idx} 
            className="min-w-[280px] premium-card p-5 bg-gradient-to-br from-white to-secondary/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-1 rounded-full flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  {offer.discount}
                </span>
                <div className="flex items-center text-muted-foreground text-[10px]">
                  <Calendar className="h-3 w-3 mr-1" />
                  Valid until {offer.validUntil}
                </div>
              </div>
              <h3 className="font-bold text-base leading-tight">{offer.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{offer.description}</p>
            </div>
            
            <button 
              onClick={() => handleRedeem(offer.title)}
              className="mt-4 text-xs font-bold text-primary self-start hover:underline"
            >
              REDEEM NOW
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
