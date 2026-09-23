import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2, PlusCircle, ImageIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import {
  ArtistPageHeading,
} from "@/components/dashboard/ArtistDashboardLayout";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/lib/shop";
import {
  deleteArtwork,
  listArtistArtworks,
} from "@/lib/artist-artworks";
import { formatPrice } from "@/lib/utils";
import type { ArtistArtwork, ArtworkStatus } from "@/types";

const STATUS_TONES: Record<
  ArtworkStatus,
  "neutral" | "brass" | "dark" | "success"
> = {
  draft: "neutral",
  published: "brass",
  sold: "dark",
  archived: "success",
};

const STATUS_LABELS: Record<ArtworkStatus, string> = {
  draft: "Draft",
  published: "Published",
  sold: "Sold",
  archived: "Archived",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * My Artwork — every listing the artist has uploaded, with status,
 * edit and delete. Deletes ask for confirmation (the image object is
 * removed from storage too, in Supabase mode).
 */
export function ArtistMyArtworkPage() {
  const { user } = useAuth();
  const { notify } = useShop();
  const [works, setWorks] = useState<ArtistArtwork[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ArtistArtwork | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const rows = await listArtistArtworks(user.id);
      setWorks(rows);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load artwork.");
      setWorks([]);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete() {
    if (!user || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteArtwork(user.id, pendingDelete.id);
      notify(`"${pendingDelete.title}" deleted`);
      setPendingDelete(null);
      await load();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ArtistPageHeading
            title="My Artwork"
            blurb="Everything you've uploaded — drafts stay private until you publish."
          />
          <ButtonLink to="/dashboard/artist/add" className="mb-8">
            <PlusCircle className="size-4.5" />
            Add Artwork
          </ButtonLink>
        </div>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}

        {works === null ? (
          <p className="py-16 text-center text-sm text-ink-400">
            Loading your artwork…
          </p>
        ) : works.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-canvas-raised p-16 text-center shadow-card ring-1 ring-ink-100">
            <ImageIcon className="size-8 text-ink-300" />
            <p className="font-display text-2xl font-medium text-ink-950">
              No artwork yet
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-ink-500">
              Upload your first piece — once published it appears on the public
              Discover page for buyers worldwide.
            </p>
            <ButtonLink to="/dashboard/artist/add" className="mt-2">
              <PlusCircle className="size-4.5" />
              Add your first artwork
            </ButtonLink>
          </div>
        ) : (
          <Reveal>
            <div className="overflow-hidden rounded-xl bg-canvas-raised shadow-card ring-1 ring-ink-100">
              {/* Header row (desktop) */}
              <div className="hidden grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))_auto] gap-4 border-b border-ink-100 px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400 lg:grid">
                <span>Artwork</span>
                <span>Price</span>
                <span>Category</span>
                <span>Status</span>
                <span>Created</span>
                <span className="sr-only">Actions</span>
              </div>

              <ul className="divide-y divide-ink-100">
                {works.map((work) => (
                  <li
                    key={work.id}
                    className="grid grid-cols-1 gap-4 px-6 py-5 transition-colors hover:bg-ink-50/60 lg:grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))_auto] lg:items-center"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                        {work.imageUrl ? (
                          <img
                            src={work.imageUrl}
                            alt={work.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="size-5 text-ink-300" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-medium text-ink-950">
                          {work.title}
                        </p>
                        <p className="text-xs text-ink-400">
                          {work.type === "original"
                            ? "Original"
                            : work.type === "print"
                              ? "Print"
                              : "Digital"}{" "}
                          · Qty {work.quantity}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-ink-900 lg:text-base">
                      {formatPrice(work.price, work.currency)}
                    </p>

                    <p className="text-sm text-ink-600">{work.category}</p>

                    <p>
                      <Badge tone={STATUS_TONES[work.status]}>
                        {STATUS_LABELS[work.status]}
                      </Badge>
                    </p>

                    <p className="text-sm text-ink-500">
                      {formatDate(work.createdAt)}
                    </p>

                    <div className="flex items-center gap-2 lg:justify-end">
                      <Link
                        to={`/dashboard/artist/edit/${work.id}`}
                        aria-label={`Edit ${work.title}`}
                        className="inline-flex size-9 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(work)}
                        aria-label={`Delete ${work.title}`}
                        className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </Container>

      {/* Delete confirmation */}
      <Modal
        open={pendingDelete !== null}
        onClose={() => (deleting ? undefined : setPendingDelete(null))}
        title="Delete artwork?"
      >
        {pendingDelete && (
          <div>
            <p className="text-sm leading-relaxed text-ink-600">
              This permanently removes “{pendingDelete.title}” and its image.
              This action cannot be undone.
            </p>
            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                disabled={deleting}
                className="h-10 cursor-pointer rounded-md px-4 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 transition-colors hover:bg-ink-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 cursor-pointer rounded-md bg-red-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
