# ArtSphere — Where Art Finds Its Place

A premium online marketplace where artists sell original artwork and art lovers discover pieces that speak to them.

Built with **React 19 + TypeScript + Vite + Tailwind CSS v4**, with **Supabase** (auth, database, storage) behind a clean data-layer seam. Without Supabase credentials the app runs in a fully functional **demo mode** backed by local mock data.

## Features

- **Marketplace** — Discover page with search, category/price/type filters, sorting, and Quick View
- **Artwork detail** — breadcrumbs, artist info, related works, wishlist/cart/share actions
- **Artist profiles** — bio, stats, follow, and a full artwork grid
- **Cart & wishlist** — persisted per user, availability-guarded
- **Checkout & orders** — per-artist order grouping, order numbers, status timeline; payment provider seam (`payments.ts`) with no fake payment success
- **Artist dashboard** — stats overview, artwork CRUD with Supabase Storage uploads, orders, earnings
- **Admin dashboard** — users, artists, artwork moderation, orders, categories, reports (role-enforced, RLS-protected)
- **Responsive** — desktop, tablet, and mobile layouts throughout

## Getting started

```bash
npm install
npm run dev          # http://localhost:5180
```

Optional — enable real Supabase auth/database:

```bash
copy .env.example .env.local   # (Windows)  /  cp .env.example .env.local
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then run the SQL in
# supabase/schema.sql in your Supabase project (see SUPABASE_SETUP.md)
```

The anon key is safe for the browser — all data access is protected by Row Level Security policies in `supabase/schema.sql`. Never put the `service_role` key in frontend code.

## Deploying to GitHub Pages

This repo deploys automatically via **GitHub Actions** (`.github/workflows/deploy.yml`). One-time setup:

1. **Create the GitHub repo** (e.g. `ArtSphereA-ZMarket`) and push:

   ```bash
   git init
   git add -A
   git commit -m "ArtSphere marketplace"
   git branch -M main
   git remote add origin https://github.com/<your-username>/ArtSphereA-ZMarket.git
   git push -u origin main
   ```

   If your repo has a different name, update `GH_PAGES_BASE` in `vite.config.ts` to `/<repo-name>/`.

2. **Enable Pages from Actions:** repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

3. Push to `main` (or run the workflow manually from the **Actions** tab). The site goes live at:

   `https://<your-username>.github.io/ArtSphereA-ZMarket/`

### How Pages support works

- `vite.config.ts` — `base` switches to `/ArtSphereA-ZMarket/` only when `GITHUB_PAGES=1`; local dev stays at `/`
- `main.tsx` — `BrowserRouter basename={import.meta.env.BASE_URL}` follows the same base
- `scripts/build-pages.mjs` — `npm run build:pages` builds with the Pages base, copies `index.html` → `404.html` (so SPA deep links like `/artwork/:id` survive hard refresh) and writes `.nojekyll`
- Local test of the Pages bundle: `npm run build:pages && npm run preview`

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 5180 |
| `npm run build` | Typecheck + production build (root base) |
| `npm run build:pages` | Typecheck + Pages build with 404 fallback |
| `npm run preview` | Serve a production build locally |

## Project structure

```
src/
  components/     UI primitives, layout, art cards, admin shell, dialogs
  pages/          Route components (public, artist/, admin/)
  lib/            Data layers (auth, shop, orders, admin, reports) + Supabase seam
  data/           Sample/mock data used in demo mode
  config/         Site metadata, filter definitions
  hooks/          Shared hooks (public catalog, page titles)
  types/          Shared domain types
supabase/         schema.sql — tables, indexes, RLS policies, triggers
```

## Security notes

- All Supabase access is governed by RLS: users own their rows, artists only manage their own artwork, buyers read only their own orders, admin checks happen in policies — never just in the UI
- Payment fields are excluded from client-writable paths (trigger-enforced); connect a real provider through `src/lib/payments.ts`
- No secrets in frontend code; `.env.local` is git-ignored
