import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border bg-white/[0.04] px-3 py-2 text-sm transition-colors",
          "border-white/[0.08] text-[#eeeef4] placeholder:text-[#424656]",
          "focus-visible:outline-none focus-visible:border-[rgba(68,112,255,0.5)] focus-visible:ring-1 focus-visible:ring-[rgba(68,112,255,0.2)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
