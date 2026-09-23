import { useEffect, useState } from "react";
import { NavLink as RouterNavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Images,
  PlusCircle,
  ReceiptText,
  Wallet,
  UserRound,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard/artist", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/artist/artwork", label: "My Artwork", icon: Images },
  { to: "/dashboard/artist/add", label: "Add Artwork", icon: PlusCircle },
  { to: "/dashboard/artist/orders", label: "Orders", icon: ReceiptText },
  { to: "/dashboard/artist/earnings", label: "Earnings", icon: Wallet },
  { to: "/dashboard/artist/profile", label: "Profile", icon: UserRound },
  { to: "/dashboard/artist/settings", label: "Settings", icon: Settings },
];

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

/**
 * Artist dashboard shell: fixed left sidebar on desktop, slide-down menu
 * on mobile, and the shared dashboard hero. All dashboard sub-pages are
 * rendered through the <Outlet />.
 */
export function ArtistDashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const nav = (
    <nav aria-label="Artist dashboard" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }: NavItem) => (
        <RouterNavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-ink-950 text-canvas shadow-card"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-950"
            )
          }
        >
          <Icon className="size-4.5" />
          {label}
        </RouterNavLink>
      ))}
    </nav>
  );

  return (
    <div className="bg-ink-50/60 pt-16 pb-20 md:pt-20">
      {/* Mobile top bar */}
      <div className="sticky top-16 z-30 border-b border-ink-100 bg-canvas/90 backdrop-blur md:hidden">
        <Container className="!px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="min-w-0">
              <p className="eyebrow">Artist dashboard</p>
              <p className="truncate text-sm font-semibold text-ink-950">
                {user?.fullName ?? "Studio"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Toggle dashboard menu"
              className="rounded-md p-2 text-ink-800 transition-colors hover:bg-ink-100"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
          {menuOpen && (
            <div className="pb-3">{nav}</div>
          )}
        </Container>
      </div>

      <Container className="mt-6 md:mt-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">
          {/* Sidebar (desktop) */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-28 flex flex-col gap-6">
              <div className="rounded-xl bg-canvas-raised p-5 shadow-card ring-1 ring-ink-100">
                <p className="eyebrow mb-1">Artist</p>
                <p className="truncate text-sm font-semibold text-ink-950">
                  {user?.fullName ?? "Studio"}
                </p>
                <p className="truncate text-xs text-ink-400">{user?.email}</p>
              </div>
              {nav}
            </div>
          </aside>

          {/* Page content */}
          <div className="min-w-0 flex-1">
            <Outlet />
          </div>
        </div>
      </Container>
    </div>
  );
}

/** Hero heading shared by dashboard pages. */
export function ArtistPageHeading({
  title,
  blurb,
}: {
  title: string;
  blurb?: string;
}) {
  return (
    <Reveal>
      <div className="mb-8">
        <h1 className="display-title text-2xl sm:text-3xl">{title}</h1>
        {blurb && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
            {blurb}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/** Dashboard metric card (shared with the overview grid). */
export function ArtistStatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof LayoutDashboard;
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl p-6 ring-1",
        accent
          ? "bg-ink-950 text-canvas ring-ink-950"
          : "bg-canvas-raised shadow-card ring-ink-100"
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full",
          accent ? "bg-canvas/10 text-brass-300" : "bg-ink-950 text-canvas"
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-2xl font-medium">{value}</p>
        <p
          className={cn(
            "text-xs uppercase tracking-[0.14em]",
            accent ? "text-canvas/60" : "text-ink-400"
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
