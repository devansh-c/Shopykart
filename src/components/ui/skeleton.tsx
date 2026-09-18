import { cn } from "@/lib/utils"

/**
 * @fileOverview Pure White Premium Skeleton Shimmer.
 * Updated: Increased brightness and removed gray tints for an ultra-white premium look.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-white border border-slate-50/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-slate-50/10 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
