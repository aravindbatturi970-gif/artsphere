import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  artworkId: string;
  baseLikes: number;
  /** Compact variant sits on artwork imagery. */
  onSurface?: boolean;
  className?: string;
}

/**
 * Favorite toggle. Count = mock base likes ± the visitor's own like.
 * Live persistence arrives with the accounts stage; the interface stays.
 */
export function LikeButton({
  artworkId,
  baseLikes,
  onSurface = false,
  className,
}: LikeButtonProps) {
  const { isLiked, toggleLike } = useFavorites();
  const liked = isLiked(artworkId);
  const count = baseLikes + (liked ? 1 : 0);

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Remove from favorites" : "Add to favorites"}
      onClick={(event) => {
        event.stopPropagation();
        toggleLike(artworkId);
      }}
      className={cn(
        "group/like inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold",
        "transition-all duration-300 ease-[var(--ease-gallery)] active:scale-95",
        onSurface
          ? "bg-canvas-raised/90 shadow-card backdrop-blur hover:bg-canvas-raised"
          : "bg-ink-50 ring-1 ring-ink-200 hover:ring-ink-300",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-all duration-300 ease-[var(--ease-gallery)]",
          "group-hover/like:scale-110 group-active/like:scale-90",
          liked
            ? "fill-brass-500 text-brass-500"
            : "fill-transparent text-ink-600 group-hover/like:text-brass-500"
        )}
      />
      <span className={cn("tabular-nums", liked ? "text-ink-900" : "text-ink-600")}>
        {count}
      </span>
    </button>
  );
}
