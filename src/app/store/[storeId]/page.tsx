/**
 * @fileOverview Route Neutralized.
 * This file is kept to resolve file-system dynamic segment conflicts in Next.js 15.
 * All logic has been migrated to src/app/store/[slug]/page.tsx.
 */
import { redirect } from 'next/navigation';

export default async function NeutralizedStorePage({ params }: { params: Promise<{ storeId: string }> }) {
  const resolvedParams = await params;
  redirect(`/store/${resolvedParams.storeId}`);
  return null;
}
