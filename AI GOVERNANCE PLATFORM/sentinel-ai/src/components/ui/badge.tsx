import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-neutral-800 text-neutral-50 shadow",
        secondary: "border-transparent bg-neutral-800/50 text-neutral-400",
        destructive: "border-transparent bg-red-900/50 text-red-400 shadow",
        success: "border-transparent bg-emerald-900/50 text-emerald-400 shadow",
        warning: "border-transparent bg-amber-900/50 text-amber-400 shadow",
        outline: "text-neutral-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
