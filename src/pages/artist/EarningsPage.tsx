import { useEffect, useState } from "react";
import { Wallet, TrendingUp, ReceiptText, Percent } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ArtistPageHeading } from "@/components/dashboard/ArtistDashboardLayout";
import { useAuth } from "@/lib/auth";
import { listArtistOrders, computeArtistStats } from "@/lib/orders";
import { PAYMENTS_ENABLED } from "@/lib/payments";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/types";

/**
 * Artist dashboard — Earnings. Order value with a platform-fee preview.
 * Payouts only become real once a payment provider settles transactions;
 * until then every figure is labelled "expected".
 */

const PLATFORM_FEE_PCT = 10;

export function ArtistEarningsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const stats = computeArtistStats(orders ?? []);
  const fee = Math.round(stats.earnings * (PLATFORM_FEE_PCT / 100));
  const net = stats.earnings - fee;

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <ArtistPageHeading
          title="Earnings"
          blurb="Order value flowing to your studio — settled once payments are connected."
        />

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100">
            <span className="flex size-10 items-center justify-center rounded-full bg-ink-950 text-canvas">
              <TrendingUp className="size-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-medium text-ink-950">
              {formatPrice(stats.earnings)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-400">
              Expected earnings
            </p>
          </div>
          <div className="rounded-xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100">
            <span className="flex size-10 items-center justify-center rounded-full bg-ink-950 text-canvas">
              <Percent className="size-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-medium text-ink-950">
              {formatPrice(fee)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink-400">
              Platform fee preview ({PLATFORM_FEE_PCT}%)
            </p>
          </div>
          <div className="rounded-xl bg-ink-950 p-6 shadow-modal ring-1 ring-ink-950">
            <span className="flex size-10 items-center justify-center rounded-full bg-canvas/10 text-brass-300">
              <Wallet className="size-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-medium text-canvas">
              {formatPrice(net)}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-canvas/60">
              Net to your studio
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="display-title text-xl">Order value breakdown</h2>
          {orders !== null && orders.length > 0 ? (
            <ul className="mt-5 flex flex-col divide-y divide-ink-100 rounded-2xl bg-canvas-raised px-6 shadow-card ring-1 ring-ink-100">
              {orders
                .filter((o) => o.status !== "cancelled")
                .map((order) => {
                  const orderFee = Math.round(
                    order.total * (PLATFORM_FEE_PCT / 100)
                  );
                  return (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink-950">
                          {order.orderNumber}
                        </p>
                        <p className="text-xs text-ink-400">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", year: "numeric" }
                          )}{" "}
                          · {order.buyerName}
                        </p>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-ink-500">
                          −{formatPrice(orderFee)} fee
                        </span>
                        <span className="font-semibold tabular-nums text-ink-950">
                          {formatPrice(order.total - orderFee)} net
                        </span>
                      </div>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <div className="mt-5 rounded-2xl bg-canvas-raised p-12 text-center shadow-card ring-1 ring-ink-100">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-ink-50 ring-1 ring-ink-100">
                <ReceiptText className="size-6 text-ink-400" />
              </span>
              <p className="mt-5 font-display text-xl font-medium text-ink-950">
                No earnings yet
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
                Once buyers purchase your work, each order's value and fee
                breakdown appears here.
              </p>
            </div>
          )}
        </section>

        {!PAYMENTS_ENABLED && (
          <p className="mt-8 rounded-xl bg-brass-50 px-5 py-4 text-sm leading-relaxed text-brass-800 ring-1 ring-brass-200">
            Payments aren't connected yet — all figures are expected values
            from placed orders, and no money has been collected. Payouts
            activate with the payments stage.
          </p>
        )}
      </Container>
    </div>
  );
}
