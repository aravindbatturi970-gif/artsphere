import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

const STORAGE_KEY = "artsphere:favorites";

/**
 * Wishlist / favorites store (Stage 7).
 *
 * The interface is unchanged since Stage 2 (likedIds / isLiked /
 * toggleLike) so every heart on the site keeps working — but the set is
 * now persisted per account:
 * - Supabase configured → the `wishlist_items` table (RLS: own rows).
 * - Demo mode → localStorage keyed by user id, guests under "guest",
 *   with guest likes merging into the account on sign-in.
 */

interface FavoritesContextValue {
  /** IDs the visitor has saved in this browser / account. */
  likedIds: ReadonlySet<string>;
  isLiked: (id: string) => boolean;
  toggleLike: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/** Per-owner saved likes: `{ guest: string[], users: { [id]: string[] } }`. */
interface StoredLikes {
  guest: string[];
  users: Record<string, string[]>;
}

function readStored(): StoredLikes {
  const empty: StoredLikes = { guest: [], users: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);

    // Migrate the Stage 2 flat array format.
    if (Array.isArray(parsed)) {
      return {
        guest: parsed.filter((v): v is string => typeof v === "string"),
        users: {},
      };
    }
    if (typeof parsed !== "object" || parsed === null) return empty;
    const obj = parsed as Record<string, unknown>;
    const users: Record<string, string[]> = {};
    if (typeof obj.users === "object" && obj.users !== null) {
      for (const [userId, ids] of Object.entries(
        obj.users as Record<string, unknown>
      )) {
        if (Array.isArray(ids)) {
          users[userId] = ids.filter((v): v is string => typeof v === "string");
        }
      }
    }
    const guest = Array.isArray(obj.guest)
      ? obj.guest.filter((v): v is string => typeof v === "string")
      : [];
    return { guest, users };
  } catch {
    return empty;
  }
}

function writeStored(next: StoredLikes): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — likes stay in-memory for the session.
  }
}

function slotFor(prev: StoredLikes, ownerId: string, ids: string[]): StoredLikes {
  return ownerId === "guest"
    ? { ...prev, guest: ids }
    : { ...prev, users: { ...prev.users, [ownerId]: ids } };
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [stored, setStored] = useState<StoredLikes>({ guest: [], users: {} });
  const [hydrated, setHydrated] = useState(false);
  const syncedUser = useRef<string | null>(null);

  useEffect(() => {
    setStored(readStored());
    setHydrated(true);
  }, []);

  const ownerId = isAuthenticated && user ? user.id : "guest";
  const likedIds = useMemo(() => {
    if (!hydrated) return new Set<string>();
    const ids = ownerId === "guest" ? stored.guest : stored.users[ownerId] ?? [];
    return new Set(ids);
  }, [hydrated, ownerId, stored]);

  /* --------------------- Supabase account sync --------------------------- */

  // Demo mode: merge guest likes into the account slot on sign-in.
  useEffect(() => {
    if (!hydrated || isSupabaseConfigured || !user) return;
    if (syncedUser.current === user.id) return;
    syncedUser.current = user.id;

    setStored((prev) => {
      const guestLikes = prev.guest;
      const own = prev.users[user.id] ?? [];
      if (!guestLikes.length) return prev;
      const merged = [...new Set([...own, ...guestLikes])];
      const next = { guest: [], users: { ...prev.users, [user.id]: merged } };
      writeStored(next);
      return next;
    });
  }, [hydrated, user, isSupabaseConfigured]);

  // Supabase mode: pull the account's wishlist once after sign-in, merging
  // guest likes gathered while browsing.
  useEffect(() => {
    if (!hydrated || !isSupabaseConfigured || !user) return;
    if (syncedUser.current === user.id) return;
    syncedUser.current = user.id;

    void (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("wishlist_items")
        .select("artwork_id")
        .eq("user_id", user.id);
      if (error) {
        console.error("Wishlist load failed:", error.message);
        return;
      }
      const remote = (data ?? [])
        .map((row) => row.artwork_id as string)
        .filter((id) => typeof id === "string");

      const guestLikes = readStored().guest;
      const missing = guestLikes.filter((id) => !remote.includes(id));
      const merged = [...new Set([...remote, ...guestLikes])];

      setStored((prev) => slotFor(prev, user.id, merged));
      if (missing.length) {
        const { error: insertErr } = await supabase
          .from("wishlist_items")
          .insert(
            missing.map((artworkId) => ({
              user_id: user.id,
              artwork_id: artworkId,
            }))
          );
        if (insertErr) {
          console.error("Wishlist merge failed:", insertErr.message);
        }
      }
    })();
  }, [hydrated, user, isSupabaseConfigured]);

  const pushWishlist = useCallback(
    async (artworkId: string, saved: boolean) => {
      if (!isSupabaseConfigured || !user) return;
      const supabase = getSupabase();
      if (saved) {
        const { error } = await supabase.from("wishlist_items").upsert(
          { user_id: user.id, artwork_id: artworkId },
          { onConflict: "user_id,artwork_id" }
        );
        if (error) console.error("Wishlist sync failed:", error.message);
      } else {
        const { error } = await supabase
          .from("wishlist_items")
          .delete()
          .eq("user_id", user.id)
          .eq("artwork_id", artworkId);
        if (error) console.error("Wishlist sync failed:", error.message);
      }
    },
    [user, isSupabaseConfigured]
  );

  const toggleLike = useCallback(
    (id: string) => {
      const isSaved = !likedIds.has(id);
      const nextIds = [...likedIds].filter((v) => v !== id);
      if (isSaved) nextIds.push(id);
      setStored((prev) => {
        const next = slotFor(prev, ownerId, nextIds);
        if (!isSupabaseConfigured) writeStored(next);
        return next;
      });
      void pushWishlist(id, isSaved);
    },
    [likedIds, ownerId, pushWishlist, isSupabaseConfigured]
  );

  const isLiked = useCallback((id: string) => likedIds.has(id), [likedIds]);

  const value = useMemo(
    () => ({ likedIds, isLiked, toggleLike }),
    [likedIds, isLiked, toggleLike]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used inside <FavoritesProvider>");
  }
  return ctx;
}
