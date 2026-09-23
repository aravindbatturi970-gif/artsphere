import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ImagePlus,
  Loader2,
  Info,
  X,
  Save,
  Send,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import {
  ArtistPageHeading,
} from "@/components/dashboard/ArtistDashboardLayout";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/lib/shop";
import { CATEGORY_FILTERS } from "@/config/filters";
import {
  validateArtworkForm,
  createArtwork,
  updateArtwork,
  listArtistArtworks,
  type ArtworkDraft,
} from "@/lib/artist-artworks";
import { cn } from "@/lib/utils";
import type { ArtworkStatus } from "@/types";

const TYPE_OPTIONS = [
  { value: "original", label: "Original" },
  { value: "print", label: "Print" },
  { value: "digital", label: "Digital" },
] as const;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "sold", label: "Sold" },
  { value: "archived", label: "Archived" },
] as const;

const EMPTY_DRAFT: ArtworkDraft = {
  title: "",
  description: "",
  price: "",
  category: "",
  type: "original",
  medium: "",
  dimensions: "",
  year: String(new Date().getFullYear()),
  quantity: "1",
  tags: "",
  status: "draft",
};

const fieldClass =
  "h-11 w-full rounded-lg bg-canvas px-3.5 text-sm text-ink-900 ring-1 ring-ink-200 transition-shadow placeholder:text-ink-400 hover:ring-ink-300 focus:ring-2 focus:ring-brass-500 focus:outline-none";

/**
 * Add Artwork / Edit Artwork — one form for both flows. Images upload to
 * Supabase Storage when configured (data URLs in demo mode); saving a
 * published listing makes it live on the public Discover page.
 */
