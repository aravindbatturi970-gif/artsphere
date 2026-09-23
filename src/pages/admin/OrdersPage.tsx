import { useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import { AdminHeading, AdminCard } from "@/components/admin/AdminLayout";
import { listAdminOrders, type AdminOrderRow } from "@/lib/admin";
import { formatPrice, cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  pending: "bg-brass-500/15 text-brass-300 ring-brass-500/30",
  confirmed: "bg-canvas/10 text-canvas/70 ring-canvas/20",
  processing: "bg-canvas/10 text-canvas/70 ring-canvas/20",
  shipped: "bg-canvas/10 text-canvas/70 ring-canvas/20",
  delivered: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-300 ring-red-500/30",
};

/**
 * Admin Orders: every order on the platform with parties, artwork,
 * amount, statuses and date — the oversight view artists and buyers
 * each see only their own slice of.
 */
export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAdminOrders()
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
  }, []);

  return (
    <div>
      <AdminHeading
        title="Orders"
        blurb="Every order across the marketplace."
      />

      {error && (
        <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <AdminCard className="!p-0">
        <div className="hidden grid-cols-[1.1fr_1fr_1fr_1.4fr_auto_auto_auto] items-center gap-4 border-b border-canvas/10 px-5 py-3 text-[11px] uppercase tracking-[0.12em] text-canvas/40 lg:grid">
          <span>Order</span>
          <span>Buyer</span>
          <span>Artist</span>
          <span>Artwork</span>
          <span className="text-right">Amount</span>
          <span className="text-center">Status</span>
          <span className="text-right">Date</span>
        </div>
        <ul className="divide-y divide-canvas/10">
          {orders === null && (
            <li className="px-5 py-8 text-sm text-canvas/40">
              Loading orders…
            </li>
          )}
          {orders !== null && orders.length === 0 && (
            <li className="px-5 py-10 text-center">
              <ReceiptText className="mx-auto size-6 text-canvas/30" />
              <p className="mt-3 text-sm text-canvas/40">
                No orders placed yet.
              </p>
            </li>
          )}
          {(orders ?? []).map((o) => (
            <li
              key={o.id}
              className="grid gap-2 px-5 py-4 lg:grid-cols-[1.1fr_1fr_1fr_1.4fr_auto_auto_auto] lg:items-center lg:gap-4"
            >
              <p className="font-display text-sm font-semibold text-canvas">
                {o.orderNumber}
              </p>
              <p className="truncate text-sm text-canvas/70">{o.buyer}</p>
              <p className="truncate text-sm text-canvas/70">{o.artist}</p>
              <p className="truncate text-sm text-canvas/50">
                {o.artworkTitles || "—"}
              </p>
              <p className="text-sm font-semibold tabular-nums text-canvas lg:text-right">
                {formatPrice(o.amount)}
              </p>
              <p className="flex flex-wrap gap-1.5 lg:justify-center">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                    STATUS_TONE[o.status] ?? STATUS_TONE.confirmed
                  )}
                >
                  {o.status}
                </span>
                {o.paymentStatus !== "pending" && (
                  <span className="rounded-full bg-canvas/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-canvas/60 ring-1 ring-canvas/20">
                    {o.paymentStatus}
                  </span>
                )}
              </p>
              <p className="text-xs text-canvas/40 lg:text-right">
                {new Date(o.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
