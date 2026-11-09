import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import MenuContent from '@/components/menu/MenuContent';

export const dynamic = 'error';
export const dynamicParams = false;

// Pre-render static paths for APK
export async function generateStaticParams() {
  return [
    { slug: 'view' },
    { slug: 'hub' },
    { slug: 'details' },
    { slug: 'hotel-bellevue' },
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
  const resolved = await params;
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-white">
          <Loader2 className="w-10 h-10 animate-spin text-red-500" />
          <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-500">
            Syncing with Store Hub...
          </p>
        </div>
      }
    >
      <MenuContent forcedSlug={resolved.slug} />
    </Suspense>
  );
}
