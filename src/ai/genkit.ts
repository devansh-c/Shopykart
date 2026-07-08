
/**
 * @fileOverview Genkit initialization. 
 * Optimized for both server and client-side (static export) environments.
 * Uses webpackIgnore to prevent Node.js modules from leaking into the browser bundle.
 */

import { z as zod } from 'zod';

// We export standard zod to be used in flow schemas. 
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
    // Using webpackIgnore to tell Next.js/Turbopack to skip these in the client bundle
    // @ts-ignore
    const genkitModule = await import(/* webpackIgnore: true */ 'genkit').catch(() => null);
    // @ts-ignore
    const googleAIModule = await import(/* webpackIgnore: true */ '@genkit-ai/google-genai').catch(() => null);
    
    if (!genkitModule || !googleAIModule) return null;

    const { genkit } = genkitModule;
    const { googleAI } = googleAIModule;
    
    return genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    return null;
  }
};

// Stub for client side
export const ai = null;
