import { Suspense } from 'react';
import StaticPageView from '@/components/shared/StaticPageView';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';
import { useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { extractIdFromSlug } from '@/lib/utils';
import { initializeFirebase } from '@/firebase/init';

/**
 * @fileOverview SEO Friendly route for Policy and Information pages.
 * Optimized for dynamic metadata and search engine indexing.
 */

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = true;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  const pageId = rawId.includes('-') ? extractIdFromSlug(rawId) : rawId;

  // We perform a server-side fetch attempt if possible, or fallback to generic
  return {
    title: 'Information | ShopyKart',
    description: 'Read ShopyKart policies, terms of service, and company information.',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    }
  };
}

export default async function GenericPage({ params }: Props) {
  const resolvedParams = await params;
  const rawId = resolvedParams.id;
  // Handle both legacy IDs and new SEO slugs
  const pageId = rawId.includes('-') ? extractIdFromSlug(rawId) : rawId;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StaticPageView forcedId={pageId} />
    </Suspense>
  );
}
