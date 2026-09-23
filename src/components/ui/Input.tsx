import { useId } from "react";
import type { InputProps } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Text input with optional floating label + hint. Auth, search, upload and
 * admin forms in later stages all compose this primitive.
 */
export function Input({ label, hint, className, id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-md bg-canvas-raised px-4 text-[15px] text-ink-900",
          "ring-1 ring-ink-200 transition-shadow duration-200",
          "placeholder:text-ink-400",
          "hover:ring-ink-300 focus:ring-2 focus:ring-brass-500 focus:outline-none",
          className
        )}
        {...props}
      />
      {hint && <p className="text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
