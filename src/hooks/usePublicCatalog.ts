import { useMemo } from "react";
import { mergeCatalog } from "@/lib/catalog";
import {
  usePublicCatalog as useUploadsCatalog,
} from "@/lib/public-uploads";
import type { Artwork } from "@/types";

/**
 * Public catalogue hook: merges seeded SAMPLE_ARTWORKS with published
 * artist uploads (demo store or Supabase). Subscribes to upload-cache
 * updates so new publications appear without a manual reload.
 */
export function usePublicCatalog(): {
  catalog: Artwork[];
  uploads: Artwork[];
  ready: boolean;
} {
  const { uploads, ready } = useUploadsCatalog();
  const catalog = useMemo(() => mergeCatalog(uploads), [uploads]);
  return { catalog, uploads, ready };
}

/** One-off lookup of a single catalogue artwork (uploads first). */
export function useCatalogArtwork(id: string | undefined): Artwork | undefined {
  const { catalog } = usePublicCatalog();
  return useMemo(
    () => (id ? catalog.find((a) => a.id === id) : undefined),
    [catalog, id]
  );
}

/** Artworks for one `user-<id>` or sample artist id, from the merged catalogue. */
export function useArtistCatalogWorks(artistId: string | undefined): Artwork[] {
  const { catalog } = usePublicCatalog();
  return useMemo(
    () => (artistId ? catalog.filter((a) => a.artistId === artistId) : []),
    [catalog, artistId]
  );
}
