import OrderDetailsClient from '@/components/orders/OrderDetailsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Server Component wrapper for Order tracking.
 * Updated for Next.js 15: params must be awaited.
 */

export async function generateStaticParams() {
  // Return sample IDs to satisfy the build requirement for static export.
  return [
    { orderId: 'track' },
    { orderId: 'status' },
    { orderId: 'active' }
  ];
}

// Ensure the page is treated as static for the export process
export const dynamic = 'force-static';
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: PageProps) {
  const { orderId } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OrderDetailsClient forcedId={orderId} />
    </Suspense>
  );
}
