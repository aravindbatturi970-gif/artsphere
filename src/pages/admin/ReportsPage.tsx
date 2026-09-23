import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Flag, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { AdminHeading, AdminCard } from "@/components/admin/AdminLayout";
import {
  listReports,
  resolveReport,
  AdminDataError,
} from "@/lib/admin";
import { cn } from "@/lib/utils";
import type { Report } from "@/types";

type Tab = "open" | "resolved" | "dismissed";

const TARGET_LINK: Record<Report["targetType"], (id: string) => string> = {
  artwork: (id) => `/artwork/${id}`,
  artist: (id) => `/artist/${id}`,
  user: () => "/admin/users",
};

/**
 * Admin Reports queue: filed reports against artwork, artists or users,
 * with resolve (action taken) and dismiss (no action) outcomes.
 */
export function AdminReportsPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [tab, setTab] = useState<Tab>("open");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    listReports()
      .then((rows) => {
        if (!cancelled) setReports(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load reports.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (reports ?? []).filter((r) => r.status === tab),
    [reports, tab]
  );

  async function close(report: Report, status: "resolved" | "dismissed") {
    setError(null);
    setBusy(report.id);
    try {
      await resolveReport(report.id, status, note.trim() || null);
      setReports((prev) =>
        (prev ?? []).map((r) =>
          r.id === report.id
            ? {
                ...r,
                status,
                resolutionNote: note.trim() || null,
                resolvedAt: new Date().toISOString(),
              }
            : r
        )
      );
      setNoteFor(null);
      setNote("");
      setTab(status);
    } catch (err) {
      setError(
        err instanceof AdminDataError ? err.message : "Could not update report."
      );
    } finally {
      setBusy(null);
    }
  }

  const counts = useMemo(() => {
    const map: Record<Tab, number> = { open: 0, resolved: 0, dismissed: 0 };
    for (const r of reports ?? []) map[r.status] += 1;
    return map;
  }, [reports]);

  return (
    <div>
      <AdminHeading
        title="Reports"
        blurb="Community reports against artwork, artists and users."
      />

      {error && (
        <p className="mb-5 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-300 ring-1 ring-red-500/30">
          {error}
        </p>
      )}

      <div className="mb-5 flex gap-2">
        {(["open", "resolved", "dismissed"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-2 text-xs font-semibold capitalize ring-1 transition-colors",
              tab === t
                ? "bg-canvas text-ink-950 ring-canvas"
                : "text-canvas/60 ring-canvas/20 hover:bg-canvas/10"
            )}
          >
            {t} ({counts[t]})
          </button>
        ))}
      </div>

      <AdminCard className="!p-0">
        <ul className="divide-y divide-canvas/10">
          {reports === null && (
            <li className="px-5 py-8 text-sm text-canvas/40">
              Loading reports…
            </li>
          )}
          {filtered.length === 0 && (
            <li className="flex flex-col items-center px-5 py-10 text-center">
              <Flag className="size-6 text-canvas/30" />
              <p className="mt-3 text-sm text-canvas/40">
                No {tab} reports.
              </p>
            </li>
          )}
          {filtered.map((r) => {
            const link = TARGET_LINK[r.targetType](r.targetId);
            return (
              <li key={r.id} className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-canvas">
                      <Link
                        to={link}
                        className="inline-flex items-center gap-1 transition-colors hover:text-brass-300"
                      >
                        {r.targetLabel || r.targetId}
                        <ExternalLink className="size-3" />
                      </Link>
                      <span className="rounded-full bg-canvas/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-canvas/60 ring-1 ring-canvas/20">
                        {r.targetType}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-canvas/70">
                      {r.reason}
                      {r.details && (
                        <span className="text-canvas/50"> — {r.details}</span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-canvas/40">
                      Reported by {r.reporterName || "anonymous"} ·{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {r.resolutionNote && ` · note: ${r.resolutionNote}`}
                    </p>
                  </div>

                  {r.status === "open" && (
                    <div className="flex shrink-0 items-center gap-2">
                      {noteFor === r.id ? (
                        <>
                          <input
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Resolution note…"
                            className="w-40 rounded-lg border border-canvas/15 bg-canvas/[0.04] px-3 py-1.5 text-xs text-canvas placeholder:text-canvas/30 focus:border-brass-500/60 focus:outline-none"
                          />
                          <button
                            type="button"
                            disabled={busy === r.id}
                            onClick={() => void close(r, "resolved")}
                            className="cursor-pointer rounded-full bg-emerald-500/10 p-2 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20 disabled:opacity-50"
                            aria-label="Resolve report"
                          >
                            <CheckCircle2 className="size-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy === r.id}
                            onClick={() => void close(r, "dismissed")}
                            className="cursor-pointer rounded-full bg-canvas/10 p-2 text-canvas/60 ring-1 ring-canvas/20 hover:bg-canvas/20 disabled:opacity-50"
                            aria-label="Dismiss report"
                          >
                            <XCircle className="size-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setNoteFor(r.id)}
                          className="cursor-pointer rounded-full bg-canvas/10 px-4 py-2 text-xs font-semibold text-canvas/70 ring-1 ring-canvas/20 transition-colors hover:bg-canvas/20 hover:text-canvas"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </AdminCard>
    </div>
  );
}
