import { useEffect, useState } from "react";
import {
  NavLink as RouterNavLink,
  Outlet,
  useLocation,
  Link,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Palette,
  Images,
  ReceiptText,
  Shapes,
  Flag,
  Settings,
  Menu,
  X,
  ArrowUpLeft,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * Admin shell — deliberately separate from the marketplace chrome
 * (no SiteLayout navbar/footer). A slim dark top bar replaces them so
 * the admin area reads as its own application surface.
 */

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/artists", label: "Artists", icon: Palette },
  { to: "/admin/artwork", label: "Artwork", icon: Images },
  { to: "/admin/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin/categories", label: "Categories", icon: Shapes },
  { to: "/admin/reports", label: "Reports", icon: Flag },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
        <RouterNavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-200",
              isActive
                ? "bg-canvas text-ink-950 shadow-card"
                : "text-canvas/70 hover:bg-canvas/10 hover:text-canvas"
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
    <div className="flex min-h-screen flex-col bg-ink-950">
      {/* Admin top bar (marketplace chrome intentionally absent) */}
      <header className="sticky top-0 z-40 border-b border-canvas/10 bg-ink-950/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brass-500 text-ink-950">
              <ShieldCheck className="size-4.5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold text-canvas">
                ArtSphere Admin
              </p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-canvas/40">
                Restricted area
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-canvas/50 sm:block">
              {user?.email}
            </span>
            <Link
              to="/"
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-canvas/70 ring-1 ring-canvas/20 transition-colors hover:bg-canvas/10 hover:text-canvas"
            >
              <ArrowUpLeft className="size-3.5" />
              Marketplace
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Toggle admin menu"
              className="rounded-md p-2 text-canvas/80 transition-colors hover:bg-canvas/10 lg:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="border-t border-canvas/10 px-4 py-3 lg:hidden">
            <nav aria-label="Admin mobile" className="grid grid-cols-2 gap-1.5">
              {ADMIN_NAV.map(({ to, label, icon: Icon, end }) => (
                <RouterNavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium",
                      isActive
                        ? "bg-canvas text-ink-950"
                        : "text-canvas/70 hover:bg-canvas/10"
                    )
                  }
                >
                  <Icon className="size-4" />
                  {label}
                </RouterNavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">{nav}</div>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Section heading shared by admin pages. */
export function AdminHeading({
  title,
  blurb,
}: {
  title: string;
  blurb?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-medium tracking-tight text-canvas">
        {title}
      </h1>
      {blurb && <p className="mt-1.5 text-sm text-canvas/50">{blurb}</p>}
    </div>
  );
}

/** Light card used inside the dark admin shell. */
export function AdminCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-canvas/[0.04] p-5 ring-1 ring-canvas/10",
        className
      )}
    >
      {children}
    </div>
  );
}
