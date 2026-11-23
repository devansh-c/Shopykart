'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import HotelDetailsClient from '@/components/hotel/HotelDetailsClient';

/**
 * @fileOverview Static shell for Hotel Details.
 * Resolves Hotel ID from Query Params (?id=...) for APK compatibility.
 */
function HotelDetailsShell() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  if (!id) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Fetching Hotel Details...</p>
      </div>
    );
  }

  return <HotelDetailsClient forcedId={id} />;
}

export default function HotelDetailsPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <HotelDetailsShell />
    </Suspense>
  );
}
