import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { validatePassword } from "@/lib/validation";

/**
 * Completes a Supabase password recovery (the email link lands here with a
 * recovery session in the URL). Without Supabase configured, explains the
 * situation gracefully.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { demoMode } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const validation = validatePassword(password);
    setError(validation);
    if (validation) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (demoMode || !isSupabaseConfigured) {
      setFormError(
        "Password resets need Supabase to be configured (see SUPABASE_SETUP.md)."
      );
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await getSupabase().auth.updateUser({
      password,
    });
    setSubmitting(false);

    if (updateError) {
      setFormError(updateError.message);
      return;
    }
    setDone(true);
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose something strong — at least 8 characters with a letter and a number."
      footer={
        <p>
          <Link
            to="/sign-in"
            className="font-semibold text-ink-950 underline decoration-brass-400 underline-offset-4 hover:decoration-brass-600"
          >
            Back to sign in
          </Link>
        </p>
      }
    >
      {done ? (
        <div className="rounded-lg bg-ink-50 p-6 text-center ring-1 ring-ink-100">
          <p className="font-display text-xl font-medium text-ink-950">
            Password updated
          </p>
          <p className="mt-2 text-sm text-ink-500">
            Your new password is active.
          </p>
          <Button className="mt-5" onClick={() => void navigate("/sign-in")}>
            Sign in
          </Button>
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

          <PasswordField
            label="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={error}
          />

          <PasswordField
            label="Confirm new password"
            autoComplete="new-password"
            placeholder="Repeat your new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
