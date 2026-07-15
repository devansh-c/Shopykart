
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';
import type { Metadata } from 'next';

/**
 * @fileOverview Consolidated SEO Route: /store/[slug]
 * Handles both legacy IDs and new SEO-friendly slugs.
 */

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;

  return {
    title: `${slug.replace(/-/g, ' ').toUpperCase()} | ShopyKart Store`,
    description: 'Explore menu and order live from our premium partners.',
    robots: { index: true, follow: true }
  };
}

export default function StorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}
