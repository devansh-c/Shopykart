import { Skeleton } from "@/components/ui/skeleton";

/**
 * @fileOverview High-Fidelity Loading UI.
 * Skeletons now match the actual component shapes and theme for seamless transition.
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[160px] rounded-full" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </div>

      <main className="space-y-8 pb-32">
        {/* Banner Skeleton */}
        <div className="px-4">
          <Skeleton className="aspect-[18/9] w-full rounded-[2.5rem] shadow-sm" />
        </div>

        {/* Explore Hub Skeleton */}
        <div className="space-y-4">
          <div className="px-6 flex justify-between items-center">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <div className="flex gap-4 px-6 overflow-hidden">
            <Skeleton className="h-44 w-56 shrink-0 rounded-[2.5rem]" />
            <Skeleton className="h-44 w-56 shrink-0 rounded-[2.5rem]" />
          </div>
        </div>

        {/* Category List Skeleton */}
        <div className="flex gap-4 px-6 overflow-hidden py-4 border-b border-gray-50">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-2 w-10 rounded-full opacity-50" />
            </div>
          ))}
        </div>

        {/* Product Grid Skeleton */}
        <div className="px-4 space-y-6">
          <div className="flex justify-between px-2">
            <Skeleton className="h-8 w-40 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full opacity-30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3 bg-[#0B0B0B] p-3 rounded-[2.5rem] border-2 border-amber-900/20">
                <Skeleton className="aspect-square w-full rounded-[1.5rem] bg-gray-900" />
                <div className="space-y-2 px-1">
                  <Skeleton className="h-2 w-2/3 rounded-full bg-gray-800" />
                  <Skeleton className="h-3 w-full rounded-full bg-gray-800" />
                  <div className="flex justify-between pt-2">
                    <Skeleton className="h-6 w-12 rounded-full bg-gray-800" />
                    <Skeleton className="h-8 w-16 rounded-full bg-gray-700" />
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
