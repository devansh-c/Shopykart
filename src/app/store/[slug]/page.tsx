
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';
import type { Metadata } from 'next';

/**
 * @fileOverview Universal SEO Route for Stores.
 * Handles both legacy IDs and new descriptive slugs.
 * Consolidated to prevent "Internal Server Error" caused by route conflicts.
 */

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const cleanTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    title: `${cleanTitle} | ShopyKart Store`,
    description: 'Explore our curated menu and order live from premium local partners.',
    robots: { index: true, follow: true }
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <MenuContent forcedSlug={slug} />
    </Suspense>
  );
}
