import OrderDetailsClient from '@/components/orders/OrderDetailsClient';

/**
 * @fileOverview Server Component wrapper for Order tracking.
 * Fixes "missing param in generateStaticParams" error for output: export.
 */

export async function generateStaticParams() {
  // We provide a default ID to satisfy the static export requirement.
  // Real order IDs will be handled dynamically on the client.
  return [{ orderId: 'latest' }];
}

export default function OrderPage() {
  return <OrderDetailsClient />;
}
