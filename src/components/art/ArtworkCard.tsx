import { ArrowUpRight, CircleDashed, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { LikeButton } from "@/components/art/LikeButton";
import { AvailabilityBadge, Badge } from "@/components/ui/Badge";
import { cn, formatPrice } from "@/lib/utils";
import type { Artwork } from "@/types";

const TYPE_LABELS: Record<Artwork["type"], string> = {
  original: "Original",
  print: "Print",
  digital: "Digital",
};

interface ArtworkCardProps {
  artwork: Artwork;
  /** Opens the quick-view modal instead of navigating. */
  onQuickView?: (artwork: Artwork) => void;
  /** Show the like/favorite control (hidden where space is tight). */
  showLike?: boolean;
  className?: string;
}

/**
 * The signature marketplace card: large artwork preview, availability +
 * type badges, favorite button, and placard-style details. The title links
 * to the artwork detail route; the artist name links to the profile.
 */
export function ArtworkCard({
  artwork,
  onQuickView,
  showLike = true,
  className,
}: ArtworkCardProps) {
  const isComingSoon = artwork.availability === "coming-soon";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl bg-canvas-raised shadow-card ring-1 ring-ink-100",
        "transition-all duration-500 ease-[var(--ease-gallery)]",
        "hover:-translate-y-1.5 hover:shadow-card-hover",
        className
      )}
    >
      <div className={cn("relative overflow-hidden", artwork.ratio)}>
        <div className="pointer-events-none absolute inset-0 transition-transform duration-700 ease-[var(--ease-gallery)] group-hover:scale-[1.04]">
          <ArtPlaceholder artwork={artwork} imageUrl={artwork.imageUrl} alt={artwork.title} />
        </div>

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
          <AvailabilityBadge availability={artwork.availability} />
        </div>

        {showLike && (
          <div className="absolute right-4 top-4 z-20">
            <LikeButton artworkId={artwork.id} baseLikes={artwork.likes} onSurface />
          </div>
        )}

        <div className="pointer-events-none absolute right-4 bottom-4 flex items-center gap-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(artwork)}
              aria-label={`Quick view ${artwork.title}`}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full bg-canvas-raised/90 text-ink-900 shadow-card backdrop-blur transition-transform duration-300 hover:scale-105"
            >
              <Eye className="size-4.5" />
            </button>
          )}
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-canvas-raised/90 text-ink-900 shadow-card backdrop-blur">
            {isComingSoon ? (
              <CircleDashed className="size-4.5" />
            ) : (
              <ArrowUpRight className="size-4.5" />
            )}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink-950/60 to-transparent p-4 pt-10 text-canvas opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="text-sm font-medium">{artwork.medium}</span>
          <span className="text-sm text-canvas/80">{artwork.year}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-medium text-ink-950">
              <Link
                to={`/artwork/${artwork.id}`}
                className="transition-colors duration-200 after:absolute after:inset-0 after:z-0 hover:text-ink-700"
              >
                {artwork.title}
              </Link>
            </h3>
            <p className="mt-0.5 truncate text-sm text-ink-500">
              <Link
                to={`/artist/${artwork.artistId}`}
                className="relative z-10 transition-colors duration-200 hover:text-ink-900"
              >
                {artwork.artist}
              </Link>
            </p>
          </div>
          <span className="whitespace-nowrap pt-0.5 font-display text-lg font-medium text-ink-900">
            {formatPrice(artwork.price, artwork.currency)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{artwork.category}</Badge>
            <Badge tone="brass">{TYPE_LABELS[artwork.type]}</Badge>
          </div>
          <span className="text-xs text-ink-400">{artwork.dimensions}</span>
        </div>
      </div>
    </article>
  );
}
