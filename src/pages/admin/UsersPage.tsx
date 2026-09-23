import { useEffect, useMemo, useState } from "react";
import { Search, Ban, RotateCcw, ChevronDown, UserRound } from "lucide-react";
import { AdminHeading, AdminCard } from "@/components/admin/AdminLayout";
import { useAuth } from "@/lib/auth";
import {
  listUsers,
  setAccountStatus,
  AdminDataError,
  type AdminUser,
} from "@/lib/admin";
import { cn } from "@/lib/utils";

const ROLE_TONE: Record<string, string> = {
  admin: "bg-brass-500/15 text-brass-300 ring-brass-500/30",
  artist: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  buyer: "bg-canvas/10 text-canvas/70 ring-canvas/20",
};

/**
 * Admin Users: every account, with details and account status control.
 * Disabling writes the flag server-side (Supabase) where a trigger
 * rejects future sign-ins — the UI is not the enforcement.
 */
export function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listUsers()
      .then((rows) => {
        if (!cancelled) setUsers(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load users.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.includes(q)
    );
  }, [users, query]);

  async function toggleStatus(target: AdminUser) {
    setError(null);
    setBusy(target.id);
    try {
      const next =
        target.accountStatus === "active" ? "disabled" : "active";
      await setAccountStatus(target.id, next);
      setUsers((prev) =>
        (prev ?? []).map((u) =>
          u.id === target.id ? { ...u, accountStatus: next } : u
        )
      );
    } catch (err) {
      setError(
        err instanceof AdminDataError
          ? err.message
          : "Could not update the account."
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <AdminHeading
        title="Users"
        blurb="Every account on the platform."
      />

      <div className="relative mb-5 max-w-sm">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-canvas/40" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email or role…"
          className="w-full rounded-lg border border-canvas/15 bg-canvas/[0.04] py-2.5 pl-10 pr-4 text-sm text-canvas placeholder:text-canvas/30 focus:border-brass-500/60 focus:outline-none focus:ring-2 focus:ring-brass-500/20"
        />
      </div>

      {error && (
        <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <AdminCard className="!p-0">
        <ul className="divide-y divide-canvas/10">
          {users === null && (
            <li className="px-5 py-8 text-sm text-canvas/40">Loading users…</li>
          )}
          {users !== null && filtered.length === 0 && (
            <li className="px-5 py-8 text-sm text-canvas/40">
              No users match “{query}”.
            </li>
          )}
          {filtered.map((u) => {
            const isSelf = me?.id === u.id;
            const open = expanded === u.id;
            return (
              <li key={u.id}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-canvas/10 text-xs font-bold text-canvas">
                    {u.fullName
                      .split(" ")
                      .map((p) => p[0])
                      .filter(Boolean)
                      .slice(0, 2)
                      .join("")
                      .toUpperCase() || <UserRound className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 truncate text-sm font-semibold text-canvas">
                      {u.fullName}
                      {isSelf && (
                        <span className="rounded bg-brass-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brass-300">
                          you
                        </span>
                      )}
                      {u.accountStatus === "disabled" && (
                        <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
                          disabled
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-canvas/40">{u.email}</p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1",
                      ROLE_TONE[u.role]
                    )}
                  >
                    {u.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : u.id)}
                    aria-expanded={open}
                    className="rounded-md p-1.5 text-canvas/50 transition-colors hover:bg-canvas/10 hover:text-canvas"
                    aria-label={`Details for ${u.fullName}`}
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 transition-transform duration-300",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                </div>

                {open && (
                  <div className="border-t border-canvas/10 px-5 py-4">
                    <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-canvas/40">
                          Joined
                        </dt>
                        <dd className="mt-0.5 text-canvas/80">
                          {new Date(u.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-[0.12em] text-canvas/40">
                          Role
                        </dt>
                        <dd className="mt-0.5 capitalize text-canvas/80">
                          {u.role}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-[0.12em] text-canvas/40">
                          Bio
                        </dt>
                        <dd className="mt-0.5 text-canvas/80">
                          {u.bio ?? "—"}
                        </dd>
                      </div>
                    </dl>
                    <div className="mt-4 flex items-center gap-3">
                      {isSelf ? (
                        <p className="text-xs text-canvas/40">
                          You cannot disable your own account.
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void toggleStatus(u)}
                          disabled={busy === u.id}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 transition-all duration-200 disabled:opacity-50",
                            u.accountStatus === "active"
                              ? "bg-red-500/10 text-red-300 ring-red-500/30 hover:bg-red-500/20"
                              : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30 hover:bg-emerald-500/20"
                          )}
                        >
                          {u.accountStatus === "active" ? (
                            <>
                              <Ban className="size-3.5" />
                              Disable account
                            </>
                          ) : (
                            <>
                              <RotateCcw className="size-3.5" />
                              Re-enable account
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </AdminCard>
    </div>
  );
}
