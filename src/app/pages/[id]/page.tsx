/**
 * @fileOverview Route Neutralized.
 * This file is kept to resolve file-system dynamic segment conflicts in Next.js 15.
 * All logic has been migrated to src/app/page/[slug]/page.tsx.
 */
import { redirect } from 'next/navigation';

export default async function NeutralizedPagesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  redirect(`/page/${resolvedParams.id}`);
  return null;
}
