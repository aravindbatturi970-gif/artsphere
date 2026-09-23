import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ArtistArtwork } from "@/types";

/**
 * Artist artwork data layer.
 *
 * - Supabase configured: rows live in the `artworks` table and images in
 *   the `artwork-images` storage bucket (ownership enforced by RLS).
 * - Demo mode: the identical API over a localStorage store, so the
 *   dashboard is fully testable before credentials exist.
 */

/** Subset of the Supabase `artworks` row with snake_case columns. */
interface ArtworkRow {
  id: string;
  artist_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  type: string;
  medium: string;
  dimensions: string;
  year: number;
  quantity: number;
  tags: string[];
  status: string;
  image_url: string | null;
  image_path: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateArtworkInput {
  title: string;
  description: string;
  price: number;
  category: string;
  type: ArtistArtwork["type"];
  medium: string;
  dimensions: string;
  year: number;
  quantity: number;
  tags: string[];
  status: ArtistArtwork["status"];
  image: File | null;
}

export type UpdateArtworkInput = Partial<CreateArtworkInput>;

/* ------------------------------ conversion ----------------------------- */

export function supabaseRowToArtwork(row: ArtworkRow): ArtistArtwork {
  return rowToArtwork(row);
}

function rowToArtwork(row: ArtworkRow): ArtistArtwork {
  return {
    id: row.id,
    artistId: row.artist_id,
    title: row.title,
    description: row.description ?? "",
    price: Number(row.price),
    currency: "INR",
    category: row.category,
    type:
      row.type === "print" || row.type === "digital" ? row.type : "original",
    medium: row.medium ?? "",
    dimensions: row.dimensions ?? "",
    year: row.year,
    quantity: row.quantity,
    tags: row.tags ?? [],
    status:
      row.status === "published" ||
      row.status === "sold" ||
      row.status === "archived"
        ? row.status
        : "draft",
    imageUrl: row.image_url,
    imagePath: row.image_path,
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

/* -------------------------------- errors ------------------------------- */

export class ArtworkDataError extends Error {}

function rethrowUserFriendly(error: { message: string } | null): never {
  const raw = error?.message ?? "Unknown database error";
  // RLS violations surface as generic permission errors — explain them.
  if (new RegExp("row-level|violates|permission", "i").test(raw)) {
    throw new ArtworkDataError(
      "Your account does not have permission for this action. Only artist accounts can publish artwork."
    );
  }
  throw new ArtworkDataError(raw);
}

/* ------------------------------ validation ----------------------------- */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface ArtworkDraft {
  title: string;
  description: string;
  price: string;
  category: string;
  type: ArtistArtwork["type"];
  medium: string;
  dimensions: string;
  year: string;
  quantity: string;
  tags: string;
  status: ArtistArtwork["status"];
}

export function validateArtworkForm(
  draft: ArtworkDraft,
  image: File | null,
  hasExistingImage: boolean
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (draft.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }
  if (draft.description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters.";
  }
  const price = Number(draft.price);
  if (!draft.price.trim() || !Number.isFinite(price) || price <= 0) {
    errors.price = "Enter a valid price above zero.";
  } else if (price > 99_999_999) {
    errors.price = "Price looks unrealistic.";
  }
  if (!draft.category) errors.category = "Choose a category.";
  if (!draft.medium.trim()) errors.medium = "Medium is required.";
  if (!draft.dimensions.trim()) errors.dimensions = "Dimensions are required.";
  const year = Number(draft.year);
  const thisYear = new Date().getFullYear();
  if (
    !draft.year.trim() ||
    !Number.isInteger(year) ||
    year < 1900 ||
    year > thisYear
  ) {
    errors.year = `Year must be between 1900 and ${thisYear}.`;
  }
  const qty = Number(draft.quantity);
  if (
    !draft.quantity.trim() ||
    !Number.isInteger(qty) ||
    qty < 1 ||
    qty > 999
  ) {
    errors.quantity = "Quantity must be between 1 and 999.";
  }
  if (image) {
    if (!IMAGE_TYPES.includes(image.type)) {
      errors.image = "Image must be JPEG, PNG, WebP or GIF.";
    } else if (image.size > MAX_IMAGE_BYTES) {
      errors.image = "Image must be 5 MB or smaller.";
    }
  } else if (!hasExistingImage) {
    errors.image = "Upload an artwork image.";
  }
  return errors;
}

/* ------------------------------- storage ------------------------------- */

const SUPABASE_TABLE = "artworks";
const BUCKET = "artwork-images";
const LS_KEY = "artsphere:artist-artworks";

interface DemoRecord extends Omit<ArtistArtwork, "imageUrl"> {
  artistId: string;
  imageDataUrl: string | null;
  imageType: string | null;
  imageName: string;
}

function readStore(): DemoRecord[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as DemoRecord[]) : [];
  } catch {
    return [];
  }
}

function writeStore(rows: DemoRecord[]): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(rows));
  } catch {
    // Quota exceeded (large data URLs) — keep in-memory for the session.
  }
}

