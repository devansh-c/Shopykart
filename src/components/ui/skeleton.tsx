
import { cn } from "@/lib/utils"

/**
 * @fileOverview Pure White Premium FAST Shimmer.
 * Speed increased to 0.6s for a high-performance snappy feel.
 * Optimized to be completely white with zero dark gray boxes.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_0.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-50/50 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
