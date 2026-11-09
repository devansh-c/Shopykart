import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Optimized Store Page for Static Export.
 * Standardizes generateStaticParams to return a valid 'view' shell.
 */
export async function generateStaticParams() {
  return [
    { slug: 'view' },
    { slug: 'hub' },
    { slug: 'details' }
  ];
}

export default async function StorePage(props: { params: Promise<{ slug: string }> }) {
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
        <p style={{ fontSize: '10px', fontWeight: '900', marginTop: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Opening Store Hub...</p>
      </div>
    }>
      <MenuContent forcedSlug={slug} />
    </Suspense>
  );
}
