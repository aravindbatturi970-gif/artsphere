import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Palette, ExternalLink } from "lucide-react";
import { AdminHeading, AdminCard } from "@/components/admin/AdminLayout";
import { listArtists, type AdminArtist } from "@/lib/admin";

/**
 * Admin Artists: the studio roster — registered artist accounts plus the
 * seeded sample artists that populate the marketplace catalogue.
 */
export function AdminArtistsPage() {
  const [artists, setArtists] = useState<AdminArtist[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listArtists()
      .then((rows) => {
        if (!cancelled) setArtists(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load artists.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <AdminHeading
        title="Artists"
        blurb="Every studio selling on ArtSphere."
      />

      {error && (
        <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <AdminCard className="!p-0">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-canvas/10 px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-canvas/40">
          <span>Artist</span>
          <span className="text-right">Artworks</span>
          <span className="text-right">Status</span>
        </div>
        <ul className="divide-y divide-canvas/10">
          {artists === null && (
            <li className="px-5 py-8 text-sm text-canvas/40">
              Loading artists…
            </li>
          )}
          {artists !== null && artists.length === 0 && (
            <li className="px-5 py-8 text-sm text-canvas/40">
              No artists yet.
            </li>
          )}
          {(artists ?? []).map((a) => (
            <li
              key={a.id}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold text-canvas">
                  <Palette className="size-4 shrink-0 text-canvas/40" />
                  {a.name}
                </p>
                <p className="truncate text-xs text-canvas/40">
                  {a.email ?? "Sample catalogue artist"}
                  {a.accountStatus === "disabled" && " · disabled"}
                </p>
              </div>
              <p className="text-right text-sm tabular-nums text-canvas/70">
                {a.artworkCount}
              </p>
              <p className="text-right">
                {a.email ? (
                  <Link
                    to={`/artist/user-${a.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brass-300 transition-colors hover:text-brass-200"
                  >
                    Profile
                    <ExternalLink className="size-3" />
                  </Link>
                ) : (
                  <span className="text-xs text-canvas/30">seed</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </AdminCard>
    </div>
  );
}
