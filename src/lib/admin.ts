import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { SAMPLE_ARTISTS } from "@/data/sample-artists";
import { SAMPLE_ARTWORKS } from "@/data/sample-artworks";
import { CATEGORIES } from "@/data/categories";
import type {
  Artwork,
  ModerationStatus,
  Report,
  UserProfile,
} from "@/types";

/**
 * Admin data layer (Stage 9).
 *
 * Security model:
 * - Supabase mode: every call runs as the signed-in admin; RLS on the
 *   server rejects non-admins regardless of what the UI shows.
 * - Demo mode: identical API over a localStorage store (admin credentials
 *   are whatever the demo session holds; the route guard checks role).
 */

export class AdminDataError extends Error {}

function adminId(): string {
  return "admin-platform";
}

/* ------------------------------ demo stores ------------------------------ */

const MODERATION_KEY = "artsphere:moderation";
const REPORTS_KEY = "artsphere:reports";
const STATUS_KEY = "artsphere:account-status";

type ModerationMap = Record<string, { status: ModerationStatus; note: string | null }>;

/** Exported read for the public catalogue filter (demo mode only). */
export function readModerationMap(): ModerationMap {
  return readModeration();
}

function readModeration(): ModerationMap {
  try {
    const raw = window.localStorage.getItem(MODERATION_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null
      ? (parsed as ModerationMap)
      : {};
  } catch {
    return {};
  }
}

function writeModeration(map: ModerationMap): void {
  try {
    window.localStorage.setItem(MODERATION_KEY, JSON.stringify(map));
  } catch {
    // In-memory only then.
  }
}

type StatusMap = Record<string, "active" | "disabled">;

function readStatuses(): StatusMap {
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return typeof parsed === "object" && parsed !== null
      ? (parsed as StatusMap)
      : {};
  } catch {
    return {};
  }
}

function writeStatuses(map: StatusMap): void {
  try {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify(map));
  } catch {
    // In-memory only then.
  }
}

function readReports(): Report[] {
  try {
    const raw = window.localStorage.getItem(REPORTS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Report[]) : [];
  } catch {
    return [];
  }
}

function writeReports(reports: Report[]): void {
  try {
    window.localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  } catch {
    // In-memory only then.
  }
}

/** Merge moderation overrides into a catalogue list. */
function withModeration(catalog: Artwork[]): Artwork[] {
  const map = readModeration();
  return catalog.map((a) => {
    const entry = map[a.id];
    if (!entry) return a;
    if (entry.status === "rejected" || entry.status === "removed") {
      return { ...a, availability: "sold" as const };
    }
    return a;
  });
}
void withModeration;

/* -------------------------------- users ---------------------------------- */

export interface AdminUser extends UserProfile {
  accountStatus: "active" | "disabled";
  orderCount: number;
}

/** Demo users + the current real profile (Supabase: profiles table). */
export async function listUsers(): Promise<AdminUser[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, bio, created_at, account_status");
    if (error) throw new AdminDataError(error.message);
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.id),
      fullName: (row.full_name as string) ?? "Unnamed",
      email: (row.email as string) ?? "",
      role: ((row.role as string) ?? "buyer") as UserProfile["role"],
      avatarUrl: (row.avatar_url as string) ?? null,
      bio: (row.bio as string) ?? null,
      createdAt: (row.created_at as string) ?? new Date().toISOString(),
      accountStatus: ((row.account_status as string) === "disabled"
        ? "disabled"
        : "active") as AdminUser["accountStatus"],
      orderCount: 0,
    }));
  }

  const statuses = readStatuses();
  const users: AdminUser[] = [];
  try {
    const raw = window.localStorage.getItem("artsphere:demo-users");
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      for (const u of parsed as Array<Record<string, unknown>>) {
        users.push({
          id: String(u.id),
          fullName: String(u.fullName ?? "Unnamed"),
          email: String(u.email ?? ""),
          role: (String(u.role ?? "buyer") as UserProfile["role"]),
          avatarUrl: null,
          bio: (u.bio as string) ?? null,
          createdAt: String(u.createdAt ?? new Date().toISOString()),
          accountStatus: (String(u.accountStatus ?? "active") === "disabled"
            ? "disabled"
            : "active") as AdminUser["accountStatus"],
          orderCount: 0,
        });
      }
    }
  } catch {
    // Corrupt store — return what we have.
  }
  return users.map((u) => ({
    ...u,
    accountStatus: statuses[u.id] ?? u.accountStatus,
  }));
}

