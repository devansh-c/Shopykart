import { cn } from "@/lib/utils"

/**
 * @fileOverview Pure White Premium Skeleton Shimmer.
 * Removed black-tinted background for a clean gourmet look.
 * Fixed: Ensured pure white shimmer for light mode compatibility.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-50/80 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
