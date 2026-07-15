import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect segment neutralized to resolve Next.js dynamic routing conflict.
 * Consolidates logic into the [slug] route to fix 'storeId' !== 'slug' error.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantStoreRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/store/${storeId}/`);
  return null;
}
