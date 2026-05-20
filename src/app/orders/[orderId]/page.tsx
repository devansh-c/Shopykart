import OrderDetailsClient from '@/components/orders/OrderDetailsClient';

/**
 * @fileOverview Server Component wrapper for Order tracking.
 * Fixes "missing generateStaticParams" error for output: export.
 */

export async function generateStaticParams() {
  return []; // Dynamic routes will be handled on client side via Firestore
}

export default function OrderPage() {
  return <OrderDetailsClient />;
}
