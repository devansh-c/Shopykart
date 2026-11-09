import React, { Suspense } from 'react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'error';
export const dynamicParams = false;

// Sabhi possible static slugs pre-render
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

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolved = await params;
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div></div>}>
      <MenuContent forcedSlug={resolved.slug} />
    </Suspense>
  );
}
