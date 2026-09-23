import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterGroupProps {
  title: string;
  options: Array<{ id: string; label: string }>;
  selected: string[];
  onToggle: (id: string) => void;
}

/** Checkbox group with ArtSphere's square-check styling. */
export function FilterGroup({ title, options, selected, onToggle }: FilterGroupProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-ink-900">{title}</legend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const checked = selected.includes(option.id);
          return (
            <label
              key={option.id}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-200",
                "hover:bg-ink-100/70"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option.id)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-4.5 shrink-0 items-center justify-center rounded-xs ring-1 transition-all duration-200",
                  checked
                    ? "bg-ink-950 ring-ink-950"
                    : "bg-canvas-raised ring-ink-300 group-hover:ring-ink-400"
                )}
              >
                <Check
                  className={cn(
                    "size-3 text-canvas transition-opacity duration-150",
                    checked ? "opacity-100" : "opacity-0"
                  )}
                />
              </span>
              <span
                className={cn(
                  "text-sm transition-colors duration-200",
                  checked ? "font-medium text-ink-950" : "text-ink-600"
                )}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
