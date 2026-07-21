import * as React from "react"
import { cn } from "@/lib/utils"
const badgeVariants = { default: "border-transparent bg-primary text-primary-foreground shadow", secondary: "border-transparent bg-secondary text-secondary-foreground", destructive: "border-transparent bg-destructive text-destructive-foreground shadow", outline: "text-foreground", success: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" }
function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof badgeVariants }) {
  return <div className={cn("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", badgeVariants[variant], className)} {...props} />
}
export { Badge }
