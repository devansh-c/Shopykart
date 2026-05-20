import OrderDetailsClient from '@/components/orders/OrderDetailsClient';

/**
 * @fileOverview Server Component wrapper for Order tracking.
 * In static export mode, we must define sample params and disable dynamicParams.
 */

export async function generateStaticParams() {
  // Return sample IDs to satisfy the build requirement for static export.
  // The actual tracking happens on the client side in OrderDetailsClient.
  return [
    { orderId: 'track' },
    { orderId: 'status' },
    { orderId: 'active' }
  ];
}

// Ensure the page is treated as static for the export process
export const dynamic = 'force-static';
export const dynamicParams = false;

export default function OrderPage() {
  return <OrderDetailsClient />;
}
