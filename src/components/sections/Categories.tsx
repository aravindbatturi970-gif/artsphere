import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { CATEGORIES } from "@/data/categories";

/**
 * Explore categories: eight visual tiles. Real category/filter pages arrive
 * with the browsing stage; for now each tile anchors to the artwork section.
 */
export function Categories() {
  return (
    <section
      id="categories"
      className="scroll-mt-24 border-t border-ink-100 bg-ink-50/60 py-16 md:py-24"
    >
      <Container>
        <Reveal>
          <div className="mb-10 md:mb-14">
            <p className="eyebrow mb-3">Explore categories</p>
            <h2 className="display-title max-w-2xl text-balance text-3xl sm:text-4xl lg:text-5xl">
              Every medium has a home
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {CATEGORIES.map((category, index) => (
            <Reveal key={category.slug} delay={(index % 4) * 70}>
              <Link
                to={`/discover?cat=${encodeURIComponent(category.name)}`}
                className="group relative flex h-full min-h-44 flex-col justify-between overflow-hidden rounded-xl p-6 shadow-card ring-1 ring-ink-100 transition-all duration-500 ease-[var(--ease-gallery)] hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-gallery)] group-hover:scale-105"
                  style={{ backgroundImage: category.gradient }}
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 opacity-55"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 25% 15%, rgba(255,255,255,0.4), transparent 55%), radial-gradient(circle at 80% 90%, rgba(0,0,0,0.28), transparent 60%)",
                    mixBlendMode: "soft-light",
                  }}
                />

                <span className="relative z-10 flex items-start justify-between">
                  <h3 className="max-w-[10ch] text-balance font-display text-xl font-medium text-ink-950 drop-shadow-sm">
                    {category.name}
                  </h3>
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-canvas-raised/85 text-ink-900 opacity-0 shadow-card backdrop-blur transition-opacity duration-500 group-hover:opacity-100">
                    <ArrowUpRight className="size-4" />
                  </span>
                </span>

                <span className="relative z-10 mt-8 block">
                  <span className="block text-sm font-medium text-ink-900/90">
                    {category.count} works
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-900/60">
                    {category.description}
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
