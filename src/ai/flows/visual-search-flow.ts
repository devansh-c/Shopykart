/**
 * @fileOverview This file defines a Genkit flow for identifying food items from a photo.
 * Optimized for Static Export: Removed top-level Genkit imports to prevent build errors in APK.
 */

import { z } from '@/ai/genkit';

const VisualSearchInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a food item as a data URI."),
});
export type VisualSearchInput = z.infer<typeof VisualSearchInputSchema>;

const VisualSearchOutputSchema = z.object({
  identifiedFood: z.string().describe('The name of the food identified in the image.'),
});
export type VisualSearchOutput = z.infer<typeof VisualSearchOutputSchema>;

/**
 * Identifies food from an image. 
 * In a static APK environment, returns a fallback to prevent Node.js dependency errors.
 */
export async function identifyFood(input: VisualSearchInput): Promise<VisualSearchOutput> {
  // Browser/APK check: Return fallback immediately
  if (typeof window !== 'undefined') {
    return { identifiedFood: "Food Item" };
  }
  
  try {
    // Dynamic import to hide Genkit from the client-side bundler
    const { getAI } = await import('@/ai/genkit');
    const ai = getAI();

    if (!ai || !ai.definePrompt) return { identifiedFood: "Food Item" };
    
    const visualSearchPrompt = ai.definePrompt({
      name: 'visualSearchPrompt',
      input: { schema: VisualSearchInputSchema },
      output: { schema: VisualSearchOutputSchema },
      prompt: `Identify the main food item in this image. Return only the name of the food item (e.g., "Burger", "Pizza", "Pasta", "Fries"). Be concise.
    
    Image: {{media url=photoDataUri}}`,
    });

    const { output } = await visualSearchPrompt(input);
    return output || { identifiedFood: "Food Item" };
  } catch (error) {
    console.error("AI Identification failed:", error);
    return { identifiedFood: "Food Item" };
  }
}
