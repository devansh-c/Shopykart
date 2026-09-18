import { Skeleton } from "@/components/ui/skeleton";

/**
 * @fileOverview Premium Pure White Shimmer Loading UI.
 * Optimized for Light mode to prevent "Black Boxes" flash.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[160px] rounded-full bg-gray-100" />
          <Skeleton className="h-10 w-10 rounded-xl bg-gray-100" />
        </div>
        <Skeleton className="h-12 w-full rounded-full bg-gray-100" />
      </div>

      <main className="space-y-8 pb-32">
        {/* Banner Skeleton */}
        <div className="px-4">
          <Skeleton className="aspect-[18/9] w-full rounded-[2.5rem] shadow-sm bg-gray-100" />
        </div>

        {/* Explore Hub Skeleton */}
        <div className="space-y-4">
          <div className="px-6 flex justify-between items-center">
            <Skeleton className="h-5 w-32 rounded-full bg-gray-100" />
            <Skeleton className="h-3 w-16 rounded-full bg-gray-50" />
          </div>
          <div className="flex gap-4 px-6 overflow-hidden">
            <Skeleton className="h-44 w-56 shrink-0 rounded-[2.5rem] bg-gray-100" />
            <Skeleton className="h-44 w-56 shrink-0 rounded-[2.5rem] bg-gray-100" />
          </div>
        </div>

        {/* Category List Skeleton */}
        <div className="flex gap-4 px-6 overflow-hidden py-4 border-b border-gray-50">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full bg-gray-100" />
              <Skeleton className="h-2 w-10 rounded-full opacity-50 bg-gray-50" />
            </div>
          ))}
        </div>

        {/* Product Grid Skeleton */}
        <div className="px-4 space-y-6">
          <div className="flex justify-between px-2">
            <Skeleton className="h-8 w-40 rounded-full bg-gray-100" />
            <Skeleton className="h-6 w-16 rounded-full opacity-30 bg-gray-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3 bg-white p-3 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <Skeleton className="aspect-square w-full rounded-[1.5rem] bg-gray-100" />
                <div className="space-y-2 px-1">
                  <Skeleton className="h-2 w-2/3 rounded-full bg-gray-100" />
                  <Skeleton className="h-3 w-full rounded-full bg-gray-50" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-12 rounded-full bg-gray-100" />
                    <Skeleton className="h-8 w-16 rounded-full bg-gray-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
