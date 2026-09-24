
import { cn } from "@/lib/utils"

/**
 * @fileOverview Premium Luxury Warm White (Creamy) ULTRA-FAST Shimmer.
 * Speed: 0.6s for elite performance feel.
 * Color: Floral White (#FFF9F5) for a high-end gourmet look.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-[#FFF9F5] before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-white/95 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
