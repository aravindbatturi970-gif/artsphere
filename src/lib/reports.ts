import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Report } from "@/types";

/**
 * Reports filing (public side of the Stage 9 moderation system).
 *
 * Any signed-in user can report artwork, an artist, or a user. Reports
 * land in the admin queue (`reports` table in Supabase mode, a local
 * store in demo mode) with status 'open'.
 */

export const REPORT_REASONS = [
  "Copyright violation",
  "Inappropriate content",
  "Misrepresented artwork",
  "Suspicious behaviour",
  "Spam or scams",
  "Other",
] as const;

export interface FileReportInput {
  targetType: Report["targetType"];
  targetId: string;
  targetLabel: string;
  reporterId: string | null;
  reporterName: string;
  reason: string;
  details: string;
}

export async function fileReport(input: FileReportInput): Promise<void> {
  if (isSupabaseConfigured) {
    const { error } = await getSupabase().from("reports").insert({
      target_type: input.targetType,
      target_id: input.targetId,
      target_label: input.targetLabel,
      reporter_id: input.reporterId,
      reporter_name: input.reporterName,
      reason: input.reason,
      details: input.details,
      status: "open",
    });
    if (error) throw new Error(error.message);
    return;
  }

  const report: Report = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-report`,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    reporterId: input.reporterId,
    reporterName: input.reporterName,
    reason: input.reason,
    details: input.details,
    status: "open",
    resolutionNote: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };

  try {
    const raw = window.localStorage.getItem("artsphere:reports");
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const reports = Array.isArray(parsed) ? (parsed as Report[]) : [];
    reports.push(report);
    window.localStorage.setItem("artsphere:reports", JSON.stringify(reports));
  } catch {
    // Storage unavailable — the report stays in-memory only.
  }
}
