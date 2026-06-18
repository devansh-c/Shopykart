import { redirect } from 'next/navigation';

export default async function OrderIdPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  
  if (orderId) {
    redirect(`/orders/track?id=${orderId}`);
  }
  
  redirect('/orders');
}

export const dynamic = 'force-static';
export const revalidate = false;