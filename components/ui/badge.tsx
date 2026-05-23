import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        vip: "border-transparent bg-blue-500/20 text-blue-300 border-blue-500/30",
        loyal: "border-transparent bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        at_risk: "border-transparent bg-red-500/20 text-red-300 border-red-500/30",
        new: "border-transparent bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
        inactive: "border-transparent bg-gray-500/20 text-gray-400 border-gray-500/30",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