function recordToArtwork(record: DemoRecord): ArtistArtwork {
  const { imageDataUrl, imageType, imageName, ...rest } = record;
  return {
    ...rest,
    imageUrl: imageDataUrl,
    imagePath: imageType ? imageName : null,
  };
}

/** Demo-mode read of published listings (used by the public catalogue). */
export function readDemoPublished(): ArtistArtwork[] {
  return readStore()
    .filter((r) => r.status === "published")
    .map(recordToArtwork);
}

/* ------------------------------- CRUD API ------------------------------ */

export async function listArtistArtworks(
  artistId: string
): Promise<ArtistArtwork[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await getSupabase()
      .from(SUPABASE_TABLE)
      .select("*")
      .eq("artist_id", artistId)
      .order("created_at", { ascending: false });
    if (error) rethrowUserFriendly(error);
    return (data ?? []).map(rowToArtwork);
  }

  // Demo mode: filter the local store by the current demo artist.
  return readStore()
    .filter((r) => r.artistId === artistId)
    .map(recordToArtwork);
}

export async function createArtwork(
  artistId: string,
  input: CreateArtworkInput
): Promise<ArtistArtwork> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    let imageUrl: string | null = null;
    let imagePath: string | null = null;

    if (input.image) {
      const path = `${artistId}/${Date.now()}-${input.image.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.image, { cacheControl: "3600", upsert: false });
      if (upErr) rethrowUserFriendly(upErr);
      imagePath = path;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .insert({
        artist_id: artistId,
        title: input.title.trim(),
        description: input.description.trim(),
        price: input.price,
        category: input.category,
        type: input.type,
        medium: input.medium.trim(),
        dimensions: input.dimensions.trim(),
        year: input.year,
        quantity: input.quantity,
        tags: input.tags,
        status: input.status,
        image_url: imageUrl,
        image_path: imagePath,
      })
      .select()
      .single();
    if (error) rethrowUserFriendly(error);
    return rowToArtwork(data as ArtworkRow);
  }

  // Demo mode: store a data URL so the image renders without a backend.
  const record: DemoRecord = {
    id: crypto.randomUUID(),
    artistId,
    title: input.title.trim(),
    description: input.description.trim(),
    price: input.price,
    currency: "INR",
    category: input.category,
    type: input.type,
    medium: input.medium.trim(),
    dimensions: input.dimensions.trim(),
    year: input.year,
    quantity: input.quantity,
    tags: input.tags,
    status: input.status,
    imagePath: null,
    imageDataUrl: null,
    imageType: null,
    imageName: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (input.image) {
    record.imageDataUrl = await fileToDataUrl(input.image);
    record.imageType = input.image.type;
    record.imageName = input.image.name;
  }
  writeStore([...readStore(), record]);
  return recordToArtwork(record);
}

export async function updateArtwork(
  artistId: string,
  artworkId: string,
  input: UpdateArtworkInput
): Promise<ArtistArtwork> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    let imageUrl: string | undefined;
    let imagePath: string | undefined;

    if (input.image) {
      const path = `${artistId}/${Date.now()}-${input.image.name.replace(/[^\w.\-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, input.image, { cacheControl: "3600", upsert: false });
      if (upErr) rethrowUserFriendly(upErr);
      imagePath = path;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      imageUrl = data.publicUrl;
    }

    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title.trim();
    if (input.description !== undefined)
      patch.description = input.description.trim();
    if (input.price !== undefined) patch.price = input.price;
    if (input.category !== undefined) patch.category = input.category;
    if (input.type !== undefined) patch.type = input.type;
    if (input.medium !== undefined) patch.medium = input.medium.trim();
    if (input.dimensions !== undefined)
      patch.dimensions = input.dimensions.trim();
    if (input.year !== undefined) patch.year = input.year;
    if (input.quantity !== undefined) patch.quantity = input.quantity;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.status !== undefined) patch.status = input.status;
    if (imageUrl !== undefined) {
      patch.image_url = imageUrl;
      patch.image_path = imagePath;
    }

    // RLS guarantees only the owner's row can be updated; also guard here.
    const { data, error } = await supabase
      .from(SUPABASE_TABLE)
      .update(patch)
      .eq("id", artworkId)
      .eq("artist_id", artistId)
      .select()
      .single();
    if (error) rethrowUserFriendly(error);
    return rowToArtwork(data as ArtworkRow);
  }

  // Demo mode.
  const rows = readStore();
  const idx = rows.findIndex(
    (r) => r.id === artworkId && r.artistId === artistId
  );
  if (idx === -1) throw new ArtworkDataError("Artwork not found.");
  const row = { ...rows[idx] };
  if (input.title !== undefined) row.title = input.title.trim();
  if (input.description !== undefined)
    row.description = input.description.trim();
  if (input.price !== undefined) row.price = input.price;
  if (input.category !== undefined) row.category = input.category;
  if (input.type !== undefined) row.type = input.type;
  if (input.medium !== undefined) row.medium = input.medium.trim();
  if (input.dimensions !== undefined) row.dimensions = input.dimensions.trim();
  if (input.year !== undefined) row.year = input.year;
  if (input.quantity !== undefined) row.quantity = input.quantity;
  if (input.tags !== undefined) row.tags = input.tags;
  if (input.status !== undefined) row.status = input.status;
  if (input.image) {
    row.imageDataUrl = await fileToDataUrl(input.image);
    row.imageType = input.image.type;
    row.imageName = input.image.name;
  }
  row.updatedAt = new Date().toISOString();
  const next = [...rows];
  next[idx] = row;
  writeStore(next);
  return recordToArtwork(row);
}

export async function deleteArtwork(
  artistId: string,
  artworkId: string
): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    // Fetch first so the storage object can be removed too.
    const { data: row, error: fetchErr } = await supabase
      .from(SUPABASE_TABLE)
      .select("image_path")
      .eq("id", artworkId)
      .eq("artist_id", artistId)
      .single();
    if (fetchErr) rethrowUserFriendly(fetchErr);
    const { error } = await supabase
      .from(SUPABASE_TABLE)
      .delete()
      .eq("id", artworkId)
      .eq("artist_id", artistId);
    if (error) rethrowUserFriendly(error);
    const imagePath = (row as { image_path: string | null } | null)?.image_path;
    if (imagePath) {
      const { error: rmErr } = await supabase.storage
        .from(BUCKET)
        .remove([imagePath]);
      if (rmErr) console.error("Failed to remove image:", rmErr.message);
    }
    return;
  }

  // Demo mode.
  const before = readStore().length;
  const rows = readStore().filter(
    (r) => !(r.id === artworkId && r.artistId === artistId)
  );
  if (rows.length === before) throw new ArtworkDataError("Artwork not found.");
  writeStore(rows);
}

/** Convert an image file to a data URL (demo-mode persistence). */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
    reader.readAsDataURL(file);
  });
}
