# Wiring up Supabase (Stages 5–6)

The app ships with **real Supabase authentication** (Stage 5) and **real
Supabase database + storage artwork uploads** (Stage 6). Until credentials are
configured it runs in **demo mode** (local mock accounts, uploads kept in the
browser) so the UI is fully reviewable. This guide switches it to the real
thing.

## 1. Create the project

1. Create a free project at [supabase.com](https://supabase.com).
2. Note the project URL and anon key from **Project Settings → API**.
   - The **anon key** is safe for the browser (protected by RLS).
   - The **service_role key** must never appear in frontend code or `.env*`.

## 2. Configure environment

```bash
cd artsphere
cp .env.example .env.local
```

Fill in:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart the dev server after changing `.env.local`.

## 3. Create the schema

Open the Supabase dashboard → **SQL Editor** and run the contents of
[`supabase/schema.sql`](./supabase/schema.sql). It creates:

- `profiles` table (user id, full name, email, role, avatar, bio, created date)
- a trigger that creates a profile row automatically at sign-up
- `categories`, `artist_profiles` and `artworks` tables
- Row Level Security everywhere — **an artist can only modify their own
  artwork rows** (`artworks_insert_own` / `update_own` / `delete_own`), and
  only `published` rows are publicly readable
- the `artwork-images` storage bucket with public read and
  owner-scoped writes (files live under `<user-id>/…` folders)
- a `current_role()` helper for policies

## 4. Verify uploads (Stage 6)

- Sign in as an artist → **Dashboard → Add Artwork**: the image uploads to
  the `artwork-images` bucket and the row appears in `public.artworks`.
- Publishing a listing makes it appear on the public **Discover** page and
  on the artist's public profile (`/artist/user-<id>`).
- Editing/deleting other artists' rows is impossible — RLS rejects it even
  if the client is tampered with.

## 4. Promote an admin

Admins are created manually (no self-service admin sign-up):

```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## 5. Verify

- Sign up a buyer and an artist — each lands on its own dashboard.
- "Remember me" keeps you signed in across browser restarts; without it the
  session dies with the tab.
- Forgot Password sends a real Supabase reset email (check Spam).

## Notes

- Passwords are handled entirely by Supabase Auth — never stored or logged
  by this app.
- `Redirect URLs` under Authentication → URL Configuration should include
  `http://localhost:5180/reset-password` for local reset links.
- Demo mode never activates once both env vars are present.
