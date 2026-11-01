
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Redundant route. Redirecting to SEO friendly Slug path.
 */
export default function StaticPageViewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');

  useEffect(() => {
    if (slug) {
      router.replace(`/page/${slug}/`);
    } else {
      router.replace('/');
    }
  }, [slug, router]);

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );
}
