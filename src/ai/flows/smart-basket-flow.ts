'use server';
/**
 * @fileOverview Smart Basket AI flow to generate recipes and suggested shopping lists.
 * 
 * - smartBasketFlow - Handles the recipe and ingredient generation.
 * - SmartBasketInput - The input dish name.
 * - SmartBasketOutput - Structured recipe and shopping list.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartBasketInputSchema = z.object({
  dishName: z.string().describe('The name of the dish the user wants to cook.'),
});
export type SmartBasketInput = z.infer<typeof SmartBasketInputSchema>;

const SmartBasketOutputSchema = z.object({
  recipeTitle: z.string(),
  steps: z.array(z.string()).describe('Step by step cooking instructions.'),
  ingredients: z.array(z.string()).describe('List of raw ingredients needed.'),
  shoppingList: z.array(z.string()).describe('Keywords of products to buy from ShopyKart (e.g., "Butter", "Paneer", "Milk").'),
});
export type SmartBasketOutput = z.infer<typeof SmartBasketOutputSchema>;

export async function getSmartBasketDetails(input: SmartBasketInput): Promise<SmartBasketOutput> {
  return smartBasketFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartBasketPrompt',
  input: {schema: SmartBasketInputSchema},
  output: {schema: SmartBasketOutputSchema},
  prompt: `You are the ShopyKart Chef AI. A user wants to cook "{{{dishName}}}" at home.
Provide a professional recipe and a precise shopping list of ingredients they should buy from our store.

Ensure the shopping list includes common grocery items available in local Indian stores.`,
});

const smartBasketFlow = ai.defineFlow(
  {
    name: 'smartBasketFlow',
    inputSchema: SmartBasketInputSchema,
    outputSchema: SmartBasketOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
