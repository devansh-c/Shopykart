
/**
 * @fileOverview Genkit initialization. 
 * Updated to be safe for both server and client-side (static export) environments.
 * Uses dynamic imports with webpackIgnore to prevent Node.js modules from leaking into the browser bundle.
 */

import { z as zod } from 'zod';

// We export standard zod to be used in flow schemas. 
// This prevents the client bundle from pulling in Genkit's Node.js dependencies.
export const z = zod;

/**
 * Optimized AI instance getter.
 * This prevents the 'require' or 'import' calls from triggering bundling errors during client-side compilation.
 */
export const getAI = async () => {
  // SSR/Static Check: Skip initialization in the browser/APK environment
  if (typeof window !== 'undefined') {
    return null;
  }
  
  try {
    // Use webpackIgnore to prevent Webpack from attempting to bundle these Node-only modules
    // during the client-side build process for static export.
    // Also use try/catch to gracefully handle environments where these aren't available.
    const genkitModule = await import(/* webpackIgnore: true */ 'genkit');
    const googleAIModule = await import(/* webpackIgnore: true */ '@genkit-ai/google-genai');
    
    const { genkit } = genkitModule;
    const { googleAI } = googleAIModule;
    
    return genkit({
      plugins: [googleAI()],
      model: 'googleai/gemini-2.5-flash',
    });
  } catch (e) {
    console.debug("Genkit init bypassed on client or failed on server:", e);
    return null;
  }
};

// Stub for client side
export const ai = null;
