import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, getSupabase } from "@/lib/supabase";
import { readModerationMap } from "@/lib/admin";
import {
  artistArtworkToCatalog,
  mergeCatalog,
} from "@/lib/catalog";
import { readDemoPublished, supabaseRowToArtwork } from "@/lib/artist-artworks";
import type { ArtistArtwork, Artwork } from "@/types";

/**
 * Published-upload cache for the public catalogue.
 *
 * Artist uploads live outside the seeded sample data, so public pages
 * merge them in. This module loads published listings (demo localStorage
 * store or the Supabase `artworks` table) into a small cache, notifies
 * subscribers after each load, and exposes a hook for pages.
 */

const DEMO_USERS_KEY = "artsphere:demo-users";

interface DemoUserLike {
  id?: unknown;
  fullName?: unknown;
  bio?: unknown;
  createdAt?: unknown;
}

function readDemoUsers(): DemoUserLike[] {
  try {
    const raw = window.localStorage.getItem(DEMO_USERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DemoUserLike[]) : [];
  } catch {
    return [];
  }
}

function demoUserName(artistId: string): string {
  const user = readDemoUsers().find((u) => u.id === artistId);
  return typeof user?.fullName === "string" && user.fullName.trim()
    ? user.fullName
    : "Independent Artist";
}

/* --------------------------- artist name lookup -------------------------- */

async function supabaseArtistNames(artistIds: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  if (!artistIds.length) return names;
  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, full_name")
    .in("id", artistIds);
  if (error) {
    console.error("Failed to load artist names:", error.message);
    return names;
  }
  for (const row of data ?? []) {
    if (row && typeof row.id === "string") {
      names.set(row.id, row.full_name ?? "Independent Artist");
    }
  }
  return names;
}

/* ------------------------------- load/sync ------------------------------- */

/**
 * Stage 9 moderation: in demo mode the rejected/removed map lives in
 * localStorage (Supabase mode enforces this in the read policy itself).
 * Rejected uploads never enter the public cache.
 */
function moderationFiltersOut(catalogId: string): boolean {
  if (isSupabaseConfigured) return false; // server-side via RLS
  const entry = readModerationMap()[catalogId];
  return entry?.status === "rejected" || entry?.status === "removed";
}

let cache: Artwork[] = [];
let loadedOnce = false;
let inflight: Promise<Artwork[]> | null = null;
const listeners = new Set<() => void>();

function publish(next: Artwork[]) {
  cache = next;
  loadedOnce = true;
  for (const listener of listeners) listener();
}

/** (Re)load published uploads into the cache. Safe to call repeatedly. */
export function refreshPublishedUploads(): Promise<Artwork[]> {
  if (!inflight) {
    inflight = (async () => {
      if (!isSupabaseConfigured) {
        const listings = readDemoPublished().filter(
          (listing) => !moderationFiltersOut(`up-${listing.id}`)
        );
        publish(
          listings.map((listing) =>
            artistArtworkToCatalog(listing, demoUserName(listing.artistId))
          )
        );
        return cache;
      }

      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("artworks")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to load published artwork:", error.message);
        publish([]);
        return cache;
      }
      const listings: ArtistArtwork[] = (data ?? []).map(supabaseRowToArtwork);
      const names = await supabaseArtistNames([
        ...new Set(listings.map((l) => l.artistId)),
      ]);
      publish(
        listings.map((listing) =>
          artistArtworkToCatalog(
            listing,
            names.get(listing.artistId) ?? "Independent Artist"
          )
        )
      );
      return cache;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export interface PublicCatalog {
  /** Real published uploads only. */
  uploads: Artwork[];
  /** Uploads merged with the seeded sample collection. */
  catalog: Artwork[];
  /** True once the first load finished. */
  ready: boolean;
}

/** React hook: merged catalogue for public pages, refreshed on mount. */
export function usePublicCatalog(): PublicCatalog {
  const [uploads, setUploads] = useState<Artwork[]>(cache);
  const [ready, setReady] = useState(loadedOnce);

  useEffect(() => {
    const listener = () => {
      setUploads([...cache]);
      setReady(true);
    };
    listeners.add(listener);
    void refreshPublishedUploads();
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const catalog = useMemo(() => mergeCatalog(uploads), [uploads]);
  return { uploads, catalog, ready };
}

/** Imperative refresh for callers that just mutated listings. */
export function useRefreshPublicUploads(): () => Promise<Artwork[]> {
  return useCallback(() => refreshPublishedUploads(), []);
}

/* --------------------------- user artist profile -------------------------- */

export interface UserArtistProfile {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  joined: string;
}

/**
 * Resolve a `user-<id>` artist route. Demo mode reads the local demo
 * users; Supabase mode reads the `profiles` table.
 */
export async function getUserArtistProfile(
  userId: string
): Promise<UserArtistProfile | null> {
  if (!isSupabaseConfigured) {
    const user = readDemoUsers().find((u) => u.id === userId);
    if (!user || typeof user.id !== "string") return null;
    return {
      id: user.id,
      name:
        typeof user.fullName === "string" && user.fullName.trim()
          ? user.fullName
          : "Independent Artist",
      bio: typeof user.bio === "string" ? user.bio : null,
      avatarUrl: null,
      joined:
        typeof user.createdAt === "string"
          ? user.createdAt
          : new Date().toISOString(),
    };
  }

  const { data, error } = await getSupabase()
    .from("profiles")
    .select("id, full_name, bio, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.full_name ?? "Independent Artist",
    bio: data.bio ?? null,
    avatarUrl: data.avatar_url ?? null,
    joined: data.created_at ?? new Date().toISOString(),
  };
}
