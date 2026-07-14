import { Suspense } from 'react';
import StaticPageView from '@/components/shared/StaticPageView';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

/**
 * @fileOverview SEO Friendly route for Policy and Information pages.
 */

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  return {
    title: 'Information | ShopyKart',
    description: 'Read ShopyKart policies, terms of service, and company information.',
    robots: {
      index: true,
      follow: true,
    }
  };
}

export default async function GenericPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StaticPageView forcedId={resolvedParams.id} />
    </Suspense>
  );
}
