
import { cn } from "@/lib/utils"

/**
 * @fileOverview Pure White Premium ULTRA-FAST Shimmer.
 * Speed increased to 0.6s for a high-performance silky feel.
 * Optimized for luxury white look without gray artifacts.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-gray-50/50 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
