import { cn } from "@/lib/utils"

/**
 * @fileOverview Pure White Premium Skeleton Shimmer.
 * Optimized to be extremely light to match the app's premium aesthetic.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white border border-gray-50/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-gray-100/30 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
