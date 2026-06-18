
import OrderDetailsClient from '@/components/orders/OrderDetailsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Server Component wrapper for Order tracking.
 * Corrected naming and async param handling to prevent ISE.
 */

export async function generateStaticParams() {
  return [
    { orderId: 'track-order' },
    { orderId: 'active-status' }
  ];
}

export const dynamic = 'force-static';
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDynamicPage({ params }: PageProps) {
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
