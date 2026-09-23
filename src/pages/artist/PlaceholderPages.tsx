import {
  UserRound,
  Settings as SettingsIcon,
  Info,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import {
  ArtistPageHeading,
} from "@/components/dashboard/ArtistDashboardLayout";
import { useAuth } from "@/lib/auth";

/** Shared placeholder panel look for not-yet-functional dashboard pages. */
function PlaceholderPanel({
  icon: Icon,
  title,
  description,
  note,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
  note: string;
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-xl bg-canvas-raised p-10 shadow-card ring-1 ring-ink-100 sm:p-12">
      <span className="flex size-12 items-center justify-center rounded-full bg-ink-950 text-canvas">
        <Icon className="size-5.5" />
      </span>
      <div>
        <p className="font-display text-2xl font-medium text-ink-950">{title}</p>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      </div>
      <p className="mt-2 flex items-start gap-2 rounded-lg bg-ink-50/80 px-4 py-3 text-sm text-ink-500 ring-1 ring-ink-100">
        <Info className="mt-0.5 size-4 shrink-0 text-brass-600" />
        {note}
      </p>
    </div>
  );
}

/** Profile — full editing arrives with a later stage. */
export function ArtistProfileSettingsPage() {
  const { user } = useAuth();
  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <ArtistPageHeading
          title="Profile"
          blurb="How buyers see you on ArtSphere."
        />
        <Reveal>
          <PlaceholderPanel
            icon={UserRound}
            title={user?.fullName ?? "Your profile"}
            description="Your public studio identity: avatar, bio, location and studio statement."
            note={`Profile editing is coming in a later stage. You're signed in as ${user?.email ?? "…"}.`}
          />
        </Reveal>
      </Container>
    </div>
  );
}

/** Settings — arrives with a later stage. */
export function ArtistSettingsPage() {
  return (
    <div className="pt-24 pb-20 md:pt-28">
      <Container>
        <ArtistPageHeading title="Settings" />
        <Reveal>
          <PlaceholderPanel
            icon={SettingsIcon}
            title="Studio settings"
            description="Payout methods, shipping defaults, notification preferences and account controls."
            note="Settings become editable in a later stage — the section is scaffolded now."
          />
        </Reveal>
      </Container>
    </div>
  );
}
