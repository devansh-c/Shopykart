
import { Suspense } from 'react';
import StaticPageView from '@/components/shared/StaticPageView';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

/**
 * @fileOverview Consolidated SEO Route: /page/[slug]
 * Handles all policy and information pages.
 */

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return {
    title: `${slug.replace(/-/g, ' ').toUpperCase()} | ShopyKart`,
    description: 'Read ShopyKart policies and official information.',
    robots: { index: true, follow: true }
  };
}

export default function GenericPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <StaticPageView />
    </Suspense>
  );
}
