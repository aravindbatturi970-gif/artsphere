import { useCallback, useEffect, useState } from "react";
import {
  Package,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { ArtistPageHeading } from "@/components/dashboard/ArtistDashboardLayout";
import { useAuth } from "@/lib/auth";
import {
  listArtistOrders,
  advanceOrderStatus,
  computeArtistStats,
} from "@/lib/orders";
import { paymentStatusLabel } from "@/lib/payments";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

const NEXT_LABEL: Record<string, string | null> = {
  pending: "Confirm order",
  confirmed: "Start processing",
  processing: "Mark shipped",
  shipped: "Mark delivered",
  delivered: null,
  cancelled: null,
};

function statusTone(status: string): "success" | "brass" | "neutral" {
  if (status === "delivered") return "success";
  if (status === "cancelled") return "neutral";
  return "brass";
}

/**
 * Artist dashboard — Orders. Every order containing this artist's work,
 * with buyer, shipping destination and a one-click fulfilment advance.
 * Payment status is read-only (set by the payment provider later).
 */
export function ArtistOrdersPage() {
  const { user, demoMode } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listArtistOrders(user.id)
      .then((rows) => {
        if (!cancelled) setOrders(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load orders.");
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleAdvance = useCallback(
    async (orderId: string) => {
      if (!user) return;
      setAdvancing(orderId);
      try {
        const updated = await advanceOrderStatus(orderId, user.id);
        if (updated) {
          setOrders((prev) =>
            (prev ?? []).map((o) => (o.id === orderId ? updated : o))
          );
        }
      } finally {
        setAdvancing(null);
      }
    },
    [user]
  );

  const stats = computeArtistStats(orders ?? []);

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <ArtistPageHeading
          title="Orders"
          blurb="Purchases of your artwork, from confirmation to delivery."
        />

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}

        {orders !== null && orders.length > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Orders received", value: String(orders.length) },
              { label: "Awaiting fulfilment", value: String(stats.pendingOrders) },
              { label: "Expected earnings", value: formatPrice(stats.earnings) },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-xl bg-canvas-raised p-5 shadow-card ring-1 ring-ink-100"
              >
                <p className="font-display text-2xl font-medium text-ink-950">
                  {card.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-400">
                  {card.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {orders === null && (
          <div className="flex items-center gap-3 text-sm text-ink-400">
            <span className="size-2 animate-pulse rounded-full bg-brass-500" />
            Loading orders…
          </div>
        )}

        {orders !== null && orders.length === 0 && (
          <div className="rounded-2xl bg-canvas-raised p-12 text-center shadow-card ring-1 ring-ink-100">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ink-50 ring-1 ring-ink-100">
              <Package className="size-6 text-ink-400" />
            </span>
            <p className="mt-5 font-display text-xl font-medium text-ink-950">
              No orders yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
              When a buyer purchases your work, the order appears here with
              shipping details and fulfilment controls.
            </p>
          </div>
        )}

        <ul className="flex flex-col gap-5">
          {(orders ?? []).map((order) => (
            <li
              key={order.id}
              className="rounded-2xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100 sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-medium text-ink-950">
                      {order.orderNumber}
                    </p>
                    <Badge tone={statusTone(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge
                      tone={
                        order.paymentStatus === "paid" ? "success" : "neutral"
                      }
                    >
                      {paymentStatusLabel(order.paymentStatus)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {order.buyerName} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="font-display text-xl font-medium text-ink-950">
                  {formatPrice(order.total, order.currency)}
                </p>
              </div>

              <ul className="mt-5 flex flex-col gap-3 border-t border-ink-100 pt-4">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3.5">
                    <div className="w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-ink-100">
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
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-950">
                        {item.title}
                      </p>
                      <p className="text-xs text-ink-500">
                        Qty {item.quantity} ·{" "}
                        {formatPrice(item.unitPrice, order.currency)}
                      </p>
                    </div>
                    <p className="text-sm font-medium tabular-nums text-ink-900">
                      {formatPrice(item.lineTotal, order.currency)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-col gap-4 border-t border-ink-100 pt-4 sm:flex-row sm:items-start sm:justify-between">
                {order.shipping && (
                  <address className="flex flex-col gap-0.5 text-xs not-italic leading-relaxed text-ink-500">
                    <span className="flex items-center gap-1.5 font-semibold text-ink-700">
                      <MapPin className="size-3.5" />
                      Ship to
                    </span>
                    <span>
                      {order.shipping.fullName}, {order.shipping.address}
                    </span>
                    <span>
                      {order.shipping.city}, {order.shipping.state}{" "}
                      {order.shipping.postalCode}, {order.shipping.country}
                    </span>
                    <span>{order.shipping.phone}</span>
                  </address>
                )}
                <div className="shrink-0">
                  {NEXT_LABEL[order.status] ? (
                    <button
                      type="button"
                      onClick={() => void handleAdvance(order.id)}
                      disabled={advancing === order.id}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-canvas transition-all duration-200 hover:bg-ink-800 disabled:opacity-50"
                    >
                      {advancing === order.id ? (
                        <>
                          <Clock className="size-4 animate-pulse" />
                          Updating…
                        </>
                      ) : (
                        <>
                          {NEXT_LABEL[order.status]}
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="size-4" />
                      {order.status === "delivered" ? "Delivered" : "Closed"}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {demoMode && orders !== null && orders.length > 0 && (
          <p className="mt-6 text-xs text-ink-400">
            Demo mode — orders are stored in this browser. Add Supabase
            credentials to share them between devices.
          </p>
        )}
      </Container>
    </div>
  );
}
