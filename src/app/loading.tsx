import { Skeleton } from "@/components/ui/skeleton";

/**
 * @fileOverview Global loading state for Home page with premium gold shimmer.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>

      <main className="space-y-8 pb-32">
        {/* Banner Skeleton */}
        <div className="px-6">
          <Skeleton className="aspect-[18/9] w-full rounded-[2.5rem] shadow-sm" />
        </div>

        {/* Explore Hub Skeleton */}
        <div className="space-y-4">
          <div className="px-6">
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <div className="flex gap-4 px-6 overflow-hidden">
            <Skeleton className="h-32 w-56 shrink-0 rounded-[2rem]" />
            <Skeleton className="h-32 w-56 shrink-0 rounded-[2rem]" />
          </div>
        </div>

        {/* Category List Skeleton */}
        <div className="flex gap-4 px-6 overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-2 w-10 rounded-full" />
            </div>
          ))}
        </div>

        {/* Product Grid Skeleton */}
        <div className="px-6 space-y-6">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3 bg-white p-3 rounded-[2.5rem] border border-border/40">
                <Skeleton className="aspect-square w-full rounded-[1.5rem]" />
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-3 w-2/3 rounded-full" />
                <div className="flex justify-between items-center pt-2">
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}