import { Suspense } from 'react';
import HotelDetailsClient from '@/components/hotel/HotelDetailsClient';
import { Loader2 } from 'lucide-react';

export const dynamic = 'force-static';
export const dynamicParams = false;

/**
 * @fileOverview Dynamic Hotel Detail Page with Static Export Fix.
 * Pre-rendering common slugs to prevent GitHub Build failure.
 */
export async function generateStaticParams() {
  return [
    { id: 'view' },
    { id: 'details' },
    { id: 'reservation' }
  ];
}

export default async function HotelPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <Suspense fallback={
      <div className="h-screen bg-white flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Syncing with Hotelवाले Hub...</p>
      </div>
    }>
      <HotelDetailsClient forcedId={id} />
    </Suspense>
  );
}
