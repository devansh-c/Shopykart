
import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

/**
 * @fileOverview Consolidated SEO Route: /product/[slug]
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
    title: `${slug.replace(/-/g, ' ').toUpperCase()} | ShopyKart`,
    description: 'Order premium gourmet food from ShopyKart. Professional delivery in your city.',
    openGraph: {
      title: 'Premium Gourmet Product | ShopyKart',
      images: [`https://picsum.photos/seed/${slug}/800/600`],
    },
  };
}

export default function ProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <ProductDetailsClient />
    </Suspense>
  );
}
