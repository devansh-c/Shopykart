'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating personalized food offers and promotions.
 *
 * - getPersonalizedOfferSuggestions - A function that fetches personalized offers for a given user.
 * - PersonalizedOfferSuggestionsInput - The input type for the getPersonalizedOfferSuggestions function.
 * - PersonalizedOfferSuggestionsOutput - The return type for the getPersonalizedOfferSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedOfferSuggestionsInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting personalized offers.'),
  pastOrdersSummary: z.string().describe('A summarized history of the user\'s past food orders, e.g., "Ordered pizza frequently, also ordered sushi and pasta once."'),
  browsingHistorySummary: z.string().describe('A summarized history of the user\'s recent browsing behavior, e.g., "Viewed burger menus, often looked at dessert sections."'),
});
export type PersonalizedOfferSuggestionsInput = z.infer<typeof PersonalizedOfferSuggestionsInputSchema>;

const PersonalizedOfferSuggestionsOutputSchema = z.object({
  offers: z.array(z.object({
    title: z.string().describe('The title of the offer, e.g., "20% off Pizza"'),
    description: z.string().describe('A short description of the offer, e.g., "Enjoy a 20% discount on all large pizzas."'),
    discount: z.string().describe('The discount value or promotion type, e.g., "20% off", "Buy one get one free", "Free delivery"'),
    validUntil: z.string().describe('The expiration date of the offer in YYYY-MM-DD format (e.g., 2024-12-31). This must always be a future date.'),
  })).describe('A list of personalized food offers and promotions.'),
});
export type PersonalizedOfferSuggestionsOutput = z.infer<typeof PersonalizedOfferSuggestionsOutputSchema>;

export async function getPersonalizedOfferSuggestions(input: PersonalizedOfferSuggestionsInput): Promise<PersonalizedOfferSuggestionsOutput> {
  return personalizedOfferSuggestionsFlow(input);
}

const offerSuggestionPrompt = ai.definePrompt({
  name: 'personalizedOfferSuggestionPrompt',
  input: { schema: PersonalizedOfferSuggestionsInputSchema },
  output: { schema: PersonalizedOfferSuggestionsOutputSchema },
  prompt: `You are an AI assistant for a food delivery app called FeastFlow. Your task is to generate personalized food offers and promotions for a user based on their past orders and browsing history. The offers should be appealing, relevant, and in line with typical food delivery promotions. Ensure the output is a JSON object matching the provided schema.

User ID: {{{userId}}}
Past Orders Summary: {{{pastOrdersSummary}}}
Browsing History Summary: {{{browsingHistorySummary}}}

Generate 3-5 distinct offers. Ensure that "validUntil" is always a future date in YYYY-MM-DD format.`,
});

const personalizedOfferSuggestionsFlow = ai.defineFlow(
  {
    name: 'personalizedOfferSuggestionsFlow',
    inputSchema: PersonalizedOfferSuggestionsInputSchema,
    outputSchema: PersonalizedOfferSuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await offerSuggestionPrompt(input);
    return output!;
  }
);
