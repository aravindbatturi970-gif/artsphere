import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Palette, ShoppingBag, Check } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField, PasswordField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { validateSignUp } from "@/lib/validation";
import { cn } from "@/lib/utils";
import type { FieldError } from "@/lib/validation";
import type { UserRole } from "@/types";

/**
 * Registration: full name, email, password + confirm, and an account type
 * (Buyer or Artist). Artist accounts unlock the studio dashboard later;
 * the role is stored on the auth record and the profiles row.
 */
export function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("buyer");
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const fieldError = (field: string) =>
    errors.find((e) => e.field === field)?.message ?? null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const validation = validateSignUp({
      fullName,
      email,
      password,
      confirmPassword,
      role,
    });
    setErrors(validation);
    if (validation.length > 0) return;

    setSubmitting(true);
    const result = await signUp({ fullName, email, password, role });
    setSubmitting(false);

    if (result.error) {
      setFormError(result.error);
      return;
    }

    if (result.needsConfirmation) {
      setConfirmationSent(true);
      return;
    }

    void navigate("/dashboard", { replace: true });
  }

  const roleOptions: Array<{
    id: UserRole;
    label: string;
    description: string;
    icon: typeof Palette;
  }> = [
    {
      id: "buyer",
      label: "Buyer",
      description: "Collect art, follow artists, keep a wishlist.",
      icon: ShoppingBag,
    },
    {
      id: "artist",
      label: "Artist",
      description: "Open a studio and sell your work.",
      icon: Palette,
    },
  ];

  return (
    <AuthShell
      title="Create your account"
      subtitle="One account for collecting, following and — if you like — selling."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            to="/sign-in"
            className="font-semibold text-ink-950 underline decoration-brass-400 underline-offset-4 hover:decoration-brass-600"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {confirmationSent ? (
        <div className="rounded-lg bg-ink-50 p-6 text-center ring-1 ring-ink-100">
          <p className="font-display text-xl font-medium text-ink-950">
            Check your inbox
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            We sent a confirmation link to <strong>{email}</strong>. Confirm
            your email and sign in to continue.
          </p>
          <Link
            to="/sign-in"
            className="mt-5 inline-flex h-11 items-center rounded-md bg-ink-950 px-6 text-sm font-semibold text-canvas transition-colors hover:bg-ink-800"
          >
            Back to sign in
          </Link>
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
            label="Full name"
            autoComplete="name"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={fieldError("fullName")}
          />

          <FormField
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError("email")}
          />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
              Account type
            </p>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const selected = role === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRole(option.id)}
                    aria-pressed={selected}
                    className={cn(
                      "relative cursor-pointer rounded-lg p-4 text-left ring-1 transition-all duration-300",
                      selected
                        ? "bg-ink-950 text-canvas ring-ink-950"
                        : "bg-canvas text-ink-900 ring-ink-200 hover:ring-ink-400"
                    )}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-brass-500 text-ink-950">
                        <Check className="size-3" />
                      </span>
                    )}
                    <option.icon
                      className={cn(
                        "size-5",
                        selected ? "text-brass-400" : "text-ink-400"
                      )}
                    />
                    <span className="mt-2 block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span
                      className={cn(
                        "mt-1 block text-xs leading-relaxed",
                        selected ? "text-canvas/70" : "text-ink-400"
                      )}
                    >
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldError("role") && (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {fieldError("role")}
              </p>
            )}
          </div>

          <PasswordField
            label="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldError("password")}
            hint="Use 8+ characters with at least one letter and one number."
          />

          <PasswordField
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldError("confirmPassword")}
          />

          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Creating account…" : "Create Account"}
          </Button>

          <p className="text-center text-xs leading-relaxed text-ink-400">
            By creating an account you agree to our terms. Passwords are
            handled by Supabase Auth — never stored by this app.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
