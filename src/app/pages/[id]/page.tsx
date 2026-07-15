import { redirect } from 'next/navigation';

/**
 * @fileOverview Redirect segment neutralized to resolve Next.js dynamic routing conflict.
 * Consolidates logic into the [slug] route to fix 'id' !== 'slug' error.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function RedundantPagesRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/pages/${id}/`);
  return null;
}
