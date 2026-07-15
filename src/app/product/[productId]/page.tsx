import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect segment neutralized to resolve Next.js dynamic routing conflict.
 * Consolidates logic into the [slug] route to fix 'productId' !== 'slug' error.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantProductRedirect({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  redirect(`/product/${productId}/`);
  return null;
}
