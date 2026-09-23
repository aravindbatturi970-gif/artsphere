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
import { CheckCircle2 } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { usePublicCatalog } from "@/lib/public-uploads";
import { cn } from "@/lib/utils";
import type { Artwork } from "@/types";

/**
 * Buyer commerce store (Stage 7).
 *
 * Cart items live per user:
 * - Supabase configured → the `cart_items` table (RLS: own rows only).
 * - Demo mode / guests → localStorage under the user id (or "guest"),
 *   with the guest cart merging into the account on sign-in so nothing
 *   gathered while browsing is lost.
 *
 * Wishlist lives in the favorites context (per-user persisted the same
 * way), so every heart on the site feeds the wishlist page. Sold or
 * soon-arriving artwork can never be added to the cart.
 */

export interface CartItem {
  artworkId: string;
  quantity: number;
  addedAt: number;
}

export interface CartLine {
  item: CartItem;
  artwork: Artwork;
  lineTotal: number;
  /** True when the artwork can no longer be purchased. */
  unavailable: boolean;
}

interface Toast {
  id: number;
  message: string;
}

interface ShopContextValue {
  /** Raw cart rows (artwork may have been unlisted since adding). */
  cart: CartItem[];
  /** Cart rows resolved against the catalogue, unavailable flagged. */
  lines: CartLine[];
  cartCount: number;
  purchasableCount: number;
  cartTotal: number;
  addToCart: (artwork: Artwork, quantity?: number) => void;
  removeFromCart: (artworkId: string) => void;
  /** Remove several rows at once (used to clear purchased lines). */
  removeItems: (artworkIds: string[]) => void;
  setQuantity: (artworkId: string, quantity: number) => void;
  inCart: (artworkId: string) => boolean;
  quantityOf: (artworkId: string) => number;
  notify: (message: string) => void;
}

const ShopContext = createContext<ShopContextValue | null>(null);

/* ------------------------------ storage --------------------------------- */

const CART_KEY = "artsphere:cart";

/**
 * Cart payloads are versioned per owner so a guest cart and user carts
 * coexist; on sign-in the guest rows merge into the user's saved rows.
 */
interface StoredCart {
  guest: CartItem[];
  users: Record<string, CartItem[]>;
}

function readStored(): StoredCart {
  const empty: StoredCart = { guest: [], users: {} };
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) return empty;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return empty;
    const obj = parsed as Record<string, unknown>;

    // Migrate the Stage 4 flat array format if present.
    if (Array.isArray(parsed)) {
      const legacy = (parsed as unknown[])
        .filter(
          (v): v is { artworkId: string; addedAt?: number } =>
            typeof v === "object" &&
            v !== null &&
            typeof (v as { artworkId?: unknown }).artworkId === "string"
        )
        .map((v) => ({
          artworkId: v.artworkId,
          quantity: 1,
          addedAt: v.addedAt ?? Date.now(),
        }));
      return { guest: legacy, users: {} };
    }

    const users: Record<string, CartItem[]> = {};
    if (typeof obj.users === "object" && obj.users !== null) {
      for (const [userId, rows] of Object.entries(
        obj.users as Record<string, unknown>
      )) {
        if (Array.isArray(rows)) {
          users[userId] = rows.filter(
            (row): row is CartItem =>
              typeof row === "object" &&
              row !== null &&
              typeof (row as CartItem).artworkId === "string"
          );
        }
      }
    }
    const guest = Array.isArray(obj.guest)
      ? (obj.guest as unknown[]).filter(
          (row): row is CartItem =>
            typeof row === "object" &&
            row !== null &&
            typeof (row as CartItem).artworkId === "string"
        )
      : [];
    return { guest, users };
  } catch {
    return empty;
  }
}

function writeStored(next: StoredCart): void {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the cart stays in-memory for the session.
  }
}

/** Cap a quantity by artwork availability (one-of-a-kind originals cap at 1). */
function capQuantity(artwork: Artwork, requested: number): number {
  if (artwork.type === "original") return 1;
  return Math.max(1, Math.min(requested, 12));
}

function mergeCarts(primary: CartItem[], secondary: CartItem[]): CartItem[] {
  const byId = new Map<string, CartItem>();
  // `secondary` (guest) rows go in first so account rows win on conflict.
  for (const item of [...secondary, ...primary]) {
    byId.set(item.artworkId, item);
  }
  return [...byId.values()];
}

/* ------------------------------ toasts ---------------------------------- */

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const notify = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message }]);
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timers.current.delete(id);
    }, 2600);
    timers.current.set(id, timer);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) window.clearTimeout(timer);
    };
  }, []);

  return { toasts, notify };
}

