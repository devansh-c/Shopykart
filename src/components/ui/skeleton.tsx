import { cn } from "@/lib/utils"

/**
 * @fileOverview Pure White Premium Skeleton Shimmer.
 * Extremely light background to prevent "Black Boxes" during load.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-50/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/95 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
