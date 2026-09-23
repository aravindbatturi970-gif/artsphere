import { SAMPLE_ARTWORKS } from "@/data/sample-artworks";
import { SAMPLE_ARTISTS } from "@/data/sample-artists";
import type { Artwork, Artist, ArtistArtwork } from "@/types";

/**
 * Catalogue helpers — the seam between seeded sample content and real
 * artist uploads. `artistArtworkToCatalog` converts a dashboard listing
 * into the public shape; `mergeCatalog` combines uploads with samples
 * (uploads sort first so fresh studio work surfaces at the top).
 */

/* --------------------------- upload conversion -------------------------- */

const GRADIENTS = [
  "linear-gradient(135deg, #1f2937 0%, #6b7280 45%, #d6c7b2 100%)",
  "linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #fef3c7 100%)",
  "linear-gradient(135deg, #7c2d12 0%, #ea580c 60%, #fde68a 100%)",
  "linear-gradient(135deg, #1e3a8a 0%, #6366f1 55%, #e0e7ff 100%)",
  "linear-gradient(135deg, #4c1d95 0%, #a78bfa 60%, #fce7f3 100%)",
  "linear-gradient(135deg, #065f46 0%, #34d399 55%, #d1fae5 100%)",
];

const BLENDS = ["overlay", "soft-light", "multiply", "screen"];

const RATIOS = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]", "aspect-[5/4]"];

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

function gradientFor(seed: string): string {
  return GRADIENTS[Math.abs(hashCode(seed)) % GRADIENTS.length];
}

/**
 * Convert a published artist listing into the public catalogue shape.
 * Seeded fields the dashboard does not collect (likes, ratio, blend) are
 * derived deterministically from the artwork id.
 */
export function artistArtworkToCatalog(
  listing: ArtistArtwork,
  artistName: string
): Artwork {
  return {
    id: `up-${listing.id}`,
    title: listing.title,
    artist: artistName,
    artistId: `user-${listing.artistId}`,
    ratio: RATIOS[Math.abs(hashCode(listing.id)) % RATIOS.length],
    gradient: gradientFor(listing.id),
    blend: BLENDS[Math.abs(hashCode(listing.id)) % BLENDS.length],
    price: listing.price,
    currency: listing.currency,
    medium: listing.medium,
    year: listing.year,
    dimensions: listing.dimensions,
    category: listing.category,
    availability: listing.status === "sold" ? "sold" : "available",
    type: listing.type,
    likes: 0,
    likedByMe: false,
    recommended: 0,
    addedAt: listing.createdAt,
    description:
      listing.description ||
      "A new original piece, fresh from the artist's studio.",
    createdAt: listing.createdAt,
    imageUrl: listing.imageUrl,
  };
}

/* ------------------------------- accessors ------------------------------ */

/** Uploads merged with the seeded collection (uploads first). */
export function mergeCatalog(uploads: Artwork[]): Artwork[] {
  return [...uploads, ...SAMPLE_ARTWORKS];
}

/** Seeded sample lookup (no uploads — callers merge those via usePublicCatalog). */
export function getArtwork(id: string): Artwork | undefined {
  return SAMPLE_ARTWORKS.find((a) => a.id === id);
}

export function getArtist(id: string): Artist | undefined {
  return SAMPLE_ARTISTS.find((a) => a.id === id);
}

export function artworksByArtist(artistId: string): Artwork[] {
  return SAMPLE_ARTWORKS.filter((a) => a.artistId === artistId);
}

export function artistName(artistId: string): string {
  return getArtist(artistId)?.name ?? "Unknown artist";
}
