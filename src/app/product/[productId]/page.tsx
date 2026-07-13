import { Suspense } from 'react';
import ProductDetailsClient from '@/components/product/ProductDetailsClient';
import { Loader2 } from 'lucide-react';

// For static export compatibility (APK build)
export const generateStaticParams = async () => {
  return [];
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const resolvedParams = await params;
  const productId = resolvedParams.productId;

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <ProductDetailsClient forcedId={productId} />
    </Suspense>
  );
}

// Set to force-dynamic to support runtime ID resolution on Firebase App Hosting
export const dynamic = 'force-dynamic';
export const revalidate = 0;
