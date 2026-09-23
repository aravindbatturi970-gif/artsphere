import { useEffect } from "react";
import { SITE } from "@/config/site";

/**
 * Sets the browser-tab title for the current page. Every route sets its own
 * on mount, so no restore-on-unmount bookkeeping is needed. Pass `undefined`
 * (or nothing) to fall back to the site default.
 */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title
      ? `${title} · ${SITE.name}`
      : `${SITE.name} — ${SITE.tagline}`;
  }, [title]);
}

/**
 * Null-rendering convenience for route definitions — lets App.tsx keep the
 * title colocated with each route: `<><PageTitle title="Cart" /><CartPage /></>`.
 */
export function PageTitle({ title }: { title?: string }) {
  usePageTitle(title);
  return null;
}
