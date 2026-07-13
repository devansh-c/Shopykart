import { Suspense } from 'react';
import OrderDetailsClient from '@/components/orders/OrderDetailsClient';
import { Loader2 } from 'lucide-react';

// For static export compatibility (APK build)
export const generateStaticParams = async () => {
  return [];
};

// Next.js 15: Use dynamicParams to allow on-demand generation without breaking static export
export const dynamicParams = true;

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <OrderDetailsClient forcedId={orderId} />
    </Suspense>
  );
}