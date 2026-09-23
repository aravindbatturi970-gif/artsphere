import { Link } from "react-router-dom";
import { Modal } from "@/components/ui/Modal";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { LikeButton } from "@/components/art/LikeButton";
import { Badge, AvailabilityBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { formatPrice } from "@/lib/utils";
import type { Artwork } from "@/types";

const TYPE_LABELS: Record<Artwork["type"], string> = {
  original: "Original",
  print: "Print",
  digital: "Digital",
};

interface QuickViewModalProps {
  artwork: Artwork | null;
  onClose: () => void;
}

/**
 * Quick View: artwork at a glance with links through to the full detail
 * page and artist profile.
 */
export function QuickViewModal({ artwork, onClose }: QuickViewModalProps) {
  return (
    <Modal open={artwork !== null} onClose={onClose} title={artwork?.title}>
      {artwork && (
        <div className="flex flex-col gap-5">
          <div className="overflow-hidden rounded-lg ring-1 ring-ink-100">
            <div className="aspect-[4/3] w-full">
              <ArtPlaceholder
                artwork={artwork}
                imageUrl={artwork.imageUrl}
                alt={artwork.title}
                className="!aspect-[4/3]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="font-display text-lg font-medium text-ink-950">
              <Link
                to={`/artist/${artwork.artistId}`}
                onClick={onClose}
                className="transition-colors hover:text-ink-700"
              >
                {artwork.artist}
              </Link>
            </p>
            <LikeButton artworkId={artwork.id} baseLikes={artwork.likes} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AvailabilityBadge availability={artwork.availability} />
            <Badge tone="neutral">{artwork.category}</Badge>
            <Badge tone="brass">{TYPE_LABELS[artwork.type]}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <div>
              <dt className="text-ink-400">Price</dt>
              <dd className="mt-0.5 font-display text-lg font-medium text-ink-950">
                {formatPrice(artwork.price, artwork.currency)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-400">Medium</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{artwork.medium}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Dimensions</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{artwork.dimensions}</dd>
            </div>
            <div>
              <dt className="text-ink-400">Year</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{artwork.year}</dd>
            </div>
          </dl>

          <ButtonLink to={`/artwork/${artwork.id}`} onClick={onClose} className="w-full">
            View full details
          </ButtonLink>
        </div>
      )}
    </Modal>
  );
}
