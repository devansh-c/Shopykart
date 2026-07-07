
/**
 * @fileOverview Genkit initialization. 
 * Optimized for both server and client-side (static export) environments.
 * Uses a robust check to prevent Node.js modules from leaking into the browser bundle.
 */

import { z as zod } from 'zod';

// We export standard zod to be used in flow schemas. 
// This prevents the client bundle from pulling in Genkit's Node.js dependencies.
export const z = zod;

/**
 * Optimized AI instance getter.
 * This prevents bundling errors during client-side compilation for static export.
 */
export const getAI = async () => {
  // SSR/Static Check: Skip initialization in the browser environment
  if (typeof window !== 'undefined') {
    return null;
  }
  
  try {
    // Using a more robust way to import Node-only modules that Next.js/Webpack will ignore on the client
    const genkitModule = await import('genkit').catch(() => null);
    const googleAIModule = await import('@genkit-ai/google-genai').catch(() => null);
    
    if (!genkitModule || !googleAIModule) return null;

    const { genkit } = genkitModule;
    const { googleAI } = googleAIModule;
    
    return genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    console.debug("Genkit init bypassed on client or failed on server");
    return null;
  }
};

// Stub for client side
export const ai = null;
