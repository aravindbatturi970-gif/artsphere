import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { validateSignIn } from "@/lib/validation";
import type { FieldError } from "@/lib/validation";

/**
 * Sign in with email + password and an optional "remember this session".
 * On success the user lands on the dashboard for their role, or back to
 * the page they were trying to reach.
 */
export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fieldError = (field: string) =>
    errors.find((e) => e.field === field)?.message ?? null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const validation = validateSignIn({ email, password });
    setErrors(validation);
    if (validation.length > 0) return;

    setSubmitting(true);
    const result = await signIn({ email, password, remember });
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    const from = (location.state as { from?: string } | null)?.from;
    // The AuthProvider state update lands before this navigation renders.
    void navigate(from ?? "/dashboard", { replace: true });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage your collection, follow artists and keep your wishlist close."
      footer={
        <p>
          New to ArtSphere?{" "}
          <Link
            to="/sign-up"
            className="font-semibold text-ink-950 underline decoration-brass-400 underline-offset-4 hover:decoration-brass-600"
          >
            Create an account
          </Link>
        </p>
      }
    >
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
          error={fieldError("email")}
        />

        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldError("password")}
        />

        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="size-4 accent-brass-600"
            />
            Remember this session
          </label>
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-ink-500 underline decoration-ink-200 underline-offset-4 transition-colors hover:text-ink-950"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign In"}
        </Button>
      </form>
    </AuthShell>
  );
}
