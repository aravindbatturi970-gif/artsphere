import { useState } from "react";
import { Flag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/lib/shop";
import { fileReport, REPORT_REASONS } from "@/lib/reports";
import { cn } from "@/lib/utils";

/**
 * "Report" dialog used on artwork detail pages and artist profiles.
 * Signed-in users only; anonymous visitors are asked to sign in first.
 */
export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onClose: () => void;
  targetType: "artwork" | "artist" | "user";
  targetId: string;
  targetLabel: string;
}) {
  const { user } = useAuth();
  const { notify } = useShop();
  const [reason, setReason] = useState<string>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!user) {
      setError("Sign in to file a report.");
      return;
    }
    setSubmitting(true);
    try {
      await fileReport({
        targetType,
        targetId,
        targetLabel,
        reporterId: user.id,
        reporterName: user.fullName,
        reason,
        details: details.trim(),
      });
      notify("Report submitted — our team will review it");
      setDetails("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Report ${targetType}`}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-ink-600">
          Tell us what's wrong with{" "}
          <span className="font-semibold text-ink-950">{targetLabel}</span>.
          Reports go to the moderation team — reviewed within 48 hours.
        </p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Reason
          </label>
          <div className="flex flex-wrap gap-2">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold ring-1 transition-all duration-200",
                  reason === r
                    ? "bg-ink-950 text-canvas ring-ink-950"
                    : "bg-canvas text-ink-600 ring-ink-200 hover:ring-ink-400"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="report-details"
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            Details (optional)
          </label>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Add any context that helps the review…"
            className="w-full resize-none rounded-lg border border-ink-200 bg-canvas px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brass-500 focus:outline-none focus:ring-2 focus:ring-brass-500/20"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            <Flag className="size-4" />
            {submitting ? "Submitting…" : "Submit report"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
