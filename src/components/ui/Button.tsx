import type { ButtonProps } from "@/types";
import { cn } from "@/lib/utils";

export const variantClasses = {
  primary:
    "bg-ink-950 text-canvas hover:bg-ink-800 hover:shadow-card-hover active:translate-y-px",
  brass:
    "bg-brass-500 text-ink-950 hover:bg-brass-400 hover:shadow-card-hover active:translate-y-px",
  secondary:
    "bg-canvas-raised text-ink-900 ring-1 ring-ink-200 hover:ring-ink-400 hover:shadow-card active:translate-y-px",
  ghost:
    "bg-transparent text-ink-700 hover:bg-ink-100 hover:text-ink-950",
} as const;

export const sizeClasses = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
} as const;

/** Shared look for Button and ButtonLink so any CTA can be a link or button. */
export function buttonStyles(
  variant: keyof typeof variantClasses = "primary",
  size: keyof typeof sizeClasses = "md",
  className?: string
) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-2 rounded-md font-semibold tracking-tight",
    "transition-all duration-300 ease-[var(--ease-gallery)]",
    "disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
}

/**
 * Primary interactive control. Variants cover the whole design system;
 * later stages (checkout, auth, admin) reuse this component as-is.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles(variant, size, className)}
      {...props}
    />
  );
}
