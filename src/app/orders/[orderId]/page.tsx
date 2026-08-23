import { Suspense } from 'react';
import OrderDetailsClient from '@/components/orders/OrderDetailsClient';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Dynamic route for order tracking.
 * Strictly configured for Next.js static export with generateStaticParams.
 */

export async function generateStaticParams() {
  // During static export, we don't have IDs at build time.
  // Return an empty array to allow the build to proceed.
  return [];
}

export const dynamicParams = false;

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Connecting to Delivery Network...</p>
        </div>
      </div>
    }>
      <OrderDetailsClient forcedId={orderId} />
    </Suspense>
  );
}
