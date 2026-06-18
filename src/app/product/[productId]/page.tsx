import { redirect } from 'next/navigation';

export default async function ProductIdPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  
  if (productId) {
    redirect(`/product/view?id=${productId}`);
  }
  
  redirect('/');
}

export const dynamic = 'force-static';
export const revalidate = false;