import { ArrowRight, Palette } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Closing CTA band: dark gallery wall with the two community paths.
 */
export function CallToAction() {
  return (
    <section id="join" className="scroll-mt-24 py-16 md:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-ink-950 px-6 py-16 text-center shadow-modal sm:px-12 md:py-24">
            {/* Ambient brass glows */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-brass-500/20 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-32 -right-16 size-80 rounded-full bg-brass-700/25 blur-3xl"
            />

            <div className="relative z-10 mx-auto max-w-2xl">
              <p className="eyebrow mb-4 text-brass-300/80">
                Join the community
              </p>
              <h2 className="display-title text-balance text-4xl text-canvas! sm:text-5xl">
                Your Art Deserves to Be Seen
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-relaxed text-canvas/70">
                Join a growing community of artists and art lovers.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <ButtonLink to="/#artists" variant="brass" size="lg">
                  <Palette className="size-4.5" />
                  Start Selling
                </ButtonLink>
                <ButtonLink
                  to="/discover"
                  size="lg"
                  className="bg-canvas-raised/10 text-canvas ring-1 ring-canvas/25 hover:bg-canvas-raised/20 hover:shadow-none"
                >
                  Explore Art
                  <ArrowRight className="size-4.5" />
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
