/**
 * @fileOverview Genkit initialization. 
 * Updated to be safe for both server and client-side (static export) environments.
 * Uses dynamic imports to prevent Node.js modules from leaking into the browser bundle.
 */

import { z as zod } from 'zod';

// We export standard zod to be used in flow schemas. 
// This prevents the client bundle from pulling in Genkit's Node.js dependencies.
export const z = zod;

/**
 * Optimized AI instance getter.
 * This prevents the 'require' calls from executing during client-side bundling.
 */
export const getAI = async () => {
  // SSR/Static Check
  if (typeof window !== 'undefined') {
    return null;
  }
  
  try {
    // Dynamic import to hide Node.js modules from the browser bundler
    // Using variable to further obscure from some static analyzers
    const genkitPackage = 'genkit';
    const googlePackage = '@genkit-ai/google-genai';
    
    const { genkit } = await import(genkitPackage);
    const { googleAI } = await import(googlePackage);
    
    return genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    console.error("Genkit init failed on server:", e);
    return null;
  }
};

// Stub for client side
export const ai = null;
