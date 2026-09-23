import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  ArrowLeft,
  MapPin,
  Clock,
  ReceiptText,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { useAuth } from "@/lib/auth";
import { getOrder } from "@/lib/orders";
import { paymentStatusLabel, PAYMENTS_ENABLED } from "@/lib/payments";
import { usePageTitle } from "@/hooks/usePageTitle";
import { formatPrice } from "@/lib/utils";
import { NotFoundPage } from "@/pages/NotFoundPage";
import type { Order, OrderStatus } from "@/types";

/**
 * Order detail / confirmation (/orders/:id): full order placard with
 * status timeline, items, shipping snapshot and payment status. Also
 * serves as the confirmation page right after checkout.
 */

const TIMELINE: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

const STATUS_COPY: Record<OrderStatus, string> = {
  pending: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
        This order was cancelled.
      </p>
    );
  }
  const currentIndex = TIMELINE.indexOf(status);
  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start">
      {TIMELINE.map((step, index) => {
        const done = index <= currentIndex;
        const isLast = index === TIMELINE.length - 1;
        return (
          <li key={step} className="flex flex-1 items-start gap-3 sm:block">
            <div className="flex items-center sm:w-full">
              {/* Connector */}
              <span
                className={
                  index === 0
                    ? "hidden"
                    : "h-px w-6 bg-ink-200 sm:h-0.5 sm:w-auto sm:flex-1"
                }
                aria-hidden="true"
              />
              <span className={index === 0 ? "" : "sm:hidden"}>
                {done ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <Circle className="size-5 text-ink-300" />
                )}
              </span>
            </div>
            <div className="pb-4 sm:pb-0">
              <p
                className={
                  done
                    ? "text-xs font-semibold text-ink-900"
                    : "text-xs font-medium text-ink-400"
                }
              >
                {STATUS_COPY[step]}
              </p>
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="mt-2 hidden h-0.5 w-full bg-ink-100 sm:block"
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  // Hook must run on every render (Rules of Hooks), hence before the early
  // returns — the title simply says "Order" until the record arrives.
  usePageTitle(order ? `Order ${order.orderNumber}` : "Order");

  useEffect(() => {
    if (!user || !id) return;
    let cancelled = false;
    setLoading(true);
    getOrder(id, user.id)
      .then((found) => {
        if (!cancelled) setOrder(found);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-16">
        <div className="flex items-center gap-3 text-sm text-ink-400">
          <span className="size-2 animate-pulse rounded-full bg-brass-500" />
          Loading your order…
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <NotFoundPage message="That order could not be found — it may belong to another account." />
    );
  }

  const placed = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="pt-24 pb-20 md:pt-32 md:pb-28">
      <Container>
        {/* Confirmation banner */}
        <div className="rounded-2xl bg-ink-950 px-7 py-9 shadow-modal sm:px-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                <CheckCircle2 className="size-5" />
                Order placed
              </p>
              <h1 className="mt-3 font-display text-3xl font-medium tracking-tight text-canvas sm:text-4xl">
                {order.orderNumber}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-canvas/60">
                <Clock className="size-4" />
                Placed {placed}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-canvas/50">
                Total
              </p>
              <p className="mt-1 font-display text-3xl font-medium text-canvas">
                {formatPrice(order.total, order.currency)}
              </p>
              <Badge
                tone={order.paymentStatus === "paid" ? "success" : "brass"}
                className="mt-2"
              >
                {paymentStatusLabel(order.paymentStatus)}
              </Badge>
            </div>
          </div>
          {!PAYMENTS_ENABLED && order.paymentStatus === "pending" && (
            <p className="mt-5 rounded-lg bg-canvas/10 px-4 py-3 text-xs leading-relaxed text-canvas/70">
              Payment is <strong>pending</strong> — no charge has been made.
              Once a payment provider is connected, you'll complete payment
              securely and the status will update automatically.
            </p>
          )}
        </div>

        <Link
          to="/orders"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-950"
        >
          <ArrowLeft className="size-4" />
          All orders
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Items + timeline */}
          <div className="flex flex-col gap-8">
            <section className="rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100">
              <h2 className="font-display text-xl font-medium text-ink-950">
                Status
              </h2>
              <div className="mt-6">
                <StatusTimeline status={order.status} />
              </div>
            </section>

            <section className="rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100">
              <h2 className="font-display text-xl font-medium text-ink-950">
                {order.items.length}{" "}
                {order.items.length === 1 ? "item" : "items"} from{" "}
                {order.artistName}
              </h2>
              <ul className="mt-5 flex flex-col divide-y divide-ink-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex gap-4 py-4">
                    <Link
                      to={`/artwork/${item.artworkId}`}
                      className="block w-16 shrink-0 overflow-hidden rounded-lg ring-1 ring-ink-100"
                    >
                      <ArtPlaceholder
                        artwork={{
                          gradient: item.gradient,
                          blend: "normal",
                          ratio: item.ratio,
                        }}
                        imageUrl={item.imageUrl}
                        alt={item.title}
                        className="!aspect-square"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/artwork/${item.artworkId}`}
                        className="block truncate font-medium text-ink-950 transition-colors hover:text-ink-700"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-ink-500">
                        {formatPrice(item.unitPrice, order.currency)} ×{" "}
                        {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-ink-900">
                      {formatPrice(item.lineTotal, order.currency)}
                    </p>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 flex flex-col gap-2 border-t border-ink-100 pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Subtotal</dt>
                  <dd className="font-medium text-ink-900">
                    {formatPrice(order.subtotal, order.currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-500">Shipping</dt>
                  <dd className="font-medium text-ink-900">
                    {order.shippingFee === 0
                      ? "Free"
                      : formatPrice(order.shippingFee, order.currency)}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-ink-100 pt-2">
                  <dt className="font-medium text-ink-950">Total</dt>
                  <dd className="font-display text-lg font-medium text-ink-950">
                    {formatPrice(order.total, order.currency)}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Shipping snapshot */}
          <aside className="h-fit rounded-2xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100">
            <h2 className="flex items-center gap-2 font-display text-xl font-medium text-ink-950">
              <MapPin className="size-5 text-ink-400" />
              Shipping to
            </h2>
            {order.shipping ? (
              <address className="mt-4 flex flex-col gap-0.5 text-sm not-italic leading-relaxed text-ink-700">
                <span className="font-semibold text-ink-950">
                  {order.shipping.fullName}
                </span>
                <span>{order.shipping.address}</span>
                <span>
                  {order.shipping.city}, {order.shipping.state}{" "}
                  {order.shipping.postalCode}
                </span>
                <span>{order.shipping.country}</span>
                <span className="mt-2 text-ink-500">
                  {order.shipping.email}
                </span>
                <span className="text-ink-500">{order.shipping.phone}</span>
              </address>
            ) : (
              <p className="mt-4 text-sm text-ink-400">
                Shipping details unavailable.
              </p>
            )}
            <p className="mt-6 flex items-start gap-2 rounded-lg bg-ink-50/80 px-3.5 py-3 text-xs leading-relaxed text-ink-500 ring-1 ring-ink-100">
              <ReceiptText className="mt-0.5 size-4 shrink-0 text-brass-600" />
              Keep this page — the artist updates the status as your artwork
              makes its way to you.
            </p>
          </aside>
        </div>
      </Container>
    </div>
  );
}
