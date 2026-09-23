import { Link } from "react-router-dom";
import { Heart, ShoppingBag, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Button } from "@/components/ui/Button";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { useFavorites } from "@/lib/favorites";
import { useShop } from "@/lib/shop";
import { usePublicCatalog } from "@/hooks/usePublicCatalog";
import { formatPrice } from "@/lib/utils";

/**
 * Wishlist (Stage 7): every artwork saved with the heart across the site,
 * with move-to-cart and remove actions. Persisted per account.
 */
export function WishlistPage() {
  const { likedIds, toggleLike } = useFavorites();
  const { addToCart, inCart, notify } = useShop();
  const { catalog } = usePublicCatalog();

  const saved = catalog.filter((a) => likedIds.has(a.id));

  if (saved.length === 0) {
    return (
      <div className="pt-28 pb-24 md:pt-36">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ink-50 ring-1 ring-ink-100">
              <Heart className="size-7 text-ink-400" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink-950">
              Your wishlist is empty
            </h1>
            <p className="mt-3 text-ink-500">
              Tap the heart on any artwork to save it here for later.
            </p>
            <ButtonLink to="/discover" size="lg" className="mt-8">
              Explore Artwork
            </ButtonLink>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 md:pt-32 md:pb-28">
      <Container>
        <p className="eyebrow text-ink-400">Saved pieces</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink-950 sm:text-5xl">
          Wishlist
        </h1>
        <p className="mt-3 text-ink-500">
          {saved.length} {saved.length === 1 ? "artwork" : "artworks"} you're
          keeping an eye on
        </p>

        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((artwork) => {
            const carted = inCart(artwork.id);
            const available = artwork.availability === "available";
            return (
              <li
                key={artwork.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-canvas-raised shadow-card ring-1 ring-ink-100 transition-shadow duration-300 hover:shadow-modal"
              >
                <Link
                  to={`/artwork/${artwork.id}`}
                  className="relative block overflow-hidden"
                  aria-label={`View ${artwork.title}`}
                >
                  <ArtPlaceholder
                    artwork={artwork}
                    imageUrl={artwork.imageUrl}
                    alt={artwork.title}
                    className="!aspect-[4/3] transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </Link>

                {/* Remove from wishlist */}
                <button
                  type="button"
                  aria-label={`Remove ${artwork.title} from wishlist`}
                  onClick={() => {
                    toggleLike(artwork.id);
                    notify("Removed from wishlist");
                  }}
                  className="absolute right-3 top-3 z-10 rounded-full bg-canvas-raised/90 p-2 shadow-card backdrop-blur transition-transform duration-200 hover:scale-110"
                >
                  <X className="size-4 text-ink-600" />
                </button>

                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/artwork/${artwork.id}`}
                        className="block truncate font-display text-lg font-medium text-ink-950 transition-colors hover:text-ink-700"
                      >
                        {artwork.title}
                      </Link>
                      <p className="truncate text-sm text-ink-500">
                        {artwork.artist}
                      </p>
                    </div>
                    <AvailabilityBadge availability={artwork.availability} />
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                    <p className="font-display text-lg font-medium text-ink-950">
                      {formatPrice(artwork.price, artwork.currency)}
                    </p>
                    <Button
                      size="sm"
                      variant={carted ? "secondary" : "primary"}
                      disabled={!available || carted}
                      onClick={() => {
                        addToCart(artwork);
                        notify(
                          carted ? "Already in your cart" : "Added to your cart"
                        );
                      }}
                    >
                      <ShoppingBag className="size-4" />
                      {carted ? "In cart" : "Add to cart"}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Container>
    </div>
  );
}
