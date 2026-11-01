
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Redundant route. Redirecting to SEO friendly Slug path.
 */
export default function ProductViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      router.replace(`/product/${id}/`);
    } else {
      router.replace('/');
    }
  }, [id, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );
}
