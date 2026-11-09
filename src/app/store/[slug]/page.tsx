import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'error';
export const dynamicParams = false;

export async function generateStaticParams() {
  return [
    { slug: 'view' },
    { slug: 'hub' },
    { slug: 'details' },
    { slug: 'mr-burger' },
    { slug: 'saurabh-sweet-house' },
    { slug: 'chauhan-sweets' },
    { slug: 'shopykart-store' },
    { slug: 'kashyap-food' },
    { slug: 'vishal-veg-appe' },
    { slug: 'indorri-adda' }
  ];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StorePage({ params }: PageProps) {
  const resolvedParams = await params;

  return (
    <Suspense
      fallback={
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
          <p style={{ fontSize: '10px', fontWeight: '900', marginTop: '20px', color: '#666', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Opening Store Hub...
          </p>
        </div>
      }
    >
      <MenuContent forcedSlug={resolvedParams.slug} />
    </Suspense>
  );
}
