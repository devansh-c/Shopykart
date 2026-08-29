
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';
import type { Metadata } from 'next';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Static export compatibility for store routes.
 */
export async function generateStaticParams() {
  return [{ slug: 'default' }];
}

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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Opening Store Hub...</p>
        </div>
      </div>
    }>
      <MenuContent forcedSlug={slug} />
    </Suspense>
  );
}
