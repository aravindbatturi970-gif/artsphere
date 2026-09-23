import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { PAYMENT_PROVIDER } from "@/lib/payments";
import type {
  Artwork,
  Order,
  OrderItem,
  OrderStatus,
  ShippingDetails,
} from "@/types";

/**
 * Orders data layer (Stage 8).
 *
 * - Supabase configured: orders/order_items/order_shipping tables (RLS:
 *   buyers see their own, artists see orders for their work, admins audit).
 * - Demo mode: the same shapes in localStorage, so the checkout flow is
 *   fully testable before credentials exist. Payment status stays
 *   'pending' in both modes — no fake successful payments.
 */

/* ------------------------------ validation ------------------------------ */

export interface ShippingDraft {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d][\d\s\-()]{5,19}$/;

export function validateShipping(draft: ShippingDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.fullName.trim().length < 2) {
    errors.fullName = "Full name is required.";
  }
  if (!EMAIL_RE.test(draft.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!PHONE_RE.test(draft.phone.trim())) {
    errors.phone = "Enter a valid phone number.";
  }
  if (draft.address.trim().length < 5) {
    errors.address = "Street address is required.";
  }
  if (!draft.city.trim()) {
    errors.city = "City is required.";
  }
  if (!draft.state.trim()) {
    errors.state = "State is required.";
  }
  if (!/^\d{4,10}$/.test(draft.postalCode.trim())) {
    errors.postalCode = "Enter a valid postal code.";
  }
  if (!draft.country.trim()) {
    errors.country = "Country is required.";
  }
  return errors;
}

/* ------------------------------ order numbers --------------------------- */

/**
 * Human-friendly order number: AS-2026-4KX92Q. Collision-safe enough at
 * this scale; the unique constraint in Postgres is the real guarantee.
 */
export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `AS-${year}-${code}`;
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/* --------------------------- snapshot building --------------------------- */

export interface CartLineSnapshot {
  item: { artworkId: string; quantity: number };
  artwork: Artwork;
}

/**
 * Snapshot a cart line into an immutable order item. Uploads carry a
 * `up-` prefix in their catalogue id — the artist id for the order row
 * must be the underlying profile id.
 */
export function snapshotLine(line: CartLineSnapshot): OrderItem {
  const { item, artwork } = line;
  return {
    id: generateId(),
    orderId: "",
    artworkId: artwork.id,
    title: artwork.title,
    artistName: artwork.artist,
    imageUrl: artwork.imageUrl ?? null,
    gradient: artwork.gradient,
    ratio: artwork.ratio,
    unitPrice: artwork.price,
    quantity: item.quantity,
    lineTotal: artwork.price * item.quantity,
  };
}

/** Resolve the real artist profile id from a catalogue artwork id. */
export function artistProfileIdFor(artwork: Artwork): string {
  if (artwork.artistId.startsWith("user-")) {
    return artwork.artistId.slice("user-".length);
  }
  // Seeded artists use their slug as the profile id in demo mode.
  return artwork.artistId;
}

export function artistNameFor(artwork: Artwork): string {
  return artwork.artist;
}

/* ------------------------------ conversion ------------------------------ */

interface OrderRow {
  id: string;
  order_number: string;
  order_group: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  artist_id: string;
  artist_name: string;
  status: string;
  payment_status: string;
  payment_provider: string;
  payment_reference: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  currency: string;
  created_at: string | null;
  updated_at: string | null;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  artwork_id: string;
  title: string;
  artist_name: string;
  image_url: string | null;
  gradient: string;
  ratio: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

interface ShippingRow {
  order_id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

function normalizeStatus(status: string): OrderStatus {
  const allowed: OrderStatus[] = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  return allowed.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : "pending";
}

function normalizePaymentStatus(status: string): Order["paymentStatus"] {
  const allowed: Order["paymentStatus"][] = [
    "pending",
    "paid",
    "failed",
    "refunded",
  ];
  return allowed.includes(status as Order["paymentStatus"])
    ? (status as Order["paymentStatus"])
    : "pending";
}

function rowToOrder(
  row: OrderRow,
  items: OrderItemRow[],
  shipping: ShippingRow | null
): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name,
    buyerEmail: row.buyer_email,
    artistId: row.artist_id,
    artistName: row.artist_name,
    status: normalizeStatus(row.status),
    paymentStatus: normalizePaymentStatus(row.payment_status),
    paymentProvider: (row.payment_provider as Order["paymentProvider"]) ?? "none",
    paymentReference: row.payment_reference,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    currency: row.currency,
    items: items.map((item) => ({
      id: item.id,
      orderId: item.order_id,
      artworkId: item.artwork_id,
      title: item.title,
      artistName: item.artist_name,
      imageUrl: item.image_url,
      gradient: item.gradient,
      ratio: item.ratio,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
    })),
    shipping: shipping
      ? {
          fullName: shipping.full_name,
          email: shipping.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postal_code,
          country: shipping.country,
        }
      : null,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

/* ------------------------------ demo store ------------------------------ */

const ORDERS_KEY = "artsphere:orders";

interface DemoOrder {
  order: OrderRow;
  items: OrderItemRow[];
  shipping: ShippingRow | null;
}

function readDemoOrders(): DemoOrder[] {
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DemoOrder[]) : [];
  } catch {
    return [];
  }
}

