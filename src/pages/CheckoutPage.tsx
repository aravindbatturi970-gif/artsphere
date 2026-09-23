import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ShoppingBag, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { useShop } from "@/lib/shop";
import { useAuth } from "@/lib/auth";
import {
  createOrder,
  validateShipping,
  type ShippingDraft,
} from "@/lib/orders";
import { PAYMENTS_ENABLED } from "@/lib/payments";
import { formatPrice, cn } from "@/lib/utils";
import type { Order } from "@/types";

/**
 * Checkout (Stage 8): shipping details + order summary. Creates real
 * order rows (payment pending — no fake payments) and sends the buyer to
 * their order confirmation.
 */

const EMPTY_DRAFT: ShippingDraft = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-ink-200 bg-canvas px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 transition-colors focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/20";

export function CheckoutPage() {
  const { lines, purchasableCount, cartTotal, removeItems, notify } = useShop();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<ShippingDraft>(() => ({
    ...EMPTY_DRAFT,
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [placedOrders, setPlacedOrders] = useState<Order[] | null>(null);

  const buyable = useMemo(
    () => lines.filter((l) => !l.unavailable),
    [lines]
  );
  const shippingFee = 0; // Calculated at fulfilment; shown as "free for now".

  // Confirmation is rendered by /orders/:id — hand off via effect, never
  // navigate during render.
  useEffect(() => {
    if (placedOrders) {
      navigate(`/orders/${placedOrders[0].id}`, { replace: true });
    }
  }, [placedOrders, navigate]);

  if (purchasableCount === 0) {
    return (
      <div className="pt-28 pb-24 md:pt-36">
        <Container>
          <div className="mx-auto max-w-md text-center">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-ink-50 ring-1 ring-ink-100">
              <ShoppingBag className="size-7 text-ink-400" />
            </span>
            <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink-950">
              Nothing to check out
            </h1>
            <p className="mt-3 text-ink-500">
              Your cart has no available artwork.
            </p>
            <ButtonLink to="/discover" size="lg" className="mt-8">
              Discover Artwork
            </ButtonLink>
          </div>
        </Container>
      </div>
    );
  }

  if (placedOrders) {
    return null; // navigating via the effect above
  }

  function setField(field: keyof ShippingDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);

    const fieldErrors = validateShipping(draft);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    if (!isAuthenticated || !user) {
      navigate("/sign-in", { state: { from: "/checkout" } });
      return;
    }

    setSubmitting(true);
    const result = await createOrder({
      buyerId: user.id,
      buyerName: draft.fullName.trim(),
      buyerEmail: draft.email.trim(),
      shipping: {
        fullName: draft.fullName.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        address: draft.address.trim(),
        city: draft.city.trim(),
        state: draft.state.trim(),
        postalCode: draft.postalCode.trim(),
        country: draft.country.trim(),
      },
      lines: buyable.map((line) => ({
        item: line.item,
        artwork: line.artwork,
      })),
      shippingFee,
    });
    setSubmitting(false);

    if (result.error || result.orders.length === 0) {
      setServerError(
        result.error ?? "Could not place the order. Please try again."
      );
      return;
    }

    // Clear the purchased lines out of the cart, keep everything else.
    removeItems(buyable.map((line) => line.item.artworkId));
    notify(`Order ${result.orders[0].orderNumber} placed`);
    setPlacedOrders(result.orders);
  }

  return (
    <div className="pt-24 pb-20 md:pt-32 md:pb-28">
      <Container>
        <p className="eyebrow text-ink-400">Almost yours</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink-950 sm:text-5xl">
          Checkout
        </h1>
        <p className="mt-3 max-w-xl text-ink-500">
          Tell us where to send your artwork. You'll review everything before
          the order is placed.
        </p>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          {/* Shipping form */}
          <form onSubmit={handleSubmit} noValidate>
            {!isAuthenticated && (
              <p className="mb-6 rounded-lg bg-brass-50 px-4 py-3 text-sm text-brass-800 ring-1 ring-brass-200">
                You're checking out as a guest —{" "}
                <Link to="/sign-in" className="font-semibold underline">
                  sign in
                </Link>{" "}
                to save this order to your account. Your cart carries over.
              </p>
            )}

            <div className="rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100 sm:p-9">
              <h2 className="font-display text-xl font-medium text-ink-950">
                Shipping details
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {(
                  [
                    { key: "fullName", label: "Full name", autocomplete: "name", span: false, type: "text" },
                    { key: "email", label: "Email", autocomplete: "email", type: "email", span: false },
                    { key: "phone", label: "Phone", autocomplete: "tel", type: "tel", span: false },
                    { key: "country", label: "Country", autocomplete: "country-name", type: "text", span: false },
                    { key: "address", label: "Shipping address", autocomplete: "street-address", type: "text", span: true },
                    { key: "city", label: "City", autocomplete: "address-level2", type: "text", span: false },
                    { key: "state", label: "State", autocomplete: "address-level1", type: "text", span: false },
                    { key: "postalCode", label: "Postal code", autocomplete: "postal-code", type: "text", span: false },
                  ] as const
                ).map((field) => (
                  <div
                    key={field.key}
                    className={cn(field.span && "sm:col-span-2")}
                  >
                    <label
                      htmlFor={`checkout-${field.key}`}
                      className="mb-1.5 block text-sm font-medium text-ink-700"
                    >
                      {field.label}
                    </label>
                    <input
                      id={`checkout-${field.key}`}
                      type={field.type}
                      autoComplete={field.autocomplete}
                      value={draft[field.key]}
                      onChange={(e) => setField(field.key, e.target.value)}
                      aria-invalid={Boolean(errors[field.key])}
                      className={cn(
                        INPUT_CLASS,
                        errors[field.key] && "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                      )}
                    />
                    {errors[field.key] && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {serverError && (
                <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
                  {serverError}
                </p>
              )}

              <div className="mt-8 flex flex-col gap-3 border-t border-ink-100 pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full"
                >
                  <Lock className="size-4.5" />
                  {submitting ? "Placing order…" : "Place order"}
                </Button>
                <p className="text-center text-xs leading-relaxed text-ink-400">
                  {PAYMENTS_ENABLED
                    ? "You'll complete payment in the next step."
                    : "Payment isn't connected yet — the order is saved with payment status “pending” and settled when payments go live."}
                </p>
              </div>
            </div>
          </form>

          {/* Order summary */}
          <aside className="h-fit rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100 lg:sticky lg:top-28">
            <h2 className="font-display text-xl font-medium text-ink-950">
              Order summary
            </h2>
            <ul className="mt-5 flex flex-col gap-4">
              {buyable.map((line) => (
                <li key={line.item.artworkId} className="flex gap-3.5">
                  <div className="w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-ink-100">
                    <ArtPlaceholder
                      artwork={line.artwork}
                      imageUrl={line.artwork.imageUrl}
                      alt={line.artwork.title}
                      className="!aspect-square"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-950">
                      {line.artwork.title}
                    </p>
                    <p className="truncate text-xs text-ink-500">
                      {line.artwork.artist} · Qty {line.item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-medium tabular-nums text-ink-900">
                    {formatPrice(line.lineTotal, line.artwork.currency)}
                  </p>
                </li>
              ))}
            </ul>
            <dl className="mt-6 flex flex-col gap-3 border-t border-ink-100 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-medium text-ink-900">
                  {formatPrice(cartTotal, "INR")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Shipping</dt>
                <dd className="font-medium text-ink-900">
                  {shippingFee === 0 ? "Free" : formatPrice(shippingFee, "INR")}
                </dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-3">
                <dt className="font-display text-base font-medium text-ink-950">
                  Total
                </dt>
                <dd className="font-display text-xl font-medium text-ink-950">
                  {formatPrice(cartTotal + shippingFee, "INR")}
                </dd>
              </div>
            </dl>
            <p className="mt-5 flex items-start gap-2 rounded-lg bg-ink-50/80 px-3.5 py-3 text-xs leading-relaxed text-ink-500 ring-1 ring-ink-100">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brass-600" />
              Orders are confirmed by the artist and tracked from their studio
              dashboard until delivered.
            </p>
          </aside>
        </div>
      </Container>
    </div>
  );
}
