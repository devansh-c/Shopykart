import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Optimized Product Page for Static Export.
 * Providing valid shells for dynamic client-side resolution.
 */
export async function generateStaticParams() {
  return [
    { slug: 'view' },
    { slug: 'details' },
    { slug: 'item' }
  ];
}

export default async function ProductPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  return (
    <Suspense fallback={
      <div style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}>
        <Loader2 style={{ width: '40px', height: '40px', animation: 'spin 1s linear infinite', color: '#EF4444' }} />
        <p style={{ fontSize: '10px', fontWeight: '900', marginTop: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Loading Gourmet Details...</p>
      </div>
    }>
      <ProductDetailsClient forcedSlug={slug} />
    </Suspense>
  );
}