export function ArtworkFormPage({ mode }: { mode: "add" | "edit" }) {
  const { id } = useParams<{ id: string }>();
  const { user, demoMode } = useAuth();
  const { notify } = useShop();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState<ArtworkDraft>(EMPTY_DRAFT);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(mode === "add");

  // Edit mode: pull the listing into the form.
  useEffect(() => {
    if (mode !== "edit" || !user || !id || loaded) return;
    let cancelled = false;
    listArtistArtworks(user.id).then((rows) => {
      if (cancelled) return;
      const work = rows.find((w) => w.id === id);
      if (!work) {
        setGlobalError("Artwork not found or you don't own it.");
        setLoaded(true);
        return;
      }
      setDraft({
        title: work.title,
        description: work.description,
        price: String(work.price),
        category: work.category,
        type: work.type,
        medium: work.medium,
        dimensions: work.dimensions,
        year: String(work.year),
        quantity: String(work.quantity),
        tags: work.tags.join(", "),
        status: work.status,
      });
      setExistingImage(work.imageUrl);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, user, id, loaded]);

  const set = <K extends keyof ArtworkDraft>(key: K, value: ArtworkDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  function handleImageChange(file: File | null) {
    setImage(file);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(status: ArtworkStatus) {
    if (!user) return;
    const nextErrors = validateArtworkForm(draft, image, Boolean(existingImage));
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setGlobalError("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    setGlobalError(null);
    const payload = {
      title: draft.title,
      description: draft.description,
      price: Number(draft.price),
      category: draft.category,
      type: draft.type,
      medium: draft.medium,
      dimensions: draft.dimensions,
      year: Number(draft.year),
      quantity: Number(draft.quantity),
      tags: draft.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 12),
      image,
    };
    try {
      if (mode === "add") {
        await createArtwork(user.id, { ...payload, status });
        notify(
          status === "published"
            ? "Artwork published — it's now live on Discover"
            : "Draft saved"
        );
      } else if (id) {
        await updateArtwork(user.id, id, { ...payload, status });
        notify(
          status === "published"
            ? "Artwork updated and live on Discover"
            : "Artwork updated"
        );
      }
      void navigate("/dashboard/artist/artwork");
    } catch (err) {
      setGlobalError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  const shownPreview = previewUrl ?? existingImage;

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container className="max-w-3xl">
        <ArtistPageHeading
          title={mode === "add" ? "Add Artwork" : "Edit Artwork"}
          blurb={
            mode === "add"
              ? "Upload a piece to your studio. Save it as a draft or publish it straight to the Discover page."
              : "Update the details of this listing, or republish it to Discover."
          }
        />

        {demoMode && (
          <div className="mb-6 flex items-start gap-2.5 rounded-lg bg-brass-50 px-4 py-3 text-sm text-brass-800 ring-1 ring-brass-200">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>
              Demo mode — uploads are stored locally in your browser. Add
              Supabase credentials to <code className="font-mono text-xs">.env.local</code>{" "}
              to store artwork in the real database and storage bucket.
            </p>
          </div>
        )}

        {globalError && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {globalError}
          </p>
        )}

        {!loaded ? (
          <p className="py-16 text-center text-sm text-ink-400">Loading…</p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit(draft.status);
            }}
            className="flex flex-col gap-8"
            noValidate
          >
            {/* Image upload */}
            <section className="rounded-xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100 sm:p-7">
              <p className="eyebrow mb-4">Artwork image</p>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "group relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-ink-50 ring-1 ring-ink-200 transition-colors hover:ring-ink-400 sm:w-56",
                    errors.image && "ring-2 ring-red-400"
                  )}
                >
                  {shownPreview ? (
                    <>
                      <img
                        src={shownPreview}
                        alt="Artwork preview"
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute right-2 top-2 rounded-full bg-canvas-raised/90 p-1.5 text-ink-700 shadow-card backdrop-blur transition-colors hover:text-ink-950">
                        <X className="size-3.5" />
                      </span>
                    </>
                  ) : (
                    <span className="flex flex-col items-center gap-2 text-ink-400 transition-colors group-hover:text-ink-600">
                      <ImagePlus className="size-7" />
                      <span className="text-sm font-medium">Upload image</span>
                      <span className="text-xs">JPEG, PNG, WebP · max 5 MB</span>
                    </span>
                  )}
                </button>

                <div className="flex-1 text-sm leading-relaxed text-ink-500">
                  <p className="font-medium text-ink-800">Tips for great photos</p>
                  <ul className="mt-2 list-disc space-y-1 pl-4">
                    <li>Use soft, even daylight — avoid harsh shadows.</li>
                    <li>Shoot straight-on so the frame edges stay parallel.</li>
                    <li>Crop tightly to the artwork, not the wall around it.</li>
                  </ul>
                  {errors.image && (
                    <p className="mt-3 text-sm font-medium text-red-600">
                      {errors.image}
                    </p>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(event) =>
                  handleImageChange(event.target.files?.[0] ?? null)
                }
              />
            </section>

            {/* Details */}
            <section className="rounded-xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100 sm:p-7">
              <p className="eyebrow mb-5">Details</p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="aw-title" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="aw-title"
                    value={draft.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. Morning on the Ganges"
                    className={cn(fieldClass, errors.title && "ring-2 ring-red-400")}
                  />
                  {errors.title && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.title}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="aw-desc" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="aw-desc"
                    value={draft.description}
                    onChange={(e) => set("description", e.target.value)}
                    rows={4}
                    placeholder="The story, technique and feeling behind the piece…"
                    className={cn(
                      "w-full rounded-lg bg-canvas px-3.5 py-3 text-sm text-ink-900 ring-1 ring-ink-200 transition-shadow placeholder:text-ink-400 hover:ring-ink-300 focus:ring-2 focus:ring-brass-500 focus:outline-none",
                      errors.description && "ring-2 ring-red-400"
                    )}
                  />
                  {errors.description && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="aw-price" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Price (INR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="aw-price"
                    type="number"
                    min={1}
                    step="1"
                    value={draft.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="25000"
                    className={cn(fieldClass, errors.price && "ring-2 ring-red-400")}
                  />
                  {errors.price && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.price}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="aw-category" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="aw-category"
                    value={draft.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={cn(fieldClass, "cursor-pointer appearance-none", errors.category && "ring-2 ring-red-400")}
                  >
                    <option value="">Choose…</option>
                    {CATEGORY_FILTERS.map((c) => (
                      <option key={c.id} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink-800">
                    Artwork type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    {TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => set("type", option.value)}
                        className={cn(
                          "h-11 flex-1 cursor-pointer rounded-lg text-sm font-semibold ring-1 transition-colors",
                          draft.type === option.value
                            ? "bg-ink-950 text-canvas ring-ink-950"
                            : "bg-canvas text-ink-700 ring-ink-200 hover:ring-ink-400"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="aw-medium" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Medium <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="aw-medium"
                    value={draft.medium}
                    onChange={(e) => set("medium", e.target.value)}
                    placeholder="e.g. Oil on canvas"
                    className={cn(fieldClass, errors.medium && "ring-2 ring-red-400")}
                  />
                  {errors.medium && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.medium}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="aw-dimensions" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Dimensions <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="aw-dimensions"
                    value={draft.dimensions}
                    onChange={(e) => set("dimensions", e.target.value)}
                    placeholder='e.g. 24 × 36 in'
                    className={cn(fieldClass, errors.dimensions && "ring-2 ring-red-400")}
                  />
                  {errors.dimensions && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.dimensions}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="aw-year" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Year created <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="aw-year"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={draft.year}
                    onChange={(e) => set("year", e.target.value)}
                    className={cn(fieldClass, errors.year && "ring-2 ring-red-400")}
                  />
                  {errors.year && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">{errors.year}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="aw-quantity" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="aw-quantity"
                    type="number"
                    min={1}
                    max={999}
                    value={draft.quantity}
                    onChange={(e) => set("quantity", e.target.value)}
                    className={cn(fieldClass, errors.quantity && "ring-2 ring-red-400")}
                  />
                  {errors.quantity && (
                    <p className="mt-1.5 text-xs font-medium text-red-600">
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="aw-tags" className="mb-1.5 block text-sm font-medium text-ink-800">
                    Tags <span className="text-ink-400">(comma separated, up to 12)</span>
                  </label>
                  <input
                    id="aw-tags"
                    value={draft.tags}
                    onChange={(e) => set("tags", e.target.value)}
                    placeholder="abstract, warm tones, canvas"
                    className={fieldClass}
                  />
                  {draft.tags.trim() && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {draft.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .slice(0, 12)
                        .map((tag) => (
                          <Badge key={tag} tone="neutral">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Status + actions */}
            <section className="rounded-xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100 sm:p-7">
              <p className="eyebrow mb-5">Visibility</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => set("status", option.value)}
                    className={cn(
                      "h-10 cursor-pointer rounded-full px-4 text-sm font-semibold ring-1 transition-colors",
                      draft.status === option.value
                        ? "bg-ink-950 text-canvas ring-ink-950"
                        : "bg-canvas text-ink-700 ring-ink-200 hover:ring-ink-400"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-ink-500">
                {draft.status === "published"
                  ? "This piece will be visible to everyone on the Discover page."
                  : draft.status === "draft"
                    ? "Drafts are only visible to you."
                    : draft.status === "sold"
                      ? "Sold pieces stay on your profile as a record."
                      : "Archived pieces are hidden from the shop."}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-ink-950 px-6 text-sm font-semibold text-canvas transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="size-4.5 animate-spin" />
                  ) : (
                    <Save className="size-4.5" />
                  )}
                  {saving
                    ? "Saving…"
                    : mode === "add"
                      ? "Save artwork"
                      : "Save changes"}
                </button>
                {draft.status !== "published" && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void handleSubmit("published")}
                    className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md bg-brass-500 px-6 text-sm font-semibold text-ink-950 transition-colors hover:bg-brass-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="size-4.5" />
                    Publish now
                  </button>
                )}
                <Link
                  to="/dashboard/artist/artwork"
                  className="text-sm font-medium text-ink-500 transition-colors hover:text-ink-950"
                >
                  Cancel
                </Link>
              </div>
            </section>
          </form>
        )}
      </Container>
    </div>
  );
}
