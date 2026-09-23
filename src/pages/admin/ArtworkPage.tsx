import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Check,
  X,
  Trash2,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { AdminHeading, AdminCard } from "@/components/admin/AdminLayout";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import {
  listAllArtworks,
  setModeration,
  AdminDataError,
  type AdminArtwork,
} from "@/lib/admin";
import { formatPrice, cn } from "@/lib/utils";
import type { ModerationStatus } from "@/types";

const MOD_LABEL: Record<string, { label: string; tone: string }> = {
  approved: {
    label: "Approved",
    tone: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  },
  rejected: {
    label: "Rejected",
    tone: "bg-red-500/15 text-red-300 ring-red-500/30",
  },
  removed: {
    label: "Removed",
    tone: "bg-red-500/15 text-red-300 ring-red-500/30",
  },
};

/**
 * Admin Artwork moderation: approve / reject / remove. In Supabase mode
 * the read policy hides non-approved rows from the public catalogue —
 * rejecting here immediately unlists the piece, no UI tricks involved.
 */
export function AdminArtworkPage() {
  const [artworks, setArtworks] = useState<AdminArtwork[] | null>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAllArtworks()
      .then((rows) => {
        if (!cancelled) setArtworks(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load artwork."
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return artworks ?? [];
    return (artworks ?? []).filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.artist.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
    );
  }, [artworks, query]);

  async function act(
    artwork: AdminArtwork,
    status: ModerationStatus,
    withNote?: string
  ) {
    setError(null);
    setBusy(artwork.id);
    try {
      await setModeration(artwork.id, status, withNote ?? null);
      setArtworks((prev) =>
        (prev ?? []).map((a) =>
          a.id === artwork.id
            ? { ...a, moderation: status, moderationNote: withNote ?? null }
            : a
        )
      );
    } catch (err) {
      setError(
        err instanceof AdminDataError ? err.message : "Moderation action failed."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <AdminHeading
        title="Artwork"
        blurb="Approve new listings, reject or remove violations. Rejected pieces disappear from the public catalogue immediately."
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-canvas/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, artist or category…"
          className="w-full rounded-lg border border-canvas/15 bg-canvas/[0.04] py-2.5 pl-10 pr-4 text-sm text-canvas placeholder:text-canvas/30 focus:border-brass-500/60 focus:outline-none focus:ring-2 focus:ring-brass-500/20"
        />
      </div>

      {error && (
        <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <AdminCard className="!p-0">
        <ul className="divide-y divide-canvas/10">
          {artworks === null && (
            <li className="px-5 py-8 text-sm text-canvas/40">Loading…</li>
          )}
          {filtered.map((a) => {
            const mod = a.moderation ?? "approved";
            return (
              <li key={a.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-canvas/15">
                    <ArtPlaceholder
                      artwork={a}
                      imageUrl={a.imageUrl}
                      alt={a.title}
                      className="!aspect-square"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-canvas">
                      <Link
                        to={`/artwork/${a.id}`}
                        className="truncate transition-colors hover:text-brass-300"
                      >
                        {a.title}
                      </Link>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                          MOD_LABEL[mod].tone
                        )}
                      >
                        {MOD_LABEL[mod].label}
                      </span>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-canvas/40">
                      <Link
                        to={`/artist/${a.artistId}`}
                        className="inline-flex items-center gap-1 transition-colors hover:text-canvas"
                      >
                        {a.artist}
                        <ExternalLink className="size-3" />
                      </Link>
                      <span>· {a.category}</span>
                      <span>· {formatPrice(a.price, a.currency)}</span>
                    </p>
                    {a.moderationNote && (
                      <p className="mt-1 text-xs italic text-canvas/50">
                        Note: {a.moderationNote}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {mod !== "approved" && (
                      <button
                        type="button"
                        onClick={() => void act(a, "approved")}
                        disabled={busy === a.id}
                        title="Approve"
                        className="cursor-pointer rounded-full bg-emerald-500/10 p-2 text-emerald-300 ring-1 ring-emerald-500/30 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {mod === "rejected" || mod === "removed" ? (
                          <RotateCcw className="size-4" />
                        ) : (
                          <Check className="size-4" />
                        )}
                      </button>
                    )}
                    {mod !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => void act(a, "rejected", "Policy violation")}
                        disabled={busy === a.id}
                        title="Reject"
                        className="cursor-pointer rounded-full bg-red-500/10 p-2 text-red-300 ring-1 ring-red-500/30 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                    {mod !== "removed" && (
                      <button
                        type="button"
                        onClick={() => void act(a, "removed", "Removed by admin")}
                        disabled={busy === a.id}
                        title="Remove permanently"
                        className="cursor-pointer rounded-full bg-red-500/10 p-2 text-red-300 ring-1 ring-red-500/30 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </AdminCard>
    </div>
  );
}
