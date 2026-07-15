import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve dynamic route conflict in Next.js 15.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function LegacyStoreRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/store/${storeId}/`);
  return null;
}
