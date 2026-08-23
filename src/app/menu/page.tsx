'use client';

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

const MenuContent = lazy(() => import('@/components/menu/MenuContent'));

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <MenuContent />
    </Suspense>
  );
}