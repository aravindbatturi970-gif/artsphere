/**
 * Shared domain types for ArtSphere.
 *
 * Frontend shapes mirror the future API resources (and the Supabase
 * `profiles` table) so backend stages drop in without UI rewrites.
 */

export type Availability = "available" | "sold" | "coming-soon";

/** How the piece is sold: one-of-a-kind or a reproduction. */
export type ArtworkType = "original" | "print" | "digital";

export type UserRole = "buyer" | "artist" | "admin";

/**
 * Row shape of the `profiles` table (see supabase/schema.sql). Kept in
 * sync with the database so the client compiles against real responses.
 */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  /** Storage path or URL of the avatar; null until uploads exist. */
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

export interface Artwork {
  id: string;
  title: string;
  artist: string;
  /** Foreign key to the artist profile (used from the artists stage onward). */
  artistId: string;
  /** Tailwind aspect-ratio utility fragment, e.g. "aspect-[4/5]". */
  ratio: string;
  /** Seeded gradient representing the artwork until real uploads exist. */
  gradient: string;
  /** CSS blend mode used inside the placeholder artwork. */
  blend: string;
  price: number;
  currency: string;
  medium: string;
  year: number;
  dimensions: string;
  category: string;
  availability: Availability;
  /** Original, print or digital — filters and card badge. */
  type: ArtworkType;
  /** Base like count from mock data; live likes layer on top via context. */
  likes: number;
  /** Whether the (mock) current user has liked this piece. */
  likedByMe: boolean;
  /** Sort weight for the "Recommended" ordering (mock curation score). */
  recommended: number;
  /** ISO date used by the "Newest" sort. */
  addedAt: string;
  /** Curated description shown on the detail page. */
  description: string;
  /** ISO date the piece was completed (displayed as creation date). */
  createdAt: string;
  /**
   * Public URL of a real uploaded image (Supabase Storage). When null,
   * the seeded `gradient` placeholder renders instead.
   */
  imageUrl?: string | null;
}

/** Listing status for artist-uploaded artwork (see supabase/schema.sql). */
export type ArtworkStatus = "draft" | "published" | "sold" | "archived";

/**
 * Row shape of the `artworks` table — an artist's own listing, distinct
 * from the public `Artwork` shape the catalogue renders.
 */
export interface ArtistArtwork {
  id: string;
  /** Owning profile id (Supabase `artworks.artist_id`). */
  artistId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  type: ArtworkType;
  medium: string;
  dimensions: string;
  year: number;
  quantity: number;
  tags: string[];
  status: ArtworkStatus;
  /** Public URL of the uploaded image (null for gradient placeholders). */
  imageUrl: string | null;
  /** Storage object path — needed to delete the file on artwork delete. */
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Status totals for the dashboard overview cards. */
export interface ArtworkStats {
  total: number;
  published: number;
  drafts: number;
  sold: number;
  archived: number;
}

export interface Artist {
  id: string;
  name: string;
  tagline: string;
  location: string;
  artworkCount: number;
  /** Avatar placeholder: gradient + initials. */
  gradient: string;
  initials: string;
  accent: string;
  /** Longer bio for the profile page. */
  bio: string;
  /** Studio practice description for the profile page. */
  practice: string;
  /** Profile metrics (mock). */
  followers: number;
  joined: number;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  gradient: string;
  /** Mock artwork count shown on the card. */
  count: number;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  status: "done" | "active" | "planned";
  points: string[];
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "brass" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

/** Price buckets for the Discover filter rail. */
export interface PriceRange {
  id: string;
  label: string;
  min: number | null;
  max: number | null;
}

/** Sort options for the Discover toolbar. */
export type SortOption =
  | "recommended"
  | "newest"
  | "price-asc"
  | "price-desc";

/* ------------------------------ orders (Stage 8) ------------------------ */

/** Fulfilment lifecycle of an order (see supabase/schema.sql). */
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/** Payment lifecycle. Only a payment provider (server-side) sets `paid`. */
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/** Where the money is supposed to come from. `none` = not connected yet. */
export type PaymentProvider = "none" | "stripe" | "razorpay";

/** Row shape of the `order_shipping` table — one per order. */
export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/** Row shape of the `order_items` table — a snapshot at purchase time. */
export interface OrderItem {
  id: string;
  orderId: string;
  /** Catalogue artwork id (sample slug or `up-<uuid>` upload id). */
  artworkId: string;
  title: string;
  artistName: string;
  imageUrl: string | null;
  /** Seeded gradient for items without a real image. */
  gradient: string;
  ratio: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** Row shape of the `orders` table — one order per artist per checkout. */
export interface Order {
  id: string;
  /** Human-readable number, e.g. AS-2026-4KX92Q. */
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  artistId: string;
  artistName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: PaymentProvider;
  /** Provider reference (intent/txn id) once a gateway is connected. */
  paymentReference: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  items: OrderItem[];
  shipping: ShippingDetails | null;
  createdAt: string;
  updatedAt: string;
}

/** The one order an artist can advance: fulfilment status only. */
export type FulfilmentStatus = Exclude<OrderStatus, "pending" | "cancelled">;

/* ------------------------------ admin (Stage 9) ------------------------- */

/** Moderation decision recorded on an artwork. */
export type ModerationStatus = "approved" | "rejected" | "removed";

/** Row shape of the `reports` table. */
export interface Report {
  id: string;
  /** What was reported. */
  targetType: "artwork" | "artist" | "user";
  /** Catalogue id for artwork, profile id for artist/user. */
  targetId: string;
  /** Snapshot label so the queue renders without joins. */
  targetLabel: string;
  /** Profile id of the reporter (null for anonymous demo reports). */
  reporterId: string | null;
  reporterName: string;
  reason: string;
  details: string;
  status: "open" | "resolved" | "dismissed";
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

/** Where the account stands with the platform. */
export type AccountStatus = "active" | "disabled";
