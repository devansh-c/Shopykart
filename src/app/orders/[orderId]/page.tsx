import OrderDetailsClient from '@/components/orders/OrderDetailsClient';

// Required for Next.js Static Export with dynamic routes
export async function generateStaticParams() {
  return [];
}

export default function OrderPage() {
  return <OrderDetailsClient />;
}
