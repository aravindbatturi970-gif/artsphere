import { cn } from "@/lib/utils";
import type { Artwork } from "@/types";

interface ArtPlaceholderProps {
  artwork: Pick<Artwork, "gradient" | "blend" | "ratio">;
  /** Public URL of a real uploaded image; renders above the gradient when set. */
  imageUrl?: string | null;
  /** Alt text for a real image. */
  alt?: string;
  className?: string;
}

/**
 * Artwork surface: renders a real uploaded image when one exists
 * (`imageUrl`, from Supabase Storage), otherwise the seeded gradient
 * placeholder. The swap-in was designed for exactly this stage.
 */
export function ArtPlaceholder({
  artwork,
  imageUrl,
  alt,
  className,
}: ArtPlaceholderProps) {
  return (
    <div
      aria-hidden={imageUrl ? undefined : "true"}
      className={cn("relative h-full w-full overflow-hidden", artwork.ratio, className)}
      style={{
        backgroundImage: artwork.gradient,
        mixBlendMode: "normal",
      }}
    >
      {/* Texture layer */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%), radial-gradient(circle at 70% 80%, rgba(0,0,0,0.25), transparent 60%)",
          mixBlendMode: artwork.blend as React.CSSProperties["mixBlendMode"],
        }}
      />
      {imageUrl && (
        <img
          src={imageUrl}
          alt={alt ?? ""}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}
