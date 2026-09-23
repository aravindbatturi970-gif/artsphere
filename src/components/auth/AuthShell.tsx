import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Link } from "react-router-dom";
import { SITE } from "@/config/site";
import { useAuth } from "@/lib/auth";

/**
 * Split-panel layout for the auth pages: form on the left, gallery-wall
 * panel with the brand story on the right.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const { demoMode } = useAuth();

  return (
    <div className="pt-24 pb-20 md:pt-32">
      <Container>
        <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl shadow-modal ring-1 ring-ink-100 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Form side */}
          <div className="bg-canvas-raised p-8 sm:p-12">
            <h1 className="display-title text-3xl sm:text-4xl">{title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              {subtitle}
            </p>
            <div className="mt-8">{children}</div>
            {footer && (
              <div className="mt-8 border-t border-ink-100 pt-6 text-sm text-ink-500">
                {footer}
              </div>
            )}
          </div>

          {/* Brand side */}
          <div className="relative hidden overflow-hidden bg-ink-950 p-12 lg:block">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brass-500/15 blur-3xl"
            />
            <div className="relative z-10 flex h-full flex-col">
              <Link to="/" className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-canvas">
                  <span className="block size-2.5 rounded-full bg-brass-400" />
                </span>
                <span className="font-display text-xl font-semibold tracking-tight text-canvas">
                  {SITE.name}
                </span>
              </Link>

              <div className="mt-auto">
                <p className="font-display text-3xl font-medium leading-tight text-canvas">
                  Where art finds
                  <br />
                  its place.
                </p>
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-canvas/60">
                  Join a curated community of independent artists and the
                  collectors who love their work.
                </p>

                {demoMode && (
                  <p className="mt-8 inline-flex items-center gap-2 rounded-full bg-canvas/10 px-4 py-2 text-xs font-medium text-canvas/80 ring-1 ring-canvas/20">
                    <span className="size-1.5 rounded-full bg-brass-400" />
                    Demo mode — add Supabase keys to .env.local for real auth
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
