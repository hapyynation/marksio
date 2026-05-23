"use client";
import * as React from "react";

const cn = (...classes: (string | undefined | null | false | Record<string, boolean>)[]) =>
  classes.flatMap((c) => {
    if (!c) return [];
    if (typeof c === "string") return [c];
    return Object.entries(c).filter(([, ok]) => !!ok).map(([k]) => k);
  }).join(" ");

export interface ComponentProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand-primary" | "brand-secondary" | "brand-tertiary" | "neutral-primary" | "neutral-secondary" | "neutral-tertiary" | "destructive-primary" | "destructive-secondary" | "destructive-tertiary" | "inverse";
  size?: "large" | "medium" | "small";
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
}

const VARIANT_BASE = "inline-flex items-center justify-center gap-2 rounded-md px-3 border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const VARIANT_STYLES: Record<NonNullable<ComponentProps["variant"]>, string> = {
  "brand-primary": "h-8 border-transparent bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500",
  "brand-secondary": "h-8 border-transparent bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 focus:ring-blue-500/30",
  "brand-tertiary": "h-8 border-transparent bg-transparent text-blue-400 hover:bg-blue-500/15 focus:ring-blue-500/30",
  "neutral-primary": "h-8 border-transparent bg-[#1e1e1e] text-gray-200 hover:bg-[#252525] focus:ring-gray-500",
  "neutral-secondary": "h-8 border-[#2a2a2a] bg-[#111] text-gray-300 hover:bg-[#1a1a1a] focus:ring-gray-600",
  "neutral-tertiary": "h-8 border-transparent bg-transparent text-gray-400 hover:bg-[#1a1a1a] focus:ring-gray-600",
  "destructive-primary": "h-8 border-transparent bg-red-600 text-white hover:bg-red-500 focus:ring-red-500",
  "destructive-secondary": "h-8 border-transparent bg-red-500/15 text-red-400 hover:bg-red-500/25 focus:ring-red-500/30",
  "destructive-tertiary": "h-8 border-transparent bg-transparent text-red-400 hover:bg-red-500/15 focus:ring-red-500/30",
  "inverse": "h-8 border-transparent bg-transparent text-white hover:bg-white/15 focus:ring-white",
};

const SIZE_STYLES: Record<NonNullable<ComponentProps["size"]>, { wrapper: string; text: string }> = {
  small: { wrapper: "h-6 px-2 text-xs", text: "text-xs font-medium" },
  medium: { wrapper: "h-8 px-3 text-sm", text: "text-sm font-medium" },
  large: { wrapper: "h-10 px-4 text-base", text: "text-base font-medium" },
};

// Simple inline Loader (no @subframe/core dependency)
const Loader: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={cn("animate-spin h-4 w-4", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const Component = React.forwardRef<HTMLButtonElement, ComponentProps>(function Component(
  { variant = "brand-primary", size = "medium", children, icon = null, iconRight = null, loading = false, className, type = "button", ...otherProps },
  ref
) {
  const s = SIZE_STYLES[size];
  return (
    <button ref={ref} type={type} {...otherProps} className={cn(VARIANT_BASE, VARIANT_STYLES[variant], s.wrapper, className)}>
      {icon && !loading && <span className="flex items-center">{icon}</span>}
      {loading && <Loader />}
      {children && !loading && <span className={s.text}>{children}</span>}
      {iconRight && !loading && <span className="flex items-center">{iconRight}</span>}
    </button>
  );
});

export default Component;
