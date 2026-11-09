'use client';

import React, { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

function StoreView() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  // URL params ya search query se slug/storeId nikalna
  const rawSlug = params?.slug as string;
  const querySlug = searchParams?.get('slug') || searchParams?.get('storeId') || searchParams?.get('id');
  const activeSlug = (rawSlug && rawSlug !== 'view' && rawSlug !== 'hub') ? rawSlug : (querySlug || rawSlug);

  return <MenuContent forcedSlug={activeSlug} />;
}

export default function StorePage() {
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
      <StoreView />
    </Suspense>
  );
}
