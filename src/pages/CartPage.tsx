import { Link, useNavigate } from "react-router-dom";
import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Lock,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { useShop } from "@/lib/shop";
import { formatPrice, cn } from "@/lib/utils";

/**
 * Shopping cart (Stage 7): quantities, per-line totals, order summary,
 * unavailable-item handling and a checkout placeholder. The cart is
 * persisted per user by the shop context — guests included.
 */
export function CartPage() {
  const {
    lines,
    cartCount,
    purchasableCount,
    cartTotal,
    removeFromCart,
    setQuantity,
  } = useShop();
  const navigate = useNavigate();

  const hasUnavailable = lines.length - purchasableCount > 0;

  if (cartCount === 0) {
    return (
      <div className="pt-28 pb-24 md:pt-36">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ink-50 ring-1 ring-ink-100">
              <ShoppingBag className="size-7 text-ink-400" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink-950">
              Your cart is empty
            </h1>
            <p className="mt-3 text-ink-500">
              Browse the collection and add a piece that speaks to you.
            </p>
            <ButtonLink to="/discover" size="lg" className="mt-8">
              Continue Shopping
            </ButtonLink>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 md:pt-32 md:pb-28">
      <Container>
        <p className="eyebrow text-ink-400">Your selection</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink-950 sm:text-5xl">
          Shopping Cart
        </h1>
        <p className="mt-3 text-ink-500">
          {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
          {hasUnavailable ? " · some items need attention" : ""}
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          {/* Line items */}
          <ul className="flex flex-col divide-y divide-ink-100">
            {lines.map((line) => (
              <li key={line.item.artworkId} className="flex gap-5 py-6">
                <Link
                  to={`/artwork/${line.artwork.id}`}
                  className="block w-24 shrink-0 overflow-hidden rounded-xl shadow-card ring-1 ring-ink-100 transition-opacity hover:opacity-90 sm:w-32"
                >
                  <ArtPlaceholder
                    artwork={line.artwork}
                    imageUrl={line.artwork.imageUrl}
                    alt={line.artwork.title}
                    className="!aspect-square"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/artwork/${line.artwork.id}`}
                        className="block truncate font-display text-lg font-medium text-ink-950 transition-colors hover:text-ink-700"
                      >
                        {line.artwork.title}
                      </Link>
                      <p className="mt-0.5 truncate text-sm text-ink-500">
                        {line.artwork.artist}
                      </p>
                      {line.unavailable && (
                        <p className="mt-1 text-xs font-semibold text-red-600">
                          No longer available
                        </p>
                      )}
                    </div>
                    <button
                      type="button"                        onClick={() => {
                          removeFromCart(line.item.artworkId);
                        }}
                      aria-label={`Remove ${line.artwork.title} from cart`}
                      className="rounded-md p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
                    >
                      <Trash2 className="size-4.5" />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                    {line.artwork.type === "original" ? (
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-400">
                        One-of-a-kind
                      </p>
                    ) : (
                      <div className="inline-flex items-center rounded-full ring-1 ring-ink-200">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              line.item.artworkId,
                              line.item.quantity - 1
                            )
                          }
                          aria-label="Decrease quantity"
                          className="cursor-pointer rounded-l-full p-2.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold tabular-nums text-ink-900">
                          {line.item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              line.item.artworkId,
                              line.item.quantity + 1
                            )
                          }
                          aria-label="Increase quantity"
                          className="cursor-pointer rounded-r-full p-2.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-950"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    )}
                    <p
                      className={cn(
                        "font-display text-lg font-medium",
                        line.unavailable ? "text-ink-400" : "text-ink-950"
                      )}
                    >
                      {formatPrice(line.lineTotal, line.artwork.currency)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Order summary */}
          <aside className="h-fit rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100 lg:sticky lg:top-28">
            <h2 className="font-display text-xl font-medium text-ink-950">
              Order Summary
            </h2>
            <dl className="mt-5 flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-medium text-ink-900">
                  {formatPrice(cartTotal, "INR")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Shipping</dt>
                <dd className="font-medium text-ink-900">Calculated later</dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-3">
                <dt className="font-display text-base font-medium text-ink-950">
                  Total
                </dt>
                <dd className="font-display text-xl font-medium text-ink-950">
                  {formatPrice(cartTotal, "INR")}
                </dd>
              </div>
            </dl>
            <Button
              className="mt-6 w-full"
              size="lg"
              disabled={purchasableCount === 0}
              onClick={() => void navigate("/checkout")}
            >
              <Lock className="size-4.5" />
              Proceed to Checkout
            </Button>
            <p className="mt-3 text-center text-xs text-ink-400">
              Payment isn't connected yet — orders are placed with payment
              status “pending”.
            </p>
            <ButtonLink to="/discover" variant="ghost" className="mt-2 w-full">
              Continue Shopping
            </ButtonLink>
          </aside>
        </div>
      </Container>
    </div>
  );
}
