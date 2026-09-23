import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageOpen, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Badge } from "@/components/ui/Badge";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { useAuth } from "@/lib/auth";
import { listBuyerOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

/**
 * Buyer order history (/orders): every order the signed-in buyer has
 * placed, newest first, with a status pill and per-artist grouping.
 */
export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listBuyerOrders(user.id)
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

  if (error) {
    return (
      <div className="pt-28 pb-24">
        <Container>
          <p className="mx-auto max-w-md rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 md:pt-32 md:pb-28">
      <Container>
        <p className="eyebrow text-ink-400">Your purchases</p>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-ink-950 sm:text-5xl">
          Orders
        </h1>
        <p className="mt-3 text-ink-500">
          {orders === null
            ? "Loading your orders…"
            : orders.length === 0
              ? "No orders yet."
              : `${orders.length} ${orders.length === 1 ? "order" : "orders"} placed`}
        </p>

        {orders !== null && orders.length === 0 && (
          <div className="mt-10 rounded-2xl bg-canvas-raised p-12 text-center shadow-card ring-1 ring-ink-100">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ink-50 ring-1 ring-ink-100">
              <PackageOpen className="size-6 text-ink-400" />
            </span>
            <p className="mt-5 font-display text-xl font-medium text-ink-950">
              Nothing here yet
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
              When you purchase artwork, your orders and their delivery status
              live here.
            </p>
            <ButtonLink to="/discover" className="mt-6">
              Discover Artwork
            </ButtonLink>
          </div>
        )}

        <ul className="mt-10 flex flex-col gap-4">
          {(orders ?? []).map((order) => (
            <li key={order.id}>
              <Link
                to={`/orders/${order.id}`}
                className="group flex flex-col gap-5 rounded-2xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100 transition-shadow hover:shadow-modal sm:flex-row sm:items-center"
              >
                {/* Thumbnails (up to 3) */}
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="w-14 overflow-hidden rounded-lg ring-2 ring-canvas-raised"
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
                    </div>
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-medium text-ink-950">
                      {order.orderNumber}
                    </p>
                    <Badge tone={order.status === "delivered" ? "success" : "brass"}>
                      {order.status}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-500">
                    {order.items.map((i) => i.title).join(", ")}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    {new Date(order.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    · {order.artistName}
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <p className="font-display text-lg font-medium text-ink-950">
                    {formatPrice(order.total, order.currency)}
                  </p>
                  <span className="flex items-center gap-1 text-xs font-semibold text-ink-400 transition-colors group-hover:text-ink-900">
                    View
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

      </Container>
    </div>
  );
}
