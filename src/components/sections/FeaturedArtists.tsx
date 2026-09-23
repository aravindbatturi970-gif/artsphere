import { MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { SAMPLE_ARTISTS } from "@/data/sample-artists";

/**
 * Featured artists. "View Profile" anchors to the artists section for now —
 * real profile pages arrive with the artists stage.
 */
export function FeaturedArtists() {
  return (
    <section id="artists" className="scroll-mt-24 py-16 md:py-24">
      <Container>
        <Reveal>
          <div className="mb-10 md:mb-14">
            <p className="eyebrow mb-3">Featured artists</p>
            <h2 className="display-title max-w-2xl text-balance text-3xl sm:text-4xl lg:text-5xl">
              The hands behind the work
            </h2>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 lg:gap-8">
          {SAMPLE_ARTISTS.map((artist, index) => (
            <Reveal key={artist.id} delay={(index % 4) * 90}>
              <Card className="group flex h-full flex-col items-center gap-4 p-8 text-center transition-all duration-500 ease-[var(--ease-gallery)] hover:-translate-y-1 hover:shadow-card-hover">
                <div
                  className="flex size-20 items-center justify-center rounded-full shadow-card ring-2 ring-canvas transition-transform duration-500 ease-[var(--ease-gallery)] group-hover:scale-105"
                  style={{ backgroundImage: artist.gradient }}
                >
                  <span className="font-display text-xl font-semibold text-ink-950/80">
                    {artist.initials}
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-xl font-medium text-ink-950">
                    {artist.name}
                  </h3>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-ink-400">
                    <MapPin className="size-3.5" />
                    {artist.location}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-ink-500">
                  {artist.tagline}
                </p>

                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
                  {artist.artworkCount} artworks
                </p>

                <ButtonLink
                  to={`/artist/${artist.id}`}
                  variant="secondary"
                  size="sm"
                  className="mt-auto w-full"
                >
                  View Profile
                </ButtonLink>
              </Card>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
