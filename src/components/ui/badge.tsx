import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex text-center justify-center items-center rounded-md border px-3 py-0.5 text-xs font-semibold whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-white/50 text-white bg-white/10",
        secondary:
          "border-gray-500/50 text-gray-400 bg-gray-500/10",
        destructive:
          "border-red-500/50 text-red-400 bg-red-500/10",
        outline: "text-foreground",
        success: "border-emerald-500/50 text-emerald-400 bg-emerald-500/10",
        pending: "border-orange-500/50 text-orange-400 bg-orange-500/10",
        warning: "border-orange-500/50 text-orange-400 bg-orange-500/10",
        inactive: "border-gray-500/50 text-gray-400 bg-gray-500/10",
        info: "border-blue-500/50 text-blue-400 bg-blue-500/10",
        draft: "border-yellow-500/50 text-yellow-400 bg-yellow-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
