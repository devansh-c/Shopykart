'use server';
/**
 * @fileOverview AI Flow for bulk menu extraction and image generation.
 * - extractAndGenerateMenu - Extracts items from photo and generates AI visuals.
 */

import { z } from 'zod';

const MenuExtractionInputSchema = z.object({
  photoDataUri: z.string().describe("Base64 data URI of the menu card image."),
  vendorCategory: z.string().default('Food'),
});

const MenuExtractionOutputSchema = z.object({
  items: z.array(z.object({
    name: z.string().describe("Name of the product."),
    price: z.number().describe("Price of the product."),
    description: z.string().describe("A 1-line catchy description."),
    category: z.string().describe("Menu category like 'Snacks', 'Main Course', etc."),
    imageUrl: z.string().describe("AI Generated Image Data URI."),
  })),
});

export type MenuExtractionOutput = z.infer<typeof MenuExtractionOutputSchema>;

/**
 * Extracts menu items from an image and generates professional AI images for each.
 */
export async function extractAndGenerateMenu(input: { photoDataUri: string, vendorCategory: string }): Promise<MenuExtractionOutput> {
  const fallback: MenuExtractionOutput = { items: [] };
  
  if (typeof window !== 'undefined') return fallback;

  try {
    const { getAI } = await import('@/ai/genkit');
    const ai = await getAI();
    if (!ai) return fallback;

    // 1. Extract Data from Menu Card
    const extractionPrompt = ai.definePrompt({
      name: 'extractMenuData',
      input: { schema: MenuExtractionInputSchema },
      output: { schema: z.object({ items: z.array(z.object({ name: z.string(), price: z.number(), category: z.string() })) }) },
      prompt: `Identify all items and their prices from this menu card image. 
      If it's a ${input.vendorCategory} menu, list the top 5-7 most important items.
      Image: {{media url=photoDataUri}}`,
    });

    const { output: extracted } = await extractionPrompt(input);
    if (!extracted || !extracted.items) return fallback;

    // 2. Generate Professional Images for each item using Imagen
    const finalItems = await Promise.all(extracted.items.map(async (item) => {
      try {
        const { media } = await ai.generate({
          model: 'googleai/imagen-4.0-fast-generate-001',
          prompt: `Gourmet professional high-end food photography of ${item.name}, ${item.category} style, studio lighting, top-down view, centered, white background, high resolution, 4k`,
        });

        return {
          name: item.name.toUpperCase(),
          price: item.price,
          description: `Freshly prepared ${item.name} from our gourmet kitchen.`,
          category: item.category.toUpperCase(),
          imageUrl: media?.url || `https://picsum.photos/seed/${item.name}/400/400`,
        };
      } catch (e) {
        return {
          name: item.name.toUpperCase(),
          price: item.price,
          description: `Signature selection.`,
          category: item.category.toUpperCase(),
          imageUrl: `https://picsum.photos/seed/${item.name}/400/400`,
        };
      }
    }));

    return { items: finalItems };
  } catch (error) {
    console.error("AI Menu Extraction failed:", error);
    return fallback;
  }
}
