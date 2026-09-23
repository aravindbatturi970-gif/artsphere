import { Container } from "@/components/ui/Container";
import { ArtworkCard } from "@/components/art/ArtworkCard";
import { QuickViewModal } from "@/components/art/QuickViewModal";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Reveal } from "@/components/ui/Reveal";
import { SAMPLE_ARTWORKS } from "@/data/sample-artworks";
import { useState } from "react";
import type { Artwork } from "@/types";

/**
 * Featured artwork: the flagship grid of sample pieces, each with a like
 * button and a detail modal behind the placeholder route.
 */
export function FeaturedWorks() {
  const [selected, setSelected] = useState<Artwork | null>(null);

  return (
    <section id="artwork" className="scroll-mt-24 py-16 md:py-24">
      <Container>
        <Reveal>
          <div className="mb-10 flex flex-col gap-2 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-3">Featured artwork</p>
              <h2 className="display-title text-3xl sm:text-4xl lg:text-5xl">
                New & noteworthy
              </h2>
            </div>
            <ButtonLink to="/discover" variant="secondary">
              Browse all artwork
            </ButtonLink>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {SAMPLE_ARTWORKS.map((artwork, index) => (
            <Reveal key={artwork.id} delay={(index % 4) * 90}>
              <ArtworkCard artwork={artwork} onQuickView={setSelected} />
            </Reveal>
          ))}
        </div>
      </Container>

      <QuickViewModal artwork={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
