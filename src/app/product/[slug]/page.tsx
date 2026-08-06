import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

export const generateStaticParams = async () => {
  return [];
};

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cleanTitle = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  return {
    title: `${cleanTitle} | Buy Online at ShopyKart`,
    description: `Order ${cleanTitle} online from ShopyKart. Freshly prepared and delivered in 10 minutes.`
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <ProductDetailsClient forcedSlug={slug} />
    </Suspense>
  );
}
