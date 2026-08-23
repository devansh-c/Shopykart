/**
 * @fileOverview Genkit initialization. 
 * Optimized for both server and client-side (static export) environments.
 * Uses dynamic imports with webpackIgnore to prevent Node.js modules from leaking into the browser bundle.
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
    // Dynamically importing Genkit on server-side only with webpackIgnore
    // This prevents the bundler from trying to resolve these Node.js-only modules.
    const genkitModule = await import(/* webpackIgnore: true */ 'genkit');
    const googleAIModule = await import(/* webpackIgnore: true */ '@genkit-ai/google-genai');
    
    if (!genkitModule || !googleAIModule) return null;

    const { genkit } = genkitModule;
    const { googleAI } = googleAIModule;
    
    return genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    console.error("Genkit initialization failed:", e);
    return null;
  }
};

// Stub for client side
export const ai = null;
