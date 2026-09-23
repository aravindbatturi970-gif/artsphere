import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, UserRoundPlus, Check, Compass, Flag } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ArtworkCard } from "@/components/art/ArtworkCard";
import { QuickViewModal } from "@/components/art/QuickViewModal";
import { MoreArtistsRow } from "@/components/art/ArtistCard";
import { ReportDialog } from "@/components/moderation/ReportDialog";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { artworksByArtist, getArtist } from "@/lib/catalog";
import {
  getUserArtistProfile,
  type UserArtistProfile,
} from "@/lib/public-uploads";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useArtistCatalogWorks } from "@/hooks/usePublicCatalog";
import { useShop } from "@/lib/shop";
import { cn, formatPrice } from "@/lib/utils";
import type { Artwork } from "@/types";
import { NotFoundPage } from "@/pages/NotFoundPage";

const FOLLOW_KEY = "artsphere:following";

function readFollowing(): string[] {
  try {
    const raw = window.localStorage.getItem(FOLLOW_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

type Tab = "artwork" | "about";

/**
 * Unified artist view for the profile page — either a seeded sample
 * artist or a real registered user (route `user-<id>`).
 */
interface ArtistView {
  key: string;
  name: string;
  tagline: string;
  bio: string;
  location: string;
  joinedLabel: string;
  followers: number;
  gradient: string;
  initials: string;
  practice: string | null;
}

function yearLabel(iso: string): string {
  return String(new Date(iso).getFullYear());
}

/**
 * Artist profile: studio hero with follow, Artwork/About tabs, and a
 * "More artists" discovery row. Commerce actions arrive later.
 */
export function ArtistProfilePage() {
  const { id } = useParams<{ id: string }>();
  const sampleArtist = id ? getArtist(id) : undefined;
  const [userArtist, setUserArtist] = useState<UserArtistProfile | null>(null);
  const [userArtistLoaded, setUserArtistLoaded] = useState(false);
  const [quickView, setQuickView] = useState<Artwork | null>(null);
  const [tab, setTab] = useState<Tab>("artwork");
  const [following, setFollowing] = useState<string[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const { notify } = useShop();
  usePageTitle(
    sampleArtist
      ? `${sampleArtist.name} — Artist`
      : userArtist
        ? `${userArtist.name} — Artist`
        : "Artist"
  );

  const isUserArtist = Boolean(id?.startsWith("user-"));
  const artistKey = id?.startsWith("user-") ? id.slice(5) : id;
  const userWorks = useArtistCatalogWorks(
    isUserArtist && id ? id : undefined
  );

  useEffect(() => {
    setFollowing(readFollowing());
  }, []);

  useEffect(() => {
    if (!artistKey || !isUserArtist) {
      setUserArtist(null);
      setUserArtistLoaded(!isUserArtist);
      return;
    }
    let cancelled = false;
    getUserArtistProfile(artistKey).then((profile) => {
      if (!cancelled) {
        setUserArtist(profile);
        setUserArtistLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [artistKey, isUserArtist]);

  const works = useMemo(
    () =>
      isUserArtist
        ? userWorks
        : sampleArtist
          ? artworksByArtist(sampleArtist.id)
          : [],
    [isUserArtist, userWorks, sampleArtist]
  );

  if (!isUserArtist && !sampleArtist) {
    return <NotFoundPage message="That artist could not be found." />;
  }
  if (isUserArtist && userArtistLoaded && !userArtist) {
    return <NotFoundPage message="That artist could not be found." />;
  }
  if (!userArtistLoaded) {
    return (
      <div className="pt-40 pb-40 text-center text-sm text-ink-400">
        Loading studio…
      </div>
    );
  }

  const artist: ArtistView = isUserArtist && userArtist
    ? {
        key: id ?? "user",
        name: userArtist.name,
        tagline: userArtist.bio?.trim()
          ? userArtist.bio
          : "Independent artist on ArtSphere",
        bio: userArtist.bio?.trim()
          ? userArtist.bio
          : "This artist hasn't written their story yet — their work speaks for itself.",
        location: "Worldwide",
        joinedLabel: yearLabel(userArtist.joined),
        followers: 0,
        gradient:
          "linear-gradient(135deg, #292524 0%, #78716c 55%, #d6c7b2 100%)",
        initials: userArtist.name
          .split(" ")
          .map((p) => p[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        practice: null,
      }
    : {
        key: sampleArtist?.id ?? "",
        name: sampleArtist?.name ?? "Artist",
        tagline: sampleArtist?.tagline ?? "",
        bio: sampleArtist?.bio ?? "",
        location: sampleArtist?.location ?? "",
        joinedLabel: String(sampleArtist?.joined ?? ""),
        followers: sampleArtist?.followers ?? 0,
        gradient: sampleArtist?.gradient ?? "",
        initials: sampleArtist?.initials ?? "",
        practice: sampleArtist?.practice ?? null,
      };

  const isFollowing = following.includes(artist.key);

  const toggleFollow = () => {
    const next = isFollowing
      ? following.filter((f) => f !== artist.key)
      : [...following, artist.key];
    setFollowing(next);
    try {
      window.localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable — in-memory only.
    }
    notify(
      isFollowing
        ? `Unfollowed ${artist.name}`
        : `Following ${artist.name} — new work will surface in your feed`
    );
  };

  const totalValue = works.reduce((sum, w) => sum + w.price, 0);

  return (
    <div className="pt-24 pb-20 md:pt-28 md:pb-28">
      <Container>
        {/* Studio hero */}
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-ink-950 px-6 py-12 shadow-modal sm:px-10 md:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 size-96 rounded-full bg-brass-500/15 blur-3xl"
            />
            <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center">
              <div
                className="flex size-24 shrink-0 items-center justify-center rounded-full shadow-modal ring-2 ring-canvas/20"
                style={{ backgroundImage: artist.gradient }}
              >
                <span className="font-display text-2xl font-semibold text-ink-950/80">
                  {artist.initials}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-display text-3xl font-medium tracking-tight text-canvas sm:text-4xl">
                  {artist.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-canvas/60">
                  <MapPin className="size-4" />
                  {artist.location} · Joined {artist.joinedLabel}
                </p>
                <p className="mt-3 max-w-xl text-balance text-canvas/80">
                  {artist.tagline}
                </p>
              </div>

              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="font-display text-2xl font-medium text-canvas">
                      {works.length}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em] text-canvas/50">
                      Artworks
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-2xl font-medium text-canvas">
                      {(artist.followers + (isFollowing ? 1 : 0)).toLocaleString()}
                    </p>
                    <p className="text-xs uppercase tracking-[0.14em] text-canvas/50">
                      Followers
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isFollowing ? "secondary" : "brass"}
                    onClick={toggleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="size-4.5" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserRoundPlus className="size-4.5" />
                        Follow
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setReportOpen(true)}
                    aria-label={`Report ${artist.name}`}
                  >
                    <Flag className="size-4.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Tabs */}
        <Reveal>
          <div className="mt-10 flex gap-1 border-b border-ink-100">
            {(
              [
                ["artwork", `Artwork (${works.length})`],
                ["about", "About"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={cn(
                  "-mb-px cursor-pointer border-b-2 px-4 py-3 text-sm font-semibold transition-colors duration-200",
                  tab === key
                    ? "border-brass-500 text-ink-950"
                    : "border-transparent text-ink-500 hover:text-ink-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Tab panels */}
        {tab === "artwork" ? (
          <div className="mt-10">
            {works.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {works.map((work, index) => (
                  <Reveal key={work.id} delay={(index % 3) * 80}>
                    <ArtworkCard artwork={work} onQuickView={setQuickView} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="rounded-xl bg-canvas-raised p-12 text-center text-sm text-ink-500 shadow-card ring-1 ring-ink-100">
                No works listed yet — check back soon.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <Reveal>
              <div className="rounded-2xl bg-canvas-raised p-8 shadow-card ring-1 ring-ink-100 sm:p-10">
                <h2 className="font-display text-2xl font-medium text-ink-950">
                  About {artist.name}
                </h2>
                <p className="mt-5 text-balance text-[15px] leading-relaxed text-ink-600">
                  {artist.bio}
                </p>
                <h3 className="mt-8 flex items-center gap-2 font-display text-lg font-medium text-ink-950">
                  <Compass className="size-4.5 text-brass-600" />
                  Practice
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {artist.practice ??
                    "A studio practice rooted in daily making — new works are added as they leave the easel."}
                </p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="flex flex-col gap-4">
                <div className="rounded-xl bg-ink-50/80 p-7 ring-1 ring-ink-100">
                  <p className="eyebrow mb-4">At a glance</p>
                  <dl className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Location</dt>
                      <dd className="font-medium text-ink-900">{artist.location}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Joined</dt>
                      <dd className="font-medium text-ink-900">{artist.joinedLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Works listed</dt>
                      <dd className="font-medium text-ink-900">{works.length}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-400">Collection value</dt>
                      <dd className="font-medium text-ink-900">
                        {formatPrice(totalValue)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </Reveal>
          </div>
        )}

        {/* More Artists You May Like */}
        <section className="mt-24">
          <Reveal>
            <div className="mb-8">
              <p className="eyebrow mb-3">Keep exploring</p>
              <h2 className="display-title text-2xl sm:text-3xl">
                More Artists You May Like
              </h2>
            </div>
          </Reveal>
          <MoreArtistsRow excludeArtistId={artist.key} />
        </section>
      </Container>

      <QuickViewModal artwork={quickView} onClose={() => setQuickView(null)} />
      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="artist"
        targetId={artist.key}
        targetLabel={artist.name}
      />
    </div>
  );
}
