import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  hint?: string;
}

/** Labeled input with inline validation message. */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, error, hint, className, id, ...props }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    const errorId = `${inputId}-error`;

    return (
      <div className="flex w-full flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-12 w-full rounded-md bg-canvas px-4 text-[15px] text-ink-900 ring-1 transition-shadow duration-200",
            "placeholder:text-ink-400 focus:outline-none",
            error
              ? "ring-red-300 focus:ring-2 focus:ring-red-400"
              : "ring-ink-200 hover:ring-ink-300 focus:ring-2 focus:ring-brass-500",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
        {error && (
          <p id={errorId} className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

interface PasswordFieldProps extends FormFieldProps {
  showToggle?: boolean;
}

/** FormField with a show/hide password toggle. */
export function PasswordField({ showToggle = true, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <FormField
        {...props}
        type={visible ? "text" : "password"}
        className={showToggle ? "pr-12" : undefined}
      />
      {showToggle && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-[2.4rem] cursor-pointer rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
        >
          {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      )}
    </div>
  );
}
