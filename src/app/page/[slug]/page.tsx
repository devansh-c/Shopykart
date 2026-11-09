import { Suspense } from 'react';
import StaticPageView from '@/components/shared/StaticPageView';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Static export shell for Policy Pages.
 */
export async function generateStaticParams() {
  return [
    { slug: 'view' },
    { slug: 'cancellation-policy' },
    { slug: 'terms-and-conditions' },
    { slug: 'privacy-policy' },
    { slug: 'return-policy' }
  ];
}

export default async function GenericPage(props: { params: Promise<{ slug: string }> }) {
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
        <p style={{ fontSize: '10px', fontWeight: '900', marginTop: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>Retrieving Information...</p>
      </div>
    }>
      <StaticPageView forcedSlug={slug} />
    </Suspense>
  );
}