/**
 * Disable or re-enable an account. Supabase mode also performs an
 * admin-API ban when the service role is available via edge function;
 * here the DB flag + trigger refuse new sign-ins.
 */
export async function setAccountStatus(
  userId: string,
  status: "active" | "disabled"
): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    // Guard: never disable yourself.
    const { data: me } = await supabase.auth.getUser();
    if (me?.user?.id === userId) {
      throw new AdminDataError("You cannot disable your own account.");
    }
    const { error } = await supabase
      .from("profiles")
      .update({ account_status: status })
      .eq("id", userId);
    if (error) throw new AdminDataError(error.message);
    return;
  }

  if (userId === adminId()) {
    throw new AdminDataError("You cannot disable your own account.");
  }
  const map = readStatuses();
  map[userId] = status;
  writeStatuses(map);

  // Demo enforcement: kill a live session belonging to the disabled user.
  try {
    if (status === "disabled") {
      const session = window.localStorage.getItem("artsphere:demo-session");
      if (session === userId) {
        window.localStorage.removeItem("artsphere:demo-session");
      }
    }
  } catch {
    // Nothing to clean.
  }
}

/* ------------------------------- catalogue -------------------------------- */

export interface AdminArtwork extends Artwork {
  moderation: ModerationStatus | null;
  moderationNote: string | null;
}

export async function listAllArtworks(): Promise<AdminArtwork[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new AdminDataError(error.message);
    const map = new Map(
      ((data ?? []) as Array<Record<string, unknown>>).map((row) => [
        `up-${String(row.id)}`,
        {
          moderation: (row.moderation as ModerationStatus) ?? "approved",
          moderationNote: (row.moderation_note as string) ?? null,
          artistId: `user-${String(row.artist_id)}`,
          title: String(row.title),
        },
      ])
    );
    // Merge over samples so the admin sees both, keyed by catalogue id.
    const merged: AdminArtwork[] = SAMPLE_ARTWORKS.map((a) => ({
      ...a,
      moderation: null,
      moderationNote: null,
    }));
    for (const [catalogId, row] of map) {
      const base = SAMPLE_ARTWORKS.find((a) => a.id === catalogId);
      merged.unshift({
        id: catalogId,
        title: row.title,
        artist: base?.artist ?? "Unknown",
        artistId: row.artistId,
        ratio: base?.ratio ?? "aspect-[4/5]",
        gradient: base?.gradient ?? "",
        blend: base?.blend ?? "normal",
        price: 0,
        currency: "INR",
        medium: "",
        year: new Date().getFullYear(),
        dimensions: "",
        category: base?.category ?? "",
        availability: base?.availability ?? "available",
        type: base?.type ?? "original",
        likes: 0,
        likedByMe: false,
        recommended: 0,
        addedAt: new Date().toISOString(),
        description: "",
        createdAt: new Date().toISOString(),
        imageUrl: null,
        moderation: row.moderation,
        moderationNote: row.moderationNote,
      });
    }
    return merged;
  }

  // Demo mode: all uploads (any status) + samples, with moderation map.
  const map = readModeration();
  const uploads: AdminArtwork[] = [];
  try {
    const raw = window.localStorage.getItem("artsphere:artist-artworks");
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      for (const rec of parsed as Array<Record<string, unknown>>) {
        const catalogId = `up-${String(rec.id)}`;
        const mod = map[catalogId];
        uploads.push({
          id: catalogId,
          title: String(rec.title ?? "Untitled"),
          artist: "Studio artist",
          artistId: `user-${String(rec.artistId ?? "")}`,
          ratio: "aspect-[4/5]",
          gradient: "",
          blend: "normal",
          price: Number(rec.price ?? 0),
          currency: String(rec.currency ?? "INR"),
          medium: String(rec.medium ?? ""),
          year: Number(rec.year ?? new Date().getFullYear()),
          dimensions: String(rec.dimensions ?? ""),
          category: String(rec.category ?? ""),
          availability:
            rec.status === "sold" ? "sold" : "available",
          type: (String(rec.type ?? "original") as Artwork["type"]),
          likes: 0,
          likedByMe: false,
          recommended: 0,
          addedAt: String(rec.createdAt ?? new Date().toISOString()),
          description: String(rec.description ?? ""),
          createdAt: String(rec.createdAt ?? new Date().toISOString()),
          imageUrl: (rec.imageDataUrl as string) ?? null,
          moderation: mod?.status ?? null,
          moderationNote: mod?.note ?? null,
        });
      }
    }
  } catch {
    // Corrupt store.
  }
  const samples = SAMPLE_ARTWORKS.map((a) => ({
    ...a,
    moderation: map[a.id]?.status ?? null,
    moderationNote: map[a.id]?.note ?? null,
  }));
  return [...uploads, ...samples];
}

