import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { SAMPLE_ARTISTS } from "@/data/sample-artists";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

interface ArtistCardProps {
  artistId: string;
  className?: string;
}

/** Compact artist tile: avatar, name, location, artwork count. */
export function ArtistCard({ artistId, className }: ArtistCardProps) {
  const artist = SAMPLE_ARTISTS.find((a) => a.id === artistId);
  if (!artist) return null;

  return (
    <Link
      to={`/artist/${artist.id}`}
      className={cn(
        "group flex flex-col items-center gap-4 rounded-xl bg-canvas-raised p-7 text-center shadow-card ring-1 ring-ink-100",
        "transition-all duration-500 ease-[var(--ease-gallery)] hover:-translate-y-1 hover:shadow-card-hover",
        className
      )}
    >
      <div
        className="flex size-18 items-center justify-center rounded-full shadow-card ring-2 ring-canvas transition-transform duration-500 ease-[var(--ease-gallery)] group-hover:scale-105"
        style={{ backgroundImage: artist.gradient }}
      >
        <span className="font-display text-lg font-semibold text-ink-950/80">
          {artist.initials}
        </span>
      </div>

      <div>
        <h3 className="font-display text-lg font-medium text-ink-950 transition-colors duration-200 group-hover:text-ink-700">
          {artist.name}
        </h3>
        <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-400">
          <MapPin className="size-3.5" />
          {artist.location}
        </p>
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
        {artist.artworkCount} artworks
      </p>
    </Link>
  );
}

/**
 * "More artists" row used by the profile page. Excludes the given artist
 * (sample or `user-<id>` key) and caps the count.
 */
export function MoreArtistsRow({
  excludeArtistId,
  limit = 4,
}: {
  excludeArtistId: string;
  limit?: number;
}) {
  const isSampleArtist = !excludeArtistId.startsWith("user-");
  const others = SAMPLE_ARTISTS.filter(
    (a) => a.id !== excludeArtistId || !isSampleArtist
  ).slice(0, limit);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {others.map((artist, index) => (
        <Reveal key={artist.id} delay={(index % 4) * 80}>
          <ArtistCard artistId={artist.id} className="h-full" />
        </Reveal>
      ))}
    </div>
  );
}
