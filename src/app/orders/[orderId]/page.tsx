import { Suspense } from 'react';
import OrderDetailsClient from '@/components/orders/OrderDetailsClient';
import { Loader2 } from 'lucide-react';

/**
 * generateStaticParams is required for Next.js static export with dynamic routes.
 * We return an empty array because IDs are fetched on the client side.
 */
export const generateStaticParams = async () => {
  return [];
};

/**
 * dynamicParams = false ensures Next.js doesn't try to dynamically render routes
 * not returned by generateStaticParams at build time.
 */
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
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Connecting to Network...</p>
        </div>
      </div>
    }>
      <OrderDetailsClient forcedId={orderId} />
    </Suspense>
  );
}
