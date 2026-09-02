import { Suspense } from 'react';
import OrderDetailsClient from '@/components/orders/OrderDetailsClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';

/**
 * @fileOverview Dynamic order page with static export compatibility.
 */
export async function generateStaticParams() {
  // Providing a placeholder to satisfy the build requirement
  return [{ orderId: 'tracking' }];
}

export default async function OrderPage(props: {
  params: Promise<{ orderId: string }>;
}) {
  const params = await props.params;
  const orderId = params.orderId;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Connecting to Delivery Network...</p>
        </div>
      </div>
    }>
      <OrderDetailsClient forcedId={orderId === 'tracking' ? undefined : orderId} />
    </Suspense>
  );
}
