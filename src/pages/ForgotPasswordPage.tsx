import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { validateResetEmail } from "@/lib/validation";

/**
 * Forgot password: requests a Supabase reset email. In demo mode the flow
 * completes locally with the same success state.
 */
export function ForgotPasswordPage() {
  const { requestPasswordReset, demoMode } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const validation = validateResetEmail(email);
    setError(validation);
    if (validation) return;

    setSubmitting(true);
    const result = await requestPasswordReset(email);
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send a link to set a new one."
      footer={
        <p>
          Remembered it?{" "}
          <Link
            to="/sign-in"
            className="font-semibold text-ink-950 underline decoration-brass-400 underline-offset-4 hover:decoration-brass-600"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      {sent ? (
        <div className="rounded-lg bg-ink-50 p-6 text-center ring-1 ring-ink-100">
          <MailCheck className="mx-auto size-8 text-brass-600" />
          <p className="mt-3 font-display text-xl font-medium text-ink-950">
            Check your inbox
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            {demoMode
              ? "Demo mode: no real email is sent. With Supabase configured, a reset link arrives within a minute."
              : `We sent a reset link to ${email}. It expires shortly — check Spam if it hasn't arrived.`}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          {formError && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200"
            >
              {formError}
            </p>
          )}

          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
