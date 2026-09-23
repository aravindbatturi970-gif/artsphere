import { Link, useNavigate } from "react-router-dom";
import {
  InstagramIcon,
  XIcon,
  FacebookIcon,
  YoutubeIcon,
} from "@/components/ui/brand-icons";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/config/site";

const EXPLORE_LINKS = [
  { label: "Discover", to: "/discover" },
  { label: "Artists", to: "/#artists" },
  { label: "Categories", to: "/#categories" },
  { label: "About", to: "/#how-it-works" },
];

const COMPANY_LINKS = [
  { label: "About", to: "/#how-it-works" },
  { label: "Contact", to: "/#join" },
  { label: "Privacy", to: "/" },
  { label: "Terms", to: "/" },
];

const SOCIALS = [
  { label: "Instagram", icon: InstagramIcon, href: "/#top" },
  { label: "X (Twitter)", icon: XIcon, href: "/#top" },
  { label: "Facebook", icon: FacebookIcon, href: "/#top" },
  { label: "YouTube", icon: YoutubeIcon, href: "/#top" },
];

/**
 * Site footer: brand, link columns and social icons. Placeholder anchors
 * until the real pages/routes exist.
 */
export function Footer() {
  const navigate = useNavigate();

  const renderLink = (link: { label: string; to?: string; href?: string }) =>
    link.to ? (
      <Link
        to={link.to}
        className="text-sm text-ink-500 transition-colors duration-200 hover:text-ink-950"
      >
        {link.label}
      </Link>
    ) : (
      <a
        href={link.href}
        className="text-sm text-ink-500 transition-colors duration-200 hover:text-ink-950"
      >
        {link.label}
      </a>
    );

  return (
    <footer className="border-t border-ink-100 bg-canvas">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr_1fr] md:gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-full bg-ink-950 text-canvas">
                <span className="block size-2.5 rounded-full bg-brass-400" />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-ink-950">
                {SITE.name}
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Where art finds its place — a curated marketplace connecting
              independent artists with collectors worldwide.
            </p>
            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-full text-ink-500 transition-all duration-300 hover:bg-ink-100 hover:text-ink-950"
                >
                  <Icon className="size-4.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <nav aria-label="Explore">
            <h3 className="eyebrow mb-4">Explore</h3>
            <ul className="flex flex-col gap-2.5">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.label}>{renderLink(link)}</li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="eyebrow mb-4">Company</h3>
            <ul className="flex flex-col gap-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>{renderLink(link)}</li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="eyebrow mb-4">Studio notes</h3>
            <p className="text-sm leading-relaxed text-ink-500">
              New work, open studios and collection previews — straight to
              your inbox.
            </p>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                navigate("/discover");
              }}
            >
              <input
                type="email"
                required
                placeholder="Email address"
                aria-label="Email address"
                className="h-10 min-w-0 flex-1 rounded-md bg-canvas-raised px-3 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:ring-2 focus:ring-brass-500 focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 shrink-0 cursor-pointer rounded-md bg-ink-950 px-4 text-sm font-semibold text-canvas transition-colors duration-200 hover:bg-ink-800"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-100 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-ink-400">
            © 2026 {SITE.name}. A curated marketplace for original art.
          </p>
          <p className="font-display text-sm italic text-ink-400">
            {SITE.tagline}
          </p>
        </div>
      </Container>
    </footer>
  );
}