function writeDemoOrders(orders: DemoOrder[]): void {
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // Quota issues — keep in-memory for the session.
  }
}

/* -------------------------------- create -------------------------------- */

export interface CreateOrderInput {
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  shipping: ShippingDetails;
  lines: CartLineSnapshot[];
  shippingFee: number;
}

export interface CreateOrderResult {
  orders: Order[];
  error: string | null;
}

/**
 * Place an order. Cart lines are grouped per artist (one order row per
 * artist, sharing an order_group). Payment status is always 'pending' —
 * a connected provider flips it server-side after payment succeeds.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const groups = new Map<string, CartLineSnapshot[]>();
  for (const line of input.lines) {
    const artistKey = artistProfileIdFor(line.artwork);
    const bucket = groups.get(artistKey) ?? [];
    bucket.push(line);
    groups.set(artistKey, bucket);
  }

  const orderGroup = generateId();
  const created: Order[] = [];
  const now = new Date().toISOString();

  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    for (const [artistId, lines] of groups) {
      const items = lines.map(snapshotLine);
      const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
      const shippingFee = input.shippingFee;
      const total = subtotal + shippingFee;

      // Resolve the artist's display name from their profile row when it
      // exists (uploads); seeded sample artists keep their catalogue name.
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", artistId)
        .maybeSingle();

      const resolvedArtistId = artistId;
      const resolvedArtistName =
        profile?.full_name ?? artistNameFor(lines[0].artwork);

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          order_number: generateOrderNumber(),
          order_group: orderGroup,
          buyer_id: input.buyerId,
          buyer_name: input.buyerName,
          buyer_email: input.buyerEmail,
          artist_id: resolvedArtistId,
          artist_name: resolvedArtistName,
          status: "pending",
          payment_status: "pending",
          payment_provider: PAYMENT_PROVIDER,
          subtotal,
          shipping_fee: shippingFee,
          total,
          currency: "INR",
        })
        .select()
        .single();
      if (error) {
        return { orders: created, error: error.message };
      }

      const orderRow = order as OrderRow;
      const itemRows = items.map((item) => ({
        order_id: orderRow.id,
        artwork_id: item.artworkId,
        title: item.title,
        artist_name: item.artistName,
        image_url: item.imageUrl,
        gradient: item.gradient,
        ratio: item.ratio,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.lineTotal,
      }));
      const { error: itemsErr } = await supabase
        .from("order_items")
        .insert(itemRows);
      if (itemsErr) {
        return { orders: created, error: itemsErr.message };
      }

      const { error: shipErr } = await supabase
        .from("order_shipping")
        .insert({
          order_id: orderRow.id,
          full_name: input.shipping.fullName,
          email: input.shipping.email,
          phone: input.shipping.phone,
          address: input.shipping.address,
          city: input.shipping.city,
          state: input.shipping.state,
          postal_code: input.shipping.postalCode,
          country: input.shipping.country,
        });
      if (shipErr) {
        return { orders: created, error: shipErr.message };
      }

      created.push(
        rowToOrder(
          orderRow,
          itemRows.map((row, idx) => ({
            id: `pending-${idx}`,
            ...row,
          })) as OrderItemRow[],
          {
            order_id: orderRow.id,
            full_name: input.shipping.fullName,
            email: input.shipping.email,
            phone: input.shipping.phone,
            address: input.shipping.address,
            city: input.shipping.city,
            state: input.shipping.state,
            postal_code: input.shipping.postalCode,
            country: input.shipping.country,
          }
        )
      );
    }
    return { orders: created, error: null };
  }

  // ------------------------------ demo mode ------------------------------
  const store = readDemoOrders();
  for (const [artistId, lines] of groups) {
    const items = lines.map(snapshotLine);
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const shippingFee = input.shippingFee;
    const total = subtotal + shippingFee;
    const row: OrderRow = {
      id: generateId(),
      order_number: generateOrderNumber(),
      order_group: orderGroup,
      buyer_id: input.buyerId,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      artist_id: artistId,
      artist_name: artistNameFor(lines[0].artwork),
      status: "pending",
      payment_status: "pending",
      payment_provider: PAYMENT_PROVIDER,
      payment_reference: null,
      subtotal,
      shipping_fee: shippingFee,
      total,
      currency: "INR",
      created_at: now,
      updated_at: now,
    };
    const itemRows: OrderItemRow[] = items.map((item) => ({
      id: generateId(),
      order_id: row.id,
      artwork_id: item.artworkId,
      title: item.title,
      artist_name: item.artistName,
      image_url: item.imageUrl,
      gradient: item.gradient,
      ratio: item.ratio,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    }));
    const shippingRow: ShippingRow = {
      order_id: row.id,
      full_name: input.shipping.fullName,
      email: input.shipping.email,
      phone: input.shipping.phone,
      address: input.shipping.address,
      city: input.shipping.city,
      state: input.shipping.state,
      postal_code: input.shipping.postalCode,
      country: input.shipping.country,
    };
    store.push({ order: row, items: itemRows, shipping: shippingRow });
    created.push(rowToOrder(row, itemRows, shippingRow));
  }
  writeDemoOrders(store);
  return { orders: created, error: null };
}

/* -------------------------------- reads --------------------------------- */

