import { redirect } from 'next/navigation';

/**
 * @fileOverview Redundant dynamic segment neutralized to resolve Next.js 15 Turbopack conflict.
 * All /store/* logic is now handled by src/app/store/[slug]/page.tsx.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantStoreRedirect({ params }: { params: any }) {
  const resolvedParams = await params;
  const id = resolvedParams.storeId;
  redirect(`/store/${id}/`);
  return null;
}
