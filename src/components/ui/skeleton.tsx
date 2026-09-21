
import { cn } from "@/lib/utils"

/**
 * @fileOverview Warm White Premium ULTRA-FAST Shimmer.
 * Speed: 0.6s for high performance.
 * Color: Warm White (#FFFAF5) for a luxury creamy feel.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-[#FFFAF5] before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/80 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
