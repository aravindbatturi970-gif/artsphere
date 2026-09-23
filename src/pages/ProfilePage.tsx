import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Save } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/lib/shop";

const CAPABILITIES: Record<string, string[]> = {
  buyer: [
    "Collect original artwork",
    "Wishlist and follow artists",
    "Order history (coming soon)",
  ],
  artist: [
    "Studio dashboard",
    "Sell original works",
    "Follower insights (coming soon)",
  ],
  admin: [
    "Platform overview",
    "User management (coming soon)",
    "Moderation queue (coming soon)",
  ],
};

/**
 * Account profile: identity (read-only for now), editable bio, capability
 * list and sign-out. Profile image upload arrives with the uploads stage.
 */
export function ProfilePage() {
  const { user, signOutUser, demoMode } = useAuth();
  const { notify } = useShop();
  const navigate = useNavigate();
  const [bio, setBio] = useState(user?.bio ?? "");
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    setSigningOut(true);
    await signOutUser();
    notify("Signed out — see you soon");
    void navigate("/", { replace: true });
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    // Bio persistence moves to the profiles table in the backend stage.
    notify(
      demoMode
        ? "Saved locally (demo mode) — connects to Supabase in the backend stage"
        : "Profile saved"
    );
  }

  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-ink-950 px-6 py-12 shadow-modal sm:px-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-brass-500/15 blur-3xl"
            />
            <div className="relative z-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brass-400 shadow-modal ring-2 ring-canvas/20">
                <span className="font-display text-xl font-semibold text-ink-950">
                  {initials || "?"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-3xl font-medium tracking-tight text-canvas">
                  {user.fullName}
                </h1>
                <p className="mt-1 text-sm text-canvas/60">
                  {user.email} · {user.role} · joined{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Button variant="secondary" onClick={handleSignOut} disabled={signingOut}>
                <LogOut className="size-4.5" />
                {signingOut ? "Signing out…" : "Logout"}
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Reveal>
            <form
              onSubmit={handleSave}
              className="rounded-2xl bg-canvas-raised p-8 shadow-card ring-1 ring-ink-100 sm:p-10"
            >
              <h2 className="font-display text-2xl font-medium text-ink-950">
                Bio
              </h2>
              <p className="mt-2 text-sm text-ink-500">
                A short introduction shown on your public profile.
              </p>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                maxLength={500}
                placeholder={
                  user.role === "artist"
                    ? "Tell collectors about your practice…"
                    : "What draws you to collecting art?"
                }
                className="mt-5 w-full resize-none rounded-lg bg-canvas p-4 text-[15px] text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brass-500 focus:outline-none"
              />
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-ink-400">
                  {bio.length}/500
                </span>
                <Button type="submit" size="sm">
                  <Save className="size-4" />
                  Save bio
                </Button>
              </div>
            </form>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-2xl bg-ink-50/80 p-8 ring-1 ring-ink-100">
              <p className="eyebrow mb-4">Your account</p>
              <ul className="flex flex-col gap-3">
                {(CAPABILITIES[user.role] ?? []).map((capability) => (
                  <li key={capability} className="text-sm text-ink-600">
                    {capability}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-ink-100 pt-5 text-xs leading-relaxed text-ink-400">
                Profile images arrive with the uploads stage. Passwords and
                email changes are managed securely through Supabase Auth.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </div>
  );
}