export async function setModeration(
  artworkId: string,
  status: ModerationStatus,
  note: string | null
): Promise<void> {
  if (isSupabaseConfigured && artworkId.startsWith("up-")) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("artworks")
      .update({ moderation: status, moderation_note: note })
      .eq("id", artworkId.slice(3));
    if (error) throw new AdminDataError(error.message);
    return;
  }

  const map = readModeration();
  map[artworkId] = { status, note };
  writeModeration(map);
}

/* -------------------------------- reports --------------------------------- */

export async function listReports(): Promise<Report[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new AdminDataError(error.message);
    return ((data ?? []) as Array<Record<string, unknown>>).map(rowToReport);
  }
  return readReports().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function rowToReport(row: Record<string, unknown>): Report {
  return {
    id: String(row.id),
    targetType: (String(row.target_type) as Report["targetType"]),
    targetId: String(row.target_id),
    targetLabel: String(row.target_label ?? ""),
    reporterId: (row.reporter_id as string) ?? null,
    reporterName: String(row.reporter_name ?? ""),
    reason: String(row.reason ?? ""),
    details: String(row.details ?? ""),
    status: (String(row.status ?? "open") as Report["status"]),
    resolutionNote: (row.resolution_note as string) ?? null,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    resolvedAt: (row.resolved_at as string) ?? null,
  };
}

export async function resolveReport(
  reportId: string,
  status: "resolved" | "dismissed",
  note: string | null
): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("reports")
      .update({
        status,
        resolution_note: note,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", reportId);
    if (error) throw new AdminDataError(error.message);
    return;
  }
  const reports = readReports();
  const idx = reports.findIndex((r) => r.id === reportId);
  if (idx >= 0) {
    reports[idx] = {
      ...reports[idx],
      status,
      resolutionNote: note,
      resolvedAt: new Date().toISOString(),
    };
    writeReports(reports);
  }
}

/* ------------------------------ categories -------------------------------- */

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw new AdminDataError(error.message);
    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
    }));
  }
  const seeded = CATEGORIES.map((c, idx) => ({
    id: `cat-${idx}`,
    name: c.name,
    slug: c.slug,
  }));
  // Custom categories added via the admin UI (demo store).
  let custom: AdminCategory[] = [];
  try {
    const raw = window.localStorage.getItem("artsphere:admin-categories");
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      custom = (parsed as AdminCategory[]).filter(
        (c) => typeof c?.id === "string" && typeof c?.name === "string"
      );
    }
  } catch {
    // Corrupt store — seeded list only.
  }
  return [...seeded, ...custom];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createCategory(name: string): Promise<void> {
  const slug = slugify(name);
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("categories")
      .insert({ name: name.trim(), slug });
    if (error) throw new AdminDataError(error.message);
    return;
  }
  const cats = JSON.parse(
    window.localStorage.getItem("artsphere:admin-categories") || "[]"
  ) as AdminCategory[];
  cats.push({ id: `cat-${Date.now()}`, name: name.trim(), slug });
  window.localStorage.setItem(
    "artsphere:admin-categories",
    JSON.stringify(cats)
  );
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const slug = slugify(name);
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("categories")
      .update({ name: name.trim(), slug })
      .eq("id", id);
    if (error) throw new AdminDataError(error.message);
    return;
  }
  const cats = JSON.parse(
    window.localStorage.getItem("artsphere:admin-categories") || "[]"
  ) as AdminCategory[];
  const idx = cats.findIndex((c) => c.id === id);
  if (idx >= 0) cats[idx] = { ...cats[idx], name: name.trim(), slug };
  window.localStorage.setItem(
    "artsphere:admin-categories",
    JSON.stringify(cats)
  );
}

