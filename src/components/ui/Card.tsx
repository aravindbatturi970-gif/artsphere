import { cn } from "@/lib/utils";

/** Gallery-style surface: rounded, subtle shadow, generous padding. */
export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-canvas-raised shadow-card ring-1 ring-ink-100",
        className
      )}
    >
      {children}
    </div>
  );
}
