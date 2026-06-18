/**
 * @fileOverview This file defines a Genkit flow for generating personalized food offers and promotions.
 * Updated for Static Export compatibility: Returns fallbacks in browser environments.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedOfferSuggestionsInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting personalized offers.'),
  pastOrdersSummary: z.string().describe('A summarized history of the user\'s past food orders.'),
  browsingHistorySummary: z.string().describe('A summarized history of the user\'s recent browsing behavior.'),
});
export type PersonalizedOfferSuggestionsInput = z.infer<typeof PersonalizedOfferSuggestionsInputSchema>;

const PersonalizedOfferSuggestionsOutputSchema = z.object({
  offers: z.array(z.object({
    title: z.string(),
    description: z.string(),
    discount: z.string(),
    validUntil: z.string(),
  })),
});
export type PersonalizedOfferSuggestionsOutput = z.infer<typeof PersonalizedOfferSuggestionsOutputSchema>;

const fallbackOffers: PersonalizedOfferSuggestionsOutput = {
  offers: [
    {
      title: "First Order Special",
      description: "Enjoy a premium 50% discount on your very first order with us.",
      discount: "50% OFF",
      validUntil: "2025-12-31"
    },
    {
      title: "Weekend Gourmet Feast",
      description: "Make your weekends special with our curated family meal combos.",
      discount: "₹200 OFF",
      validUntil: "2025-12-31"
    },
    {
      title: "Midnight Cravings",
      description: "Ordering late? Get a complimentary dessert with every burger meal.",
      discount: "FREE DESSERT",
      validUntil: "2025-12-31"
    }
  ]
};

export async function getPersonalizedOfferSuggestions(input: PersonalizedOfferSuggestionsInput): Promise<PersonalizedOfferSuggestionsOutput> {
  // Static Build Check: If in browser, use fallbacks to avoid Server Actions error
  if (typeof window !== 'undefined') {
    return fallbackOffers;
  }
  
  try {
    return await personalizedOfferSuggestionsFlow(input);
  } catch (error) {
    console.error("GenAI Service Busy, using fallback offers:", error);
    return fallbackOffers;
  }
}

const offerSuggestionPrompt = ai.definePrompt({
  name: 'personalizedOfferSuggestionPrompt',
  input: { schema: PersonalizedOfferSuggestionsInputSchema },
  output: { schema: PersonalizedOfferSuggestionsOutputSchema },
  prompt: `You are an AI assistant for ShopyKart. Generate 3-5 personalized food offers for:
User: {{{userId}}}
Orders: {{{pastOrdersSummary}}}
Browsing: {{{browsingHistorySummary}}}
Ensure validUntil is a future date.`,
});

const personalizedOfferSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedOfferSuggestionsFlow',
    inputSchema: PersonalizedOfferSuggestionsInputSchema,
    outputSchema: PersonalizedOfferSuggestionsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await offerSuggestionPrompt(input);
      return output || fallbackOffers;
    } catch (e) {
      return fallbackOffers;
    }
  }
);
