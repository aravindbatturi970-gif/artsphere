import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Share2,
  ShoppingBag,
  Check,
  Heart,
  Zap,
  Flag,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge, AvailabilityBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { LikeButton } from "@/components/art/LikeButton";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { ArtworkCard } from "@/components/art/ArtworkCard";
import { QuickViewModal } from "@/components/art/QuickViewModal";
import { Reveal } from "@/components/ui/Reveal";
import { ReportDialog } from "@/components/moderation/ReportDialog";
import { getArtist } from "@/lib/catalog";
import {
  useCatalogArtwork,
  useArtistCatalogWorks,
} from "@/hooks/usePublicCatalog";
import { useShop } from "@/lib/shop";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useFavorites } from "@/lib/favorites";
import { formatPrice } from "@/lib/utils";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SITE } from "@/config/site";
import type { Artwork } from "@/types";

const TYPE_LABELS: Record<Artwork["type"], string> = {
  original: "Original",
  print: "Print",
  digital: "Digital",
};

/** Long-format date, e.g. "18 April 2025". */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Artwork detail: gallery preview, full placard, mock commerce actions,
 * About the Artist and more works by the same hand. Works for both the
 * seeded samples and real user uploads (`up-` prefixed catalogue ids).
 */
export function ArtworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const artwork = useCatalogArtwork(id);
  usePageTitle(
    artwork ? `${artwork.title} by ${artwork.artist}` : "Artwork"
  );
  const relatedWorks = useArtistCatalogWorks(
    artwork?.artistId
  );
  const { addToCart, inCart, notify } = useShop();
  const { isLiked, toggleLike } = useFavorites();
  const [quickView, setQuickView] = useState<Artwork | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const related = useMemo(() => {
    if (!artwork) return [];
    return relatedWorks
      .filter((a) => a.id !== artwork.id)
      .slice(0, 3);
  }, [artwork, relatedWorks]);

  if (!artwork) {
    return <NotFoundPage message="That artwork could not be found." />;
  }

  const artist = getArtist(artwork.artistId);
  const available = artwork.availability === "available";
  const carted = inCart(artwork.id);
  const wishlisted = isLiked(artwork.id);

  const handleShare = async () => {
    const shareData = {
      title: `${artwork.title} — ${SITE.name}`,
      text: `${artwork.title} by ${artwork.artist} on ${SITE.name}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      notify("Link copied to clipboard");
    } catch {
      // Share sheet dismissed, or clipboard unavailable — say so either way.
      if (!navigator.share) {
        notify("Couldn't copy the link — copy it from the address bar");
      }
    }
  };

  return (
    <div className="pt-24 pb-20 md:pt-28 md:pb-28">
      <Container>
        {/* Breadcrumbs */}
        <Reveal>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-ink-400">
              <li>
                <Link
                  to="/"
                  className="transition-colors hover:text-ink-900"
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3.5" />
              </li>
              <li>
                <Link
                  to="/discover"
                  className="transition-colors hover:text-ink-900"
                >
                  Discover
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3.5" />
              </li>
              <li>
                <Link
                  to={`/discover?cat=${encodeURIComponent(artwork.category)}`}
                  className="transition-colors hover:text-ink-900"
                >
                  {artwork.category}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3.5" />
              </li>
              <li aria-current="page" className="font-medium text-ink-900">
                {artwork.title}
              </li>
            </ol>
          </nav>
        </Reveal>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          {/* Gallery preview */}
          <Reveal>
            <div className="overflow-hidden rounded-2xl bg-canvas-raised shadow-card ring-1 ring-ink-100">
              <ArtPlaceholder artwork={artwork} imageUrl={artwork.imageUrl} alt={artwork.title} />
            </div>
          </Reveal>

          {/* Placard */}
          <Reveal delay={120}>
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <AvailabilityBadge availability={artwork.availability} />
                <Badge tone="neutral">{artwork.category}</Badge>
                <Badge tone="brass">{TYPE_LABELS[artwork.type]}</Badge>
              </div>

              <h1 className="mt-5 font-display text-4xl font-medium tracking-tight text-ink-950 sm:text-5xl">
                {artwork.title}
              </h1>

              {/* Artist chip with avatar */}
              {artist && !artwork.artistId.startsWith("user-") && (
                <Link
                  to={`/artist/${artist.id}`}
                  className="group mt-4 inline-flex w-fit items-center gap-3"
                >
                  <span
                    className="flex size-10 items-center justify-center rounded-full shadow-card ring-2 ring-canvas"
                    style={{ backgroundImage: artist.gradient }}
                  >
                    <span className="font-display text-xs font-semibold text-ink-950/80">
                      {artist.initials}
                    </span>
                  </span>
                  <span>
                    <span className="block font-display text-lg font-medium text-ink-950 transition-colors group-hover:text-ink-700">
                      {artist.name}
                    </span>
                    <span className="block text-xs text-ink-400">
                      {artist.location}
                    </span>
                  </span>
                </Link>
              )}

              <div className="mt-6 flex items-center justify-between gap-4 border-y border-ink-100 py-5">
                <span className="font-display text-3xl font-medium text-ink-950">
                  {formatPrice(artwork.price, artwork.currency)}
                </span>
                <LikeButton artworkId={artwork.id} baseLikes={artwork.likes} />
              </div>

              <p className="mt-6 text-[15px] leading-relaxed text-ink-600">
                {artwork.description}
              </p>

              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
                <div>
                  <dt className="text-ink-400">Medium</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">{artwork.medium}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Dimensions</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">{artwork.dimensions}</dd>
                </div>
                <div>
                  <dt className="text-ink-400">Created</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {formatDate(artwork.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-400">Type</dt>
                  <dd className="mt-0.5 font-medium text-ink-900">
                    {TYPE_LABELS[artwork.type]}
                  </dd>
                </div>
              </dl>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-3">
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    onClick={() => addToCart(artwork)}
                    disabled={!available || carted}
                  >
                    {carted ? (
                      <>
                        <Check className="size-4.5" />
                        In your cart
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="size-4.5" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                  <Button
                    variant="brass"
                    size="lg"
                    onClick={() => {
                      // Buy Now = straight to checkout with the piece in the
                      // cart (skipped silently if it is already there).
                      if (!carted) addToCart(artwork);
                      navigate("/checkout");
                    }}
                    disabled={!available}
                  >
                    <Zap className="size-4.5" />
                    Buy Now
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      toggleLike(artwork.id);
                      notify(
                        wishlisted
                          ? "Removed from your wishlist"
                          : "Saved to your wishlist"
                      );
                    }}
                  >
                    <Heart
                      className={
                        wishlisted
                          ? "size-4.5 fill-brass-500 text-brass-500"
                          : "size-4.5"
                      }
                    />
                    {wishlisted ? "In Wishlist" : "Add to Wishlist"}
                  </Button>
                  <Button variant="secondary" size="md" onClick={handleShare}>
                    <Share2 className="size-4.5" />
                    Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="size-4.5" />
                    Report
                  </Button>
                </div>
                {!available && (
                  <p className="text-sm text-ink-400">
                    {artwork.availability === "sold"
                      ? "This piece has found its home — explore more from the artist below."
                      : "This piece is arriving soon — save it to your wishlist to be notified."}
                  </p>
                )}
                {available && (
                  <p className="text-sm text-ink-400">
                    {artwork.type === "original"
                      ? "One-of-a-kind original — a single piece is available."
                      : "Produced in limited quantity by the artist."}
                  </p>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* About the Artist — user uploads get a studio card too */}
        {artwork.artistId.startsWith("user-") && (
          <Reveal>
            <section className="mt-20">
              <h2 className="display-title text-2xl sm:text-3xl">About the Artist</h2>
              <div className="mt-6 rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100 sm:p-9">
                <p className="font-display text-xl font-medium text-ink-950">
                  {artwork.artist}
                </p>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600">
                  {artwork.description}
                </p>
                <ButtonLink
                  to={`/artist/${artwork.artistId}`}
                  variant="secondary"
                  size="sm"
                  className="mt-5"
                >
                  Visit profile
                </ButtonLink>
              </div>
            </section>
          </Reveal>
        )}
        {artist && !artwork.artistId.startsWith("user-") && (
          <Reveal>
            <section className="mt-20">
              <h2 className="display-title text-2xl sm:text-3xl">
                About the Artist
              </h2>
              <div className="mt-6 flex flex-col gap-6 rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100 sm:flex-row sm:items-start sm:gap-8 sm:p-9">
                <div
                  className="flex size-20 shrink-0 items-center justify-center rounded-full shadow-card ring-2 ring-canvas"
                  style={{ backgroundImage: artist.gradient }}
                >
                  <span className="font-display text-xl font-semibold text-ink-950/80">
                    {artist.initials}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-medium text-ink-950">
                    {artist.name}
                  </p>
                  <p className="mt-1 text-sm text-ink-400">
                    {artist.location} · Joined {artist.joined}
                  </p>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-600">
                    {artist.bio}
                  </p>
                  <ButtonLink
                    to={`/artist/${artist.id}`}
                    variant="secondary"
                    size="sm"
                    className="mt-5"
                  >
                    Visit profile
                  </ButtonLink>
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* More Artworks by This Artist */}
        {related.length > 0 && (
          <section className="mt-20">
            <Reveal>
              <div className="mb-8 flex items-end justify-between gap-4">
                <h2 className="display-title text-2xl sm:text-3xl">
                  More Artworks by This Artist
                </h2>
                <ButtonLink
                  to={`/artist/${artwork.artistId}`}
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  View all
                </ButtonLink>
              </div>
            </Reveal>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((work, index) => (
                <Reveal key={work.id} delay={(index % 3) * 80}>
                  <ArtworkCard artwork={work} onQuickView={setQuickView} />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        <Reveal>
          <Link
            to="/discover"
            className="mt-16 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-950"
          >
            <ArrowLeft className="size-4" />
            Back to Discover
          </Link>
        </Reveal>
      </Container>

      <QuickViewModal artwork={quickView} onClose={() => setQuickView(null)} />
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="artwork"
        targetId={artwork.id}
        targetLabel={`"${artwork.title}" by ${artwork.artist}`}
      />
    </div>
  );
}
