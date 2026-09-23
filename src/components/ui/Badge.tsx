import type { Availability } from "@/types";
import { cn } from "@/lib/utils";

const styles = {
  neutral:
    "bg-ink-100 text-ink-600 ring-ink-200",
  brass:
    "bg-brass-50 text-brass-700 ring-brass-200",
  success:
    "bg-emerald-50 text-emerald-700 ring-emerald-200",
  dark: "bg-ink-950/85 text-canvas ring-white/10 backdrop-blur-sm",
} as const;

type BadgeTone = keyof typeof styles;

/** Small status pill used for categories, availability and future UI states. */
export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1",
        styles[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Maps artwork availability to badge tone + label (used on artwork cards). */
export function AvailabilityBadge({ availability }: { availability: Availability }) {
  const map: Record<Availability, { tone: BadgeTone; label: string }> = {
    available: { tone: "success", label: "Available" },
    sold: { tone: "dark", label: "Sold" },
    "coming-soon": { tone: "brass", label: "Coming soon" },
  };
  const { tone, label } = map[availability];
  return (
    <Badge tone={tone}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {label}
    </Badge>
  );
}
