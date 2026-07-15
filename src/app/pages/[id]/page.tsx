import { redirect } from 'next/navigation';

/**
 * @fileOverview Neutralized to resolve dynamic route conflicts.
 */

export const generateStaticParams = async () => {
  return [];
};

export default async function LegacyPageRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/page/${id}/`);
  return null;
}
