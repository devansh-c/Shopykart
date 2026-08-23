/**
 * @fileOverview Welcome Email AI flow for ShopyKart.
 * Generates a premium welcome message for new customers.
 */

import { z } from 'zod';

const WelcomeEmailInputSchema = z.object({
  userName: z.string().describe('The name of the new customer.'),
  email: z.string().describe('The email address of the customer.'),
});
export type WelcomeEmailInput = z.infer<typeof WelcomeEmailInputSchema>;

const WelcomeEmailOutputSchema = z.object({
  subject: z.string().describe('The subject line of the email.'),
  body: z.string().describe('The main content of the welcome email.'),
});
export type WelcomeEmailOutput = z.infer<typeof WelcomeEmailOutputSchema>;

/**
 * Generates a welcome email.
 * In a static/browser environment, returns a standard message.
 */
export async function generateWelcomeEmail(input: WelcomeEmailInput): Promise<WelcomeEmailOutput> {
  const fallback = {
    subject: `Welcome to ShopyKart, ${input.userName}! 🎁`,
    body: `Hi ${input.userName},\n\nWelcome to ShopyKart! We are thrilled to have you as part of our premium gourmet community. As a welcome gift, we've added 10 bonus coins to your account.\n\nStart exploring the best flavors in town!\n\nBest regards,\nThe ShopyKart Team`
  };

  if (typeof window !== 'undefined') {
    return fallback;
  }

  try {
    const { getAI } = await import('@/ai/genkit');
    const ai = await getAI();

    if (!ai || !ai.definePrompt) return fallback;

    const welcomePrompt = ai.definePrompt({
      name: 'welcomeEmailPrompt',
      input: { schema: WelcomeEmailInputSchema },
      output: { schema: WelcomeEmailOutputSchema },
      prompt: `You are the CEO of ShopyKart, a premium gourmet food delivery service. 
      Write a warm, luxury-toned welcome email to a new customer named {{{userName}}}.
      
      Requirements:
      1. Subject should be catchy and include a gift emoji.
      2. Mention the "10 Welcome Coins" added to their wallet.
      3. Keep the tone sophisticated yet friendly.
      4. Sign off as "The ShopyKart CEO Team".`,
    });

    const { output } = await welcomePrompt(input);
    return output || fallback;
  } catch (error) {
    console.error("AI Welcome Email generation failed:", error);
    return fallback;
  }
}
