/**
 * @fileOverview Genkit initialization. 
 * Updated to be safe for both server and client-side (static export) environments.
 */

import { z as zod } from 'zod';

// We export standard zod to be used in flow schemas. 
// This prevents the client bundle from pulling in Genkit's Node.js dependencies.
export const z = zod;

/**
 * Optimized AI instance getter.
 * This prevents the 'require' calls from executing during client-side bundling
 * or during static analysis which causes "Internal Server Error".
 */
export const getAI = () => {
  if (typeof window !== 'undefined') {
    return {} as any;
  }
  
  try {
    const { genkit } = require('genkit');
    const { googleAI } = require('@genkit-ai/google-genai');
    
    return genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    console.error("Genkit init failed on server:", e);
    return {} as any;
  }
};

// Legacy export for compatibility, though getAI() is preferred
export const ai = typeof window !== 'undefined' ? ({} as any) : null;