/* ------------------------------ provider -------------------------------- */

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { catalog } = usePublicCatalog();
  const { toasts, notify } = useToasts();

  const [stored, setStored] = useState<StoredCart>({ guest: [], users: {} });
  const [hydrated, setHydrated] = useState(false);
  const prevUserId = useRef<string | null>(null);

  // Hydrate once on mount.
  useEffect(() => {
    setStored(readStored());
    setHydrated(true);
  }, []);

  const ownerId = isAuthenticated && user ? user.id : "guest";
  const activeCart = useMemo(() => {
    if (!hydrated) return [];
    return ownerId === "guest" ? stored.guest : stored.users[ownerId] ?? [];
  }, [hydrated, ownerId, stored]);

  /**
   * Single mutation path: localStorage is the source of truth, every
   * change is written through immediately, and React state mirrors it.
   * (A persist-after-render effect silently lost writes here before —
   * keep all mutations going through `commit`.)
   */
  const commit = useCallback(
    (mutate: (fresh: StoredCart) => StoredCart) => {
      const fresh = readStored();
      const next = mutate(fresh);
      writeStored(next);
      setStored(next);
    },
    []
  );

  /** Rows for the active owner within a full stored snapshot. */
  function slotWith(
    snapshot: StoredCart,
    rows: CartItem[]
  ): StoredCart {
    return ownerId === "guest"
      ? { ...snapshot, guest: rows }
      : { ...snapshot, users: { ...snapshot.users, [ownerId]: rows } };
  }

  function rowsIn(snapshot: StoredCart): CartItem[] {
    return ownerId === "guest" ? snapshot.guest : snapshot.users[ownerId] ?? [];
  }

  // On sign-in: load the account's saved cart (Supabase) or its local
  // slot (demo), merging in the guest cart so nothing is lost.
  useEffect(() => {
    if (!hydrated || !isAuthenticated || !user) return;
    if (prevUserId.current === user.id) return;
    prevUserId.current = user.id;

    const guest = readStored().guest;

    if (isSupabaseConfigured) {
      void (async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase
          .from("cart_items")
          .select("artwork_id, quantity")
          .eq("user_id", user.id);
        if (error) {
          console.error("Cart load failed:", error.message);
          return;
        }
        const remote: CartItem[] = (data ?? []).map((row) => ({
          artworkId: row.artwork_id as string,
          quantity: Math.max(1, Math.min(Number(row.quantity) || 1, 99)),
          addedAt: Date.now(),
        }));
        const merged = mergeCarts(remote, guest);
        commit((fresh) => ({
          guest: [],
          users: { ...fresh.users, [user.id]: merged },
        }));
        const missing = guest.filter((g) => !remote.some((r) => r.artworkId === g.artworkId));
        if (missing.length) {
          const { error: insertErr } = await supabase.from("cart_items").insert(
            missing.map((item) => ({
              user_id: user.id,
              artwork_id: item.artworkId,
              quantity: item.quantity,
            }))
          );
          if (insertErr) console.error("Cart merge failed:", insertErr.message);
        }
        if (merged.length) notify("Your cart is up to date for your account");
      })();
      return;
    }

    const userRows = readStored().users[user.id] ?? [];
    if (!guest.length && !userRows.length) return;

    // Demo mode: merge into the user's stored slot.
    commit((fresh) => ({
      guest: [],
      users: {
        ...fresh.users,
        [user.id]: mergeCarts(fresh.users[user.id] ?? [], fresh.guest),
      },
    }));
    if (guest.length) notify("Your guest cart was added to your account");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated, user?.id, commit]);

  // On sign-out: reset the merge bookkeeping so the next sign-in merges
  // again. The account cart stays saved under its own slot.
  useEffect(() => {
    if (!hydrated || isAuthenticated) return;
    if (prevUserId.current !== null) {
      prevUserId.current = null;
    }
  }, [hydrated, isAuthenticated]);

  /* --------------------------- Supabase sync ---------------------------- */

  const pushRow = useCallback(
    async (artworkId: string, quantity: number) => {
      if (!isSupabaseConfigured || !user) return;
      const { error } = await getSupabase()
        .from("cart_items")
        .upsert(
          { user_id: user.id, artwork_id: artworkId, quantity },
          { onConflict: "user_id,artwork_id" }
        );
      if (error) console.error("Cart sync failed:", error.message);
    },
    [user]
  );

  const deleteRow = useCallback(
    async (artworkId: string) => {
      if (!isSupabaseConfigured || !user) return;
      const { error } = await getSupabase()
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("artwork_id", artworkId);
      if (error) console.error("Cart sync failed:", error.message);
    },
    [user]
  );

  /* ------------------------------ actions ------------------------------- */

  const addToCart = useCallback(
    (artwork: Artwork, quantity = 1) => {
      if (artwork.availability !== "available") {
        notify(
          artwork.availability === "sold"
            ? "This piece has been sold and can't be added"
            : "This piece isn't available yet — save it to your wishlist"
        );
        return;
      }
      const capped = capQuantity(artwork, quantity);
      commit((fresh) => {
        const rows = rowsIn(fresh);
        const existing = rows.find((r) => r.artworkId === artwork.id);
        const nextRows = existing
          ? rows.map((r) =>
              r.artworkId === artwork.id
                ? { ...r, quantity: Math.min(capQuantity(artwork, r.quantity + capped), 99) }
                : r
            )
          : [
              ...rows,
              { artworkId: artwork.id, quantity: capped, addedAt: Date.now() },
            ];
        return slotWith(fresh, nextRows);
      });
      void pushRow(artwork.id, capped);
      notify("Added to your cart");
    },
    [commit, ownerId, pushRow, notify]
  );

  const removeFromCart = useCallback(
    (artworkId: string) => {
      commit((fresh) =>
        slotWith(
          fresh,
          rowsIn(fresh).filter((r) => r.artworkId !== artworkId)
        )
      );
      void deleteRow(artworkId);
    },
    [commit, ownerId, deleteRow]
  );

  const removeItems = useCallback(
    (artworkIds: string[]) => {
      const ids = new Set(artworkIds);
      commit((fresh) =>
        slotWith(
          fresh,
          rowsIn(fresh).filter((r) => !ids.has(r.artworkId))
        )
      );
      if (isSupabaseConfigured && user) {
        void (async () => {
          const { error } = await getSupabase()
            .from("cart_items")
            .delete()
            .eq("user_id", user.id)
            .in("artwork_id", artworkIds);
          if (error) console.error("Cart sync failed:", error.message);
        })();
      }
    },
    [commit, ownerId, isSupabaseConfigured, user]
  );

  const setQuantity = useCallback(
    (artworkId: string, quantity: number) => {
      commit((fresh) => {
        const rows = rowsIn(fresh);
        const nextRows =
          quantity <= 0
            ? rows.filter((r) => r.artworkId !== artworkId)
            : rows.map((r) =>
                r.artworkId === artworkId
                  ? { ...r, quantity: Math.min(quantity, 99) }
                  : r
              );
        return slotWith(fresh, nextRows);
      });
      if (quantity <= 0) {
        void deleteRow(artworkId);
      } else {
        void pushRow(artworkId, Math.min(quantity, 99));
      }
    },
    [commit, ownerId, pushRow, deleteRow]
  );

  const inCart = useCallback(
    (artworkId: string) => activeCart.some((r) => r.artworkId === artworkId),
    [activeCart]
  );

  const quantityOf = useCallback(
    (artworkId: string) =>
      activeCart.find((r) => r.artworkId === artworkId)?.quantity ?? 0,
    [activeCart]
  );

  /* ------------------------- derived cart lines -------------------------- */

  /** Cart rows resolved against the full catalogue (samples + uploads). */
  const lines = useMemo<CartLine[]>(() => {
    if (!activeCart.length) return [];
    const byId = new Map(catalog.map((a) => [a.id, a]));
    return activeCart
      .map((item) => {
        const artwork = byId.get(item.artworkId);
        if (!artwork) return null; // unlisted since adding — hidden, not dropped
        return {
          item,
          artwork,
          lineTotal: artwork.price * item.quantity,
          unavailable: artwork.availability !== "available",
        };
      })
      .filter((line): line is CartLine => line !== null);
  }, [activeCart, catalog]);

  const purchasableCount = useMemo(
    () => lines.filter((l) => !l.unavailable).length,
    [lines]
  );

  const cartTotal = useMemo(
    () =>
      lines
        .filter((l) => !l.unavailable)
        .reduce((sum, l) => sum + l.lineTotal, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      cart: activeCart,
      lines,
      cartCount: activeCart.reduce((sum, r) => sum + r.quantity, 0),
      purchasableCount,
      cartTotal,
      addToCart,
      removeFromCart,
      removeItems,
      setQuantity,
      inCart,
      quantityOf,
      notify,
    }),
    [
      activeCart,
      lines,
      purchasableCount,
      cartTotal,
      addToCart,
      removeFromCart,
      removeItems,
      setQuantity,
      inCart,
      quantityOf,
      notify,
    ]
  );

  return (
    <ShopContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex w-full items-center gap-2.5 rounded-full bg-ink-950/95 px-5 py-3 text-sm font-medium text-canvas shadow-modal",
              "animate-fade-up"
            )}
          >
            <CheckCircle2 className="size-4.5 shrink-0 text-brass-400" />
            {toast.message}
          </div>
        ))}
      </div>
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    throw new Error("useShop must be used inside <ShopProvider>");
  }
  return ctx;
}
