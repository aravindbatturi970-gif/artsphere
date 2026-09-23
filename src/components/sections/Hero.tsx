import { ArrowRight, Palette } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ArtPlaceholder } from "@/components/art/ArtPlaceholder";
import { Badge } from "@/components/ui/Badge";
import { SAMPLE_ARTWORKS } from "@/data/sample-artworks";

/**
 * Homepage hero: "Discover Art That Speaks to You" beside a floating
 * collage of gradient artwork previews.
 */
export function Hero() {
  const [first, second, third] = SAMPLE_ARTWORKS;

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-28 pb-16 md:pt-40 md:pb-24"
    >
      {/* Soft brass glow behind the composition */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] size-[34rem] rounded-full bg-brass-100 blur-3xl"
      />

      <Container>
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="animate-fade-up">
            <Badge tone="brass" className="mb-6">
              <span className="size-1.5 rounded-full bg-brass-500" />
              Original art from independent artists
            </Badge>

            <h1 className="display-title text-balance text-5xl sm:text-6xl lg:text-7xl">
              Discover Art That Speaks to You
            </h1>

            <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-ink-600">
              Explore original artwork from independent artists around the
              world.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink to="/discover" size="lg">
                Explore Artwork
                <ArrowRight className="size-4.5" />
              </ButtonLink>
              <ButtonLink to="/#artists" variant="secondary" size="lg">
                <Palette className="size-4.5" />
                Become an Artist
              </ButtonLink>
            </div>
          </div>

          {/* Floating artwork collage */}
          <div className="relative mx-auto w-full max-w-md animate-fade-in lg:max-w-none">
            <div className="grid grid-cols-5 grid-rows-6 gap-4">
              <div className="col-span-3 row-span-6 overflow-hidden rounded-xl shadow-card-hover ring-1 ring-ink-100 animate-float">
                <ArtPlaceholder artwork={first} />
              </div>
              <div className="col-span-2 row-span-3 overflow-hidden rounded-lg shadow-card ring-1 ring-ink-100 animate-float [animation-delay:1.2s]">
                <ArtPlaceholder artwork={second} />
              </div>
              <div className="col-span-2 row-span-3 overflow-hidden rounded-lg shadow-card ring-1 ring-ink-100 animate-float [animation-delay:2.4s]">
                <ArtPlaceholder artwork={third} />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
