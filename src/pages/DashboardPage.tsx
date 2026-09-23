import { Navigate } from "react-router-dom";
import { Heart, ShoppingBag, Users, Settings, Compass, PlusCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/lib/auth";
import { useShop } from "@/lib/shop";
import { useFavorites } from "@/lib/favorites";
import { usePublicCatalog } from "@/lib/public-uploads";
import type { UserProfile } from "@/types";

/** Landing card shared by the dashboards. */
function DashboardHero({
  user,
  headline,
  blurb,
}: {
  user: UserProfile;
  headline: string;
  blurb: string;
}) {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-2xl bg-ink-950 px-6 py-12 shadow-modal sm:px-10 md:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-brass-500/15 blur-3xl"
        />
        <div className="relative z-10">
          <p className="eyebrow mb-3 text-brass-300/80">
            {user.role} dashboard
          </p>
          <h1 className="font-display text-3xl font-medium tracking-tight text-canvas sm:text-4xl">
            {headline}
          </h1>
          <p className="mt-3 max-w-xl text-balance text-canvas/70">{blurb}</p>
          <p className="mt-5 text-sm text-canvas/50">
            Signed in as {user.email}
          </p>
        </div>
      </div>
    </Reveal>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Heart;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-canvas-raised p-6 shadow-card ring-1 ring-ink-100">
      <span className="flex size-11 items-center justify-center rounded-full bg-ink-950 text-canvas">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-display text-2xl font-medium text-ink-950">{value}</p>
        <p className="text-xs uppercase tracking-[0.14em] text-ink-400">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------- Buyer -------------------------------- */

function BuyerDashboard({ user }: { user: UserProfile }) {
  const { cartCount } = useShop();
  const { likedIds } = useFavorites();
  const { catalog } = usePublicCatalog();

  return (
    <>
      <DashboardHero
        user={user}
        headline={`Welcome back, ${user.fullName.split(" ")[0]}`}
        blurb="Your collection, wishlist and follows — all in one quiet place."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={ShoppingBag} value={String(cartCount)} label="In cart" />
        <StatCard icon={Heart} value={String(likedIds.size)} label="Wishlisted" />
        <StatCard icon={Compass} value={String(catalog.length)} label="Works to explore" />
      </div>
      <Reveal>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink to="/discover" size="lg">
            Discover artwork
          </ButtonLink>
          <ButtonLink to="/orders" variant="secondary" size="lg">
            Your orders
          </ButtonLink>
          <ButtonLink to="/cart" variant="secondary" size="lg">
            View cart
          </ButtonLink>
          <ButtonLink to="/wishlist" variant="secondary" size="lg">
            View wishlist
          </ButtonLink>
        </div>
      </Reveal>
    </>
  );
}

/* ------------------------------- Artist ------------------------------- */

/**
 * Fallback artist dashboard (route guard safety net). The real artist
 * dashboard lives at the same route via ArtistDashboardLayout — this only
 * renders if the nested routes are bypassed.
 */
function ArtistDashboard({ user }: { user: UserProfile }) {
  return (
    <>
      <DashboardHero
        user={user}
        headline="Your studio awaits"
        blurb="Manage your artwork, publish new pieces and track your studio."
      />
      <Reveal>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink to="/dashboard/artist/add" size="lg">
            <PlusCircle className="size-4.5" />
            Add Artwork
          </ButtonLink>
          <ButtonLink to="/dashboard/artist/artwork" variant="secondary" size="lg">
            My Artwork
          </ButtonLink>
        </div>
      </Reveal>
    </>
  );
}

/* -------------------------------- Admin ------------------------------- */

function AdminDashboard({ user }: { user: UserProfile }) {
  return (
    <>
      <DashboardHero
        user={user}
        headline="Platform overview"
        blurb="A skeleton for now — moderation, user management and analytics arrive with the admin stage."
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} value="16" label="Artworks" />
        <StatCard icon={Users} value="8" label="Artists" />
        <StatCard icon={Settings} value="Soon" label="Moderation queue" />
      </div>
      <Reveal>
        <p className="mt-10 rounded-xl bg-ink-50/80 p-6 text-sm leading-relaxed text-ink-500 ring-1 ring-ink-100">
          Admin tooling (user management, artwork review, order oversight) is
          intentionally out of scope for this stage. The role, guard and shell
          are in place so that stage can plug straight in.
        </p>
      </Reveal>
    </>
  );
}

/* ------------------------------ Dispatcher ---------------------------- */

/** /dashboard redirects to the dashboard for the signed-in role. */
export function DashboardRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/sign-in" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
}

export function BuyerDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <BuyerDashboard user={user} />
      </Container>
    </div>
  );
}

export { ArtistDashboard as ArtistDashboardFallback };

export function AdminDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <AdminDashboard user={user} />
      </Container>
    </div>
  );
}
