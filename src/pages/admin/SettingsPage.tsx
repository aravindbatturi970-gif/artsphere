import { ShieldCheck, Database, Percent } from "lucide-react";
import { AdminHeading, AdminCard } from "@/components/admin/AdminLayout";
import { useAuth } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

/**
 * Admin Settings: the platform-level knobs. Security posture is shown
 * read-only so the guarantees stay auditable; editable settings arrive
 * with payments (platform fee) and email (notifications).
 */
export function AdminSettingsPage() {
  const { demoMode, user } = useAuth();

  const posture = [
    {
      icon: ShieldCheck,
      title: "Role-based access",
      detail:
        "The /admin route tree is guarded client-side AND server-side: every admin query runs under RLS policies that check public.current_role() = 'admin'. A non-admin calling the API directly gets empty results or denials — not an error page they can bypass.",
    },
    {
      icon: Database,
      title: "Database enforcement",
      detail:
        "Category writes, report resolution, moderation updates and profile disables are all rejected by RLS unless the caller's profile row has role = 'admin'. The disabled-account trigger refuses sign-ins at the auth layer.",
    },
    {
      icon: Percent,
      title: "Platform fee",
      detail:
        "Fee preview is fixed at 10% until the payments stage connects a provider; it becomes configurable here once payouts exist.",
    },
  ];

  return (
    <div>
      <AdminHeading
        title="Settings"
        blurb="Platform configuration and security posture."
      />

      <div className="flex flex-col gap-4">
        {posture.map(({ icon: Icon, title, detail }) => (
          <AdminCard key={title}>
            <span className="flex size-10 items-center justify-center rounded-full bg-canvas/10 text-canvas">
              <Icon className="size-5" />
            </span>
            <p className="mt-3 font-display text-lg font-medium text-canvas">
              {title}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-canvas/50">
              {detail}
            </p>
          </AdminCard>
        ))}

        <AdminCard>
          <p className="text-sm font-semibold text-canvas">Environment</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-canvas/40">
                Data backend
              </dt>
              <dd className="mt-0.5 text-canvas/80">
                {isSupabaseConfigured ? "Supabase (live)" : "Demo (local store)"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.12em] text-canvas/40">
                Signed in as
              </dt>
              <dd className="mt-0.5 truncate text-canvas/80">{user?.email}</dd>
            </div>
          </dl>
          {demoMode && (
            <p className="mt-4 rounded-lg bg-brass-500/10 px-4 py-3 text-xs leading-relaxed text-brass-200 ring-1 ring-brass-500/30">
              Demo mode: moderation, reports and account-status changes are
              stored locally. Add Supabase credentials to enforce the same
              actions server-side with RLS.
            </p>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
