import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users as UsersIcon,
  Palette,
  Images,
  Send,
  ReceiptText,
  Wallet,
  Flag,
  ArrowUpRight,
} from "lucide-react";
import {
  AdminHeading,
  AdminCard,
} from "@/components/admin/AdminLayout";
import { useAuth } from "@/lib/auth";
import { loadAdminStats, type AdminStats } from "@/lib/admin";

/**
 * Admin Overview: platform-wide totals. Numbers come from the same data
 * layer the marketplace uses, so they reflect real state (demo or
 * Supabase). Revenue counts only paid orders — pending ones are not
 * revenue yet.
 */
export function AdminOverviewPage() {
  const { demoMode } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAdminStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load stats.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { icon: UsersIcon, label: "Total users", value: stats?.totalUsers },
    { icon: Palette, label: "Total artists", value: stats?.totalArtists },
    { icon: Images, label: "Total artworks", value: stats?.totalArtworks },
    { icon: Send, label: "Published artworks", value: stats?.publishedArtworks },
    { icon: ReceiptText, label: "Total orders", value: stats?.totalOrders },
    {
      icon: Wallet,
      label: "Revenue (paid)",
      value:
        stats === null
          ? null
          : `₹${stats.revenue.toLocaleString("en-IN")}`,
    },
    {
      icon: Flag,
      label: "Pending reports",
      value: stats === null ? null : String(stats.pendingReports),
      alert: (stats?.pendingReports ?? 0) > 0,
    },
  ];

  return (
    <div>
      <AdminHeading
        title="Overview"
        blurb="The whole platform at a glance."
      />

      {error && (
        <p className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, label, value, alert }) => (
          <AdminCard key={label}>
            <span
              className={
                alert
                  ? "flex size-10 items-center justify-center rounded-full bg-brass-500 text-ink-950"
                  : "flex size-10 items-center justify-center rounded-full bg-canvas/10 text-canvas"
              }
            >
              <Icon className="size-5" />
            </span>
            <p className="mt-4 font-display text-3xl font-medium text-canvas">
              {value ?? "…"}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-canvas/40">
              {label}
            </p>
          </AdminCard>
        ))}
      </div>

      {stats && stats.pendingReports > 0 && (
        <AdminCard className="mt-6 border-l-2 border-brass-500">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-canvas/80">
              {stats.pendingReports} open{" "}
              {stats.pendingReports === 1 ? "report needs" : "reports need"}{" "}
              review.
            </p>
            <Link
              to="/admin/reports"
              className="flex items-center gap-1.5 text-sm font-semibold text-brass-300 transition-colors hover:text-brass-200"
            >
              Open the queue
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </AdminCard>
      )}

      {demoMode && (
        <p className="mt-6 text-xs text-canvas/40">
          Demo mode — data lives in this browser. With Supabase credentials,
          these figures read from the live database.
        </p>
      )}
    </div>
  );
}
