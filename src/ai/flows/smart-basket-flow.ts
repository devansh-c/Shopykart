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

const fallbackData: SmartBasketOutput = {
  recipeTitle: "Chef's Special Preparation",
  steps: [
    "Prepare the fresh ingredients by washing and chopping them neatly.",
    "Heat oil or butter in a pan and sauté the base spices.",
    "Add your main ingredients and cook on medium flame for 15-20 minutes.",
    "Garnish with fresh herbs and serve hot with bread or rice."
  ],
  ingredients: ["Main Ingredient", "Cooking Oil", "Signature Spices", "Fresh Herbs"],
  shoppingList: ["Cooking Oil", "Spices", "Fresh Vegetables", "Dairy Products"]
};

export async function getSmartBasketDetails(input: SmartBasketInput): Promise<SmartBasketOutput> {
  try {
    return await smartBasketFlow(input);
  } catch (error) {
    console.error("AI Service busy, providing fallback basket for:", input.dishName);
    return {
      ...fallbackData,
      recipeTitle: `ShopyKart ${input.dishName} Basket`
    };
  }
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
    return output || fallbackData;
  }
);
