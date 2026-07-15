/**
 * @fileOverview Neutralized to resolve dynamic route conflicts in Next.js 15.
 * All store routing is now handled by src/app/store/[slug]/page.tsx.
 */
import { redirect } from 'next/navigation';

export default async function NeutralizedStorePage() {
  // This route is purely a placeholder to prevent folder structure conflicts.
  return null;
}
