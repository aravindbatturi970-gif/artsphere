import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Images,
  Send,
  ShoppingBag,
  ReceiptText,
  Wallet,
  PlusCircle,
  ArrowUpRight,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  ArtistPageHeading,
  ArtistStatCard,
} from "@/components/dashboard/ArtistDashboardLayout";
import { useAuth } from "@/lib/auth";
import { listArtistArtworks } from "@/lib/artist-artworks";
import { listArtistOrders, computeArtistStats } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";
import type { ArtistArtwork } from "@/types";

/**
 * Dashboard Overview — live totals computed from the artist's own
 * listings. Sales/orders/earnings are placeholder zeros until the
 * checkout and orders stages arrive (clearly labelled as such).
 */
export function ArtistOverviewPage() {
  const { user } = useAuth();
  const [works, setWorks] = useState<ArtistArtwork[] | null>(null);
  const [orderStats, setOrderStats] = useState({ totalSales: 0, pendingOrders: 0, earnings: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listArtistArtworks(user.id)
      .then((rows) => {
        if (!cancelled) setWorks(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load.");
      });
    listArtistOrders(user.id)
      .then((rows) => {
        if (!cancelled) setOrderStats(computeArtistStats(rows));
      })
      .catch(() => {
        /* Orders stay at zero; the Orders page surfaces the error. */
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const stats = {
    total: works?.length ?? 0,
    published: works?.filter((w) => w.status === "published").length ?? 0,
  };
  const catalogueValue = (works ?? [])
    .filter((w) => w.status === "published")
    .reduce((sum, w) => sum + w.price, 0);

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <ArtistPageHeading
          title={`Welcome back, ${user?.fullName.split(" ")[0] ?? "artist"}`}
          blurb="A quiet look at your studio — artwork, interest and earnings in one place."
        />

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ArtistStatCard
            icon={Images}
            value={String(stats.total)}
            label="Total artworks"
          />
          <ArtistStatCard
            icon={Send}
            value={String(stats.published)}
            label="Published"
          />
          <ArtistStatCard
            icon={ShoppingBag}
            value={String(orderStats.totalSales)}
            label="Total sales"
          />
          <ArtistStatCard
            icon={ReceiptText}
            value={String(orderStats.pendingOrders)}
            label="Pending orders"
          />
          <ArtistStatCard
            icon={Wallet}
            value={formatPrice(orderStats.earnings)}
            label="Earnings (expected)"
            accent
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100">
            <p className="eyebrow mb-2">Catalogue value</p>
            <p className="font-display text-3xl font-medium text-ink-950">
              {formatPrice(catalogueValue)}
            </p>
            <p className="mt-2 text-sm text-ink-500">
              Combined price of your published work.
            </p>
            <Link
              to="/dashboard/artist/artwork"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brass-700 transition-colors hover:text-brass-600"
            >
              Manage artwork
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div className="flex flex-col justify-between gap-5 rounded-xl bg-canvas-raised p-7 shadow-card ring-1 ring-ink-100">
            <div>
              <p className="eyebrow mb-2">Next step</p>
              <p className="font-display text-xl font-medium text-ink-950">
                {stats.total === 0
                  ? "Add your first artwork"
                  : "Grow your collection"}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Published pieces appear instantly on the public Discover page.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ButtonLink to="/dashboard/artist/add">
                <PlusCircle className="size-4.5" />
                Add Artwork
              </ButtonLink>
              <ButtonLink to="/discover" variant="secondary">
                View Discover page
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
