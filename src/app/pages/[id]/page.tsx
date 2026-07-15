/**
 * @fileOverview Neutralized to resolve dynamic route conflicts in Next.js 15.
 * All page routing is now handled by src/app/page/[slug]/page.tsx.
 */
import { redirect } from 'next/navigation';

export default async function NeutralizedPagesPage() {
  return null;
}
