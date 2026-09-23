
import { cn } from "@/lib/utils"

/**
 * @fileOverview Luxury Warm White Premium ULTRA-FAST Shimmer.
 * Speed: 0.6s for high performance.
 * Color: Floral Warm White (#FFF9F0) for a creamy gourmet feel.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-[#FFF9F0] before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/95 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
