'use client';

import OrderDetailsClient from '@/components/orders/OrderDetailsClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * @fileOverview Pretty URL tracking route: /order/track/#80
 */
export default function OrderTrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OrderDetailsClient />
    </Suspense>
  );
}
