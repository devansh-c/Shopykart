/**
 * @fileOverview Genkit initialization. 
 * Updated to be safe for both server and client-side (static export) environments.
 */

import { z as zod } from 'zod';

// We export standard zod to be used in flow schemas. 
// This prevents the client bundle from pulling in Genkit's Node.js dependencies.
export const z = zod;

// We only import the actual Genkit engine if we are not in the browser.
export const ai = (typeof window !== 'undefined') 
  ? ({} as any) 
  : (() => {
      const { genkit } = require('genkit');
      const { googleAI } = require('@genkit-ai/google-genai');
      
      return genkit({
        plugins: [googleAI()],
        model: 'googleai/gemini-2.5-flash',
      });
    })();