export async function listBuyerOrders(buyerId: string): Promise<Order[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { data: orderRows, error } = await supabase
      .from("orders")
      .select("*")
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const orders = await hydrateOrders(supabase, orderRows as OrderRow[]);
    return orders;
  }

  return readDemoOrders()
    .filter((o) => o.order.buyer_id === buyerId)
    .sort(
      (a, b) =>
        new Date(b.order.created_at ?? 0).getTime() -
        new Date(a.order.created_at ?? 0).getTime()
    )
    .map((o) => rowToOrder(o.order, o.items, o.shipping));
}

export async function listArtistOrders(artistId: string): Promise<Order[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { data: orderRows, error } = await supabase
      .from("orders")
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return hydrateOrders(supabase, orderRows as OrderRow[]);
  }

  return readDemoOrders()
    .filter((o) => o.order.artist_id === artistId)
    .sort(
      (a, b) =>
        new Date(b.order.created_at ?? 0).getTime() -
        new Date(a.order.created_at ?? 0).getTime()
    )
    .map((o) => rowToOrder(o.order, o.items, o.shipping));
}

async function hydrateOrders(
  supabase: ReturnType<typeof getSupabase>,
  orderRows: OrderRow[]
): Promise<Order[]> {
  if (!orderRows.length) return [];
  const ids = orderRows.map((row) => row.id);

  const [itemsRes, shippingRes] = await Promise.all([
    supabase.from("order_items").select("*").in("order_id", ids),
    supabase.from("order_shipping").select("*").in("order_id", ids),
  ]);
  const items = (itemsRes.data ?? []) as OrderItemRow[];
  const shipping = (shippingRes.data ?? []) as ShippingRow[];

  return orderRows.map((row) =>
    rowToOrder(
      row,
      items.filter((i) => i.order_id === row.id),
      shipping.find((s) => s.order_id === row.id) ?? null
    )
  );
}

export async function getOrder(
  orderId: string,
  viewerId: string
): Promise<Order | null> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    // RLS restricts to buyer/artist/admin; the query just resolves it.
    const { data: row, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    if (error || !row) return null;
    const orders = await hydrateOrders(supabase, [row as OrderRow]);
    return orders[0] ?? null;
  }

  const found = readDemoOrders().find(
    (o) => o.order.id === orderId
  );
  if (!found) return null;
  // Demo-mode viewer check: only participants can read.
  if (
    found.order.buyer_id !== viewerId &&
    found.order.artist_id !== viewerId
  ) {
    return null;
  }
  return rowToOrder(found.order, found.items, found.shipping);
}

/* ------------------------------- updates -------------------------------- */

const ARTIST_ADVANCE: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "processing",
  processing: "shipped",
  shipped: "delivered",
  delivered: null,
  cancelled: null,
};

/**
 * Artist advances fulfilment one step. Payment status is never touched
 * here — that belongs to the payment provider's webhook.
 */
export async function advanceOrderStatus(
  orderId: string,
  artistId: string
): Promise<Order | null> {
  const current = await getOrder(orderId, artistId);
  if (!current || current.artistId !== artistId) return null;
  const next = ARTIST_ADVANCE[current.status];
  if (!next) return current;

  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("orders")
      .update({ status: next })
      .eq("id", orderId)
      .eq("artist_id", artistId);
    if (error) throw new Error(error.message);
    return { ...current, status: next, updatedAt: new Date().toISOString() };
  }

  const store = readDemoOrders();
  const found = store.find((o) => o.order.id === orderId);
  if (!found) return null;
  found.order.status = next;
  found.order.updated_at = new Date().toISOString();
  writeDemoOrders(store);
  return { ...current, status: next, updatedAt: found.order.updated_at };
}

/* ---------------------------- stats helpers ----------------------------- */

export interface ArtistOrderStats {
  totalSales: number;
  pendingOrders: number;
  earnings: number;
}

export function computeArtistStats(orders: Order[]): ArtistOrderStats {
  const active = orders.filter((o) => o.status !== "cancelled");
  const paidLike = active.filter(
    (o) => o.paymentStatus === "paid" || o.paymentStatus === "pending"
  );
  return {
    totalSales: active.length,
    pendingOrders: active.filter((o) => o.status !== "delivered").length,
    // Until a provider settles payments, show the order value as
    // "expected earnings" — clearly labelled in the UI.
    earnings: paidLike.reduce((sum, o) => sum + o.total, 0),
  };
}
