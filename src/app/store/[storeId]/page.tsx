import { redirect } from 'next/navigation';

/**
 * @fileOverview Redundant dynamic segment neutralized to resolve Next.js 15 Turbopack conflict.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function NeutralizedStoreRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/store/${storeId}/`);
  return null;
}
