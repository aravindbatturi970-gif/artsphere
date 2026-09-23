import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { AdminHeading, AdminCard } from "@/components/admin/AdminLayout";
import {
  listAdminCategories,
  createCategory,
  renameCategory,
  deleteCategory,
  AdminDataError,
  type AdminCategory,
} from "@/lib/admin";

/**
 * Admin Categories: full CRUD. In Supabase mode writes are gated by the
 * categories_admin_* RLS policies (admin role required server-side).
 */
export function AdminCategoriesPage() {
  const [cats, setCats] = useState<AdminCategory[] | null>(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAdminCategories()
      .then((rows) => {
        if (!cancelled) setCats(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load categories."
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      const rows = await listAdminCategories();
      setCats(rows);
    } catch (err) {
      setError(
        err instanceof AdminDataError ? err.message : "Category action failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AdminHeading
        title="Categories"
        blurb="The browse taxonomy used across Discover and the homepage."
      />

      {error && (
        <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <AdminCard className="!p-0">
        {/* Add */}
        <form
          className="flex gap-3 border-b border-canvas/10 px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newName.trim() || busy) return;
            void run(async () => {
              await createCategory(newName);
              setNewName("");
            });
          }}
        >
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New category name…"
            className="flex-1 rounded-lg border border-canvas/15 bg-canvas/[0.04] px-3.5 py-2.5 text-sm text-canvas placeholder:text-canvas/30 focus:border-brass-500/60 focus:outline-none focus:ring-2 focus:ring-brass-500/20"
          />
          <button
            type="submit"
            disabled={busy || !newName.trim()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brass-500 px-4 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-brass-400 disabled:opacity-50"
          >
            <Plus className="size-4" />
            Add
          </button>
        </form>

        <ul className="divide-y divide-canvas/10">
          {cats === null && (
            <li className="px-5 py-8 text-sm text-canvas/40">Loading…</li>
          )}
          {(cats ?? []).map((c) => (
            <li key={c.id} className="flex items-center gap-3 px-5 py-3.5">
              {editing === c.id ? (
                <>
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 rounded-lg border border-canvas/15 bg-canvas/[0.04] px-3 py-2 text-sm text-canvas focus:border-brass-500/60 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await renameCategory(c.id, editValue);
                        setEditing(null);
                      })
                    }
                    className="cursor-pointer rounded-full bg-emerald-500/10 p-2 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50"
                    aria-label="Save category name"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="cursor-pointer rounded-full bg-canvas/10 p-2 text-canvas/60 ring-1 ring-canvas/20 hover:bg-canvas/20"
                    aria-label="Cancel editing"
                  >
                    <X className="size-4" />
                  </button>
                </>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-canvas">
                      {c.name}
                    </p>
                    <p className="text-xs text-canvas/40">/{c.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c.id);
                      setEditValue(c.name);
                    }}
                    className="cursor-pointer rounded-full bg-canvas/10 p-2 text-canvas/60 ring-1 ring-canvas/20 transition-colors hover:bg-canvas/20 hover:text-canvas"
                    aria-label={`Rename ${c.name}`}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void run(() => deleteCategory(c.id))}
                    className="cursor-pointer rounded-full bg-red-500/10 p-2 text-red-300 ring-1 ring-red-500/30 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                    aria-label={`Remove ${c.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </AdminCard>

      <p className="mt-4 text-xs leading-relaxed text-canvas/40">
        Category changes apply to the browse taxonomy. Existing artwork keeps
        its category label; new listings will offer the updated set.
      </p>
    </div>
  );
}
