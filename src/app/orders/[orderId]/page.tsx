import OrderDetailsClient from '@/components/orders/OrderDetailsClient';

/**
 * @fileOverview Server Component wrapper for Order tracking.
 * Fixes "missing param in generateStaticParams" error for output: export.
 */

export async function generateStaticParams() {
  // Return a dummy ID for build time.
  return [{ orderId: 'latest' }];
}

export const dynamic = 'force-static';
export const dynamicParams = true;

export default function OrderPage() {
  return <OrderDetailsClient />;
}
