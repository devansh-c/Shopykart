import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

/**
 * @fileOverview Universal SEO Route for Products.
 * Handles both Slugs and IDs to resolve routing conflicts.
 * Fixed for Next.js 15 Async Params to prevent 500 errors.
 */

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cleanTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return {
    title: `${cleanTitle} | Buy Online at ShopyKart`,
    description: `Order ${cleanTitle} online from ShopyKart. Freshly prepared, premium quality, and delivered in 10 minutes.`,
    alternates: {
      canonical: `https://shopykart.co.in/product/${slug}`,
    },
    openGraph: {
      title: `${cleanTitle} - ShopyKart Gourmet`,
      description: `Get fresh ${cleanTitle} delivered to your doorstep in 10 minutes.`,
      url: `https://shopykart.co.in/product/${slug}`,
      siteName: 'ShopyKart',
      images: [
        {
          url: `https://picsum.photos/seed/${slug}/800/600`,
          width: 800,
          height: 600,
          alt: cleanTitle,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Gourmet Details...</p>
        </div>
      </div>
    }>
      <ProductDetailsClient forcedSlug={slug} />
    </Suspense>
  );
}
