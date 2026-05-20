import OrderDetailsClient from '@/components/orders/OrderDetailsClient';

/**
 * @fileOverview Server Component wrapper for Order tracking.
 * Fixes "dynamicParams: true" conflict with output: export.
 */

export async function generateStaticParams() {
  // Return a dummy ID for build time.
  return [{ orderId: 'latest' }];
}

export const dynamic = 'force-static';
export const dynamicParams = false;

export default function OrderPage() {
  return <OrderDetailsClient />;
}
