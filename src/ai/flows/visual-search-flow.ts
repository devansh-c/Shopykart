/**
 * @fileOverview This file defines a Genkit flow for identifying food items from a photo.
 * Updated for Static Export compatibility: Removed 'use server' and returns fallbacks in browser.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VisualSearchInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a food item as a data URI."),
});
export type VisualSearchInput = z.infer<typeof VisualSearchInputSchema>;

const VisualSearchOutputSchema = z.object({
  identifiedFood: z.string().describe('The name of the food identified in the image.'),
});
export type VisualSearchOutput = z.infer<typeof VisualSearchOutputSchema>;

export async function identifyFood(input: VisualSearchInput): Promise<VisualSearchOutput> {
  // Browser check: Genkit flows require a server environment.
  if (typeof window !== 'undefined') {
    return { identifiedFood: "Food Item" };
  }
  
  try {
    return await visualSearchFlow(input);
  } catch (error) {
    return { identifiedFood: "Food Item" };
  }
}

const visualSearchPrompt = ai.definePrompt({
  name: 'visualSearchPrompt',
  input: { schema: VisualSearchInputSchema },
  output: { schema: VisualSearchOutputSchema },
  prompt: `Identify the main food item in this image. Return only the name of the food item (e.g., "Burger", "Pizza", "Pasta", "Fries"). Be concise.

Image: {{media url=photoDataUri}}`,
});

const visualSearchFlow = ai.defineFlow(
  {
    name: 'visualSearchFlow',
    inputSchema: VisualSearchInputSchema,
    outputSchema: VisualSearchOutputSchema,
  },
  async (input) => {
    const { output } = await visualSearchPrompt(input);
    return output!;
  }
);
