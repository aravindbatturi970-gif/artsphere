import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  UserRound,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Heart,
  ShoppingBag,
  ShieldCheck,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { NAV_LINKS } from "@/config/filters";
import { SITE } from "@/config/site";
import { useAuth, homeForRole } from "@/lib/auth";
import { useShop } from "@/lib/shop";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer",
  artist: "Artist",
  admin: "Admin",
};

/**
 * Fixed top navigation. The right side adapts to auth state:
 * logged out → Sign In / Create Account; logged in → Profile, Dashboard
 * and Logout in an account menu. Mobile mirrors the same in the drawer.
 */
export function Navbar() {
  const { isAuthenticated, user, signOutUser } = useAuth();
  const { notify, cartCount } = useShop();
  const { likedIds } = useFavorites();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    setMenuOpen(false);
    setOpen(false);
    setSigningOut(true);
    await signOutUser();
    setSigningOut(false);
    notify("Signed out — see you soon");
    void navigate("/", { replace: true });
  }

  const initials = user
    ? user.fullName
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-canvas/80 backdrop-blur-md">
      <Container>
        <nav className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link to="/" className="flex items-center gap-2.5" aria-label={`${SITE.name} home`}>
            <span className="flex size-8 items-center justify-center rounded-full bg-ink-950 text-canvas">
              <span className="block size-2.5 rounded-full bg-brass-400" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight text-ink-950">
              {SITE.name}
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="rounded-md px-3.5 py-2 text-sm font-medium text-ink-600 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-950"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Cart + wishlist (all states) */}
          <div className="flex items-center gap-1">
            <Link
              to="/wishlist"
              aria-label={`Wishlist (${likedIds.size})`}
              className="relative rounded-full p-2.5 text-ink-700 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-950"
            >
              <Heart className="size-5" />
              {likedIds.size > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brass-500 px-1 text-[10px] font-bold leading-none text-canvas">
                  {likedIds.size > 9 ? "9+" : likedIds.size}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              aria-label={`Cart (${cartCount} items)`}
              className="relative rounded-full p-2.5 text-ink-700 transition-colors duration-200 hover:bg-ink-100 hover:text-ink-950"
            >
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-ink-950 px-1 text-[10px] font-bold leading-none text-canvas">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop auth actions */}
          <div className="hidden md:block">
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={() => void navigate("/sign-in")}>
                  Sign In
                </Button>
                <Button size="sm" onClick={() => void navigate("/sign-up")}>
                  Create Account
                </Button>
              </div>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  className="flex cursor-pointer items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition-colors duration-200 hover:bg-ink-100"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-canvas">
                    {initials || <UserRound className="size-4" />}
                  </span>
                  <span className="max-w-28 truncate text-sm font-medium text-ink-900">
                    {user?.fullName.split(" ")[0]}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-ink-400 transition-transform duration-300",
                      menuOpen && "rotate-180"
                    )}
                  />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-xl bg-canvas-raised shadow-modal ring-1 ring-ink-100 animate-scale-in"
                  >
                    <div className="border-b border-ink-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink-950">
                        {user?.fullName}
                      </p>
                      <p className="truncate text-xs text-ink-400">{user?.email}</p>
                      <p className="mt-1.5 inline-flex items-center rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-semibold text-ink-600">
                        {user ? ROLE_LABELS[user.role] : ""}
                      </p>
                    </div>
                    <div className="p-1.5">
                      <Link
                        to="/profile"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950"
                      >
                        <UserRound className="size-4.5" />
                        Profile
                      </Link>
                      <Link
                        to={user ? homeForRole(user.role) : "/"}
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950"
                      >
                        <LayoutDashboard className="size-4.5" />
                        Dashboard
                      </Link>
                      {user?.role === "admin" && (
                        <Link
                          to="/admin"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-semibold text-brass-700 transition-colors hover:bg-brass-50"
                        >
                          <ShieldCheck className="size-4.5" />
                          Admin dashboard
                        </Link>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-950 disabled:opacity-50"
                      >
                        <LogOut className="size-4.5" />
                        {signingOut ? "Signing out…" : "Logout"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className="rounded-md p-2 text-ink-800 transition-colors hover:bg-ink-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </nav>
      </Container>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-ink-100 bg-canvas-raised shadow-card md:hidden animate-fade-in">
          <div className="flex flex-col gap-1 px-5 py-4">
            {isAuthenticated && user && (
              <div className="mb-2 flex items-center gap-3 border-b border-ink-100 pb-4">
                <span className="flex size-9 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-canvas">
                  {initials || <UserRound className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-950">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-ink-400">
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              </div>
            )}

            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium text-ink-800 transition-colors hover:bg-ink-100"
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile cart/wishlist shortcuts */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/wishlist"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-ink-800 ring-1 ring-ink-200 transition-colors hover:bg-ink-100"
              >
                <Heart className="size-4.5" />
                Wishlist{likedIds.size > 0 ? ` (${likedIds.size})` : ""}
              </Link>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-base font-medium text-ink-800 ring-1 ring-ink-200 transition-colors hover:bg-ink-100"
              >
                <ShoppingBag className="size-4.5" />
                Cart{cartCount > 0 ? ` (${cartCount})` : ""}
              </Link>
            </div>

            <div className="mt-2 flex flex-col gap-2 border-t border-ink-100 pt-3">
              {!isAuthenticated ? (
                <>
                  <Button
                    onClick={() => {
                      setOpen(false);
                      void navigate("/sign-in");
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOpen(false);
                      void navigate("/sign-up");
                    }}
                  >
                    Create Account
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOpen(false);
                      void navigate("/profile");
                    }}
                  >
                    <UserRound className="size-4" />
                    Profile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setOpen(false);
                      void navigate(user ? homeForRole(user.role) : "/");
                    }}
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </Button>
                  <Button onClick={handleSignOut} disabled={signingOut}>
                    <LogOut className="size-4" />
                    {signingOut ? "Signing out…" : "Logout"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