export async function deleteCategory(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) throw new AdminDataError(error.message);
    return;
  }
  const cats = JSON.parse(
    window.localStorage.getItem("artsphere:admin-categories") || "[]"
  ) as AdminCategory[];
  window.localStorage.setItem(
    "artsphere:admin-categories",
    JSON.stringify(cats.filter((c) => c.id !== id))
  );
}

/* -------------------------------- artists --------------------------------- */

export interface AdminArtist {
  id: string;
  name: string;
  email: string | null;
  artworkCount: number;
  sales: number;
  accountStatus: "active" | "disabled";
  joined: string;
}

export async function listArtists(): Promise<AdminArtist[]> {
  const users = await listUsers();
  const artists = users.filter((u) => u.role === "artist");
  const sampleArtists = SAMPLE_ARTISTS.map((a) => ({
    id: a.id,
    name: a.name,
    email: null as string | null,
    artworkCount: SAMPLE_ARTWORKS.filter((w) => w.artistId === a.id).length,
    sales: 0,
    accountStatus: "active" as const,
    joined: String(a.joined),
  }));
  const userArtists = artists.map((u) => ({
    id: u.id,
    name: u.fullName,
    email: u.email,
    artworkCount: 0,
    sales: 0,
    accountStatus: u.accountStatus,
    joined: u.createdAt,
  }));
  return [...userArtists, ...sampleArtists];
}

/* --------------------------------- stats ---------------------------------- */

export interface AdminStats {
  totalUsers: number;
  totalArtists: number;
  totalArtworks: number;
  publishedArtworks: number;
  totalOrders: number;
  revenue: number;
  pendingReports: number;
}

export async function loadAdminStats(): Promise<AdminStats> {
  const [users, reports, artworks, orders] = await Promise.all([
    listUsers(),
    listReports(),
    listAllArtworks(),
    listAdminOrders(),
  ]);
  const activeArtworks = artworks.filter(
    (a) => a.moderation !== "rejected" && a.moderation !== "removed"
  );
  return {
    totalUsers: users.filter((u) => u.accountStatus === "active").length,
    totalArtists: Math.max(
      users.filter((u) => u.role === "artist").length,
      SAMPLE_ARTISTS.length
    ),
    totalArtworks: activeArtworks.length,
    publishedArtworks: activeArtworks.filter((a) => a.availability === "available")
      .length,
    totalOrders: orders.length,
    revenue: orders
      .filter((o) => o.paymentStatus === "paid")
      .reduce((sum, o) => sum + o.amount, 0),
    pendingReports: reports.filter((r) => r.status === "open").length,
  };
}

/* -------------------------------- orders ---------------------------------- */

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  buyer: string;
  artist: string;
  artworkTitles: string;
  amount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export async function listAdminOrders(): Promise<AdminOrderRow[]> {
  try {
    const raw = window.localStorage.getItem("artsphere:orders");
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return (parsed as Array<any>)
      .map((entry) => ({
        id: String(entry.order?.id ?? ""),
        orderNumber: String(entry.order?.order_number ?? ""),
        buyer: String(entry.order?.buyer_name ?? ""),
        artist: String(entry.order?.artist_name ?? ""),
        artworkTitles: (entry.items ?? [])
          .map((i: any) => String(i.title))
          .join(", "),
        amount: Number(entry.order?.total ?? 0),
        status: String(entry.order?.status ?? "pending"),
        paymentStatus: String(entry.order?.payment_status ?? "pending"),
        createdAt: String(entry.order?.created_at ?? new Date().toISOString()),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  } catch {
    return [];
  }
}
