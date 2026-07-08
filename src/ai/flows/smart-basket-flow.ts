/**
 * @fileOverview Smart Basket AI flow to generate recipes and suggested shopping lists.
 * Optimized for Static Export: Removed top-level Genkit imports to prevent build errors in APK.
 */

import { z } from 'zod';

const SmartBasketInputSchema = z.object({
  dishName: z.string().describe('The name of the dish the user wants to cook.'),
});
export type SmartBasketInput = z.infer<typeof SmartBasketInputSchema>;

const SmartBasketOutputSchema = z.object({
  recipeTitle: z.string().describe('A catchy, chef-style title for the recipe.'),
  steps: z.array(z.string()).describe('Step by step professional cooking instructions.'),
  ingredients: z.array(z.string()).describe('Comprehensive list of raw ingredients needed.'),
  shoppingList: z.array(z.string()).describe('Specific keywords of products to buy from ShopyKart (e.g., "Amul Butter", "Everest Garam Masala", "Tata Salt").'),
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

/**
 * Gets smart basket details.
 * In a static APK environment, returns fallback data to prevent Node.js dependency errors.
 */
export async function getSmartBasketDetails(input: SmartBasketInput): Promise<SmartBasketOutput> {
  // Browser/APK check: Return fallbacks immediately
  if (typeof window !== 'undefined') {
    return {
      ...fallbackData,
      recipeTitle: `ShopyKart ${input.dishName} Special`,
      shoppingList: [`Fresh ${input.dishName} Base`, "Amul Butter", "Everest Spices", "Organic Veggies"]
    };
  }

  try {
    // Dynamic import to hide Genkit from the client-side bundler
    const { getAI } = await import('@/ai/genkit');
    const ai = await getAI();

    if (!ai || !ai.definePrompt) return fallbackData;

    const smartBasketPrompt = ai.definePrompt({
      name: 'smartBasketPrompt',
      input: {schema: SmartBasketInputSchema},
      output: {schema: SmartBasketOutputSchema},
      system: `You are the "ShopyKart Master Chef", an AI specialized in Indian and global cuisines.
    Your expertise lies in breaking down complex dishes into simple, home-cookable steps.
    You also understand the Indian grocery market perfectly and know exactly which brands (like Amul, Everest, MDH, Tata Salt, Daawat Basmati) are best for each dish.`,
      prompt: `The user wants to prepare: "{{{dishName}}}".
    
    As an expert chef, provide a high-quality guide.
    
    1. **Recipe Title**: Give it a professional name (e.g., "Restaurant Style Paneer Butter Masala").
    2. **Ingredients**: List everything needed including spices and small details.
    3. **Cooking Steps**: Write 4-6 clear, numbered steps. Use culinary terms but keep it simple.
    4. **ShopyKart Shopping List**: This is crucial. Suggest 4-6 specific items the user should buy from our app. 
       - Instead of just "Butter", say "Amul Salted Butter".
       - Instead of "Spices", say "Everest Tikhalal" or "MDH Kitchen King".
       - Instead of "Rice", say "Daawat Rozana Basmati".
    
    Make sure the shopping list items are things a user can actually find in a high-end Indian grocery store.`,
    });

    const { output } = await smartBasketPrompt(input);
    return output || fallbackData;
  } catch (error) {
    console.error("AI Service busy, using fallback for:", input.dishName);
    return fallbackData;
  }
}
