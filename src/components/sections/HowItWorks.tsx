import { useState } from "react";
import { Search, HandCoins, CreditCard, UserRound, Upload, Store } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type Audience = "buyers" | "artists";

const STEPS: Record<
  Audience,
  Array<{ title: string; description: string; icon: typeof Search }>
> = {
  buyers: [
    {
      title: "Discover",
      description:
        "Browse original work across every medium, curated from artists worldwide.",
      icon: Search,
    },
    {
      title: "Choose",
      description:
        "Save favorites, compare pieces and learn the story behind each artwork.",
      icon: HandCoins,
    },
    {
      title: "Purchase",
      description:
        "Check out securely and have the piece delivered to your door.",
      icon: CreditCard,
    },
  ],
  artists: [
    {
      title: "Create your profile",
      description:
        "Tell your story, set up your studio page and build a following.",
      icon: UserRound,
    },
    {
      title: "Upload your artwork",
      description:
        "List originals with pricing, dimensions and the details collectors care about.",
      icon: Upload,
    },
    {
      title: "Sell your art",
      description:
        "Reach buyers globally — we handle discovery while you stay in the studio.",
      icon: Store,
    },
  ],
};

/**
 * "How it works": three steps each for buyers and artists, switched by a
 * lightweight tab pair. Flows stay visual until the checkout stage.
 */
export function HowItWorks() {
  const [audience, setAudience] = useState<Audience>("buyers");

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 border-t border-ink-100 bg-ink-50/60 py-16 md:py-24"
    >
      <Container>
        <Reveal>
          <div className="mb-10 flex flex-col items-start gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-3">How it works</p>
              <h2 className="display-title max-w-xl text-balance text-3xl sm:text-4xl lg:text-5xl">
                Three steps, two journeys
              </h2>
            </div>

            {/* Audience switch */}
            <div
              role="tablist"
              aria-label="Choose a journey"
              className="flex rounded-full bg-canvas-raised p-1 shadow-card ring-1 ring-ink-100"
            >
              {(
                [
                  ["buyers", "For buyers"],
                  ["artists", "For artists"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={audience === key}
                  onClick={() => setAudience(key)}
                  className={cn(
                    "cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ease-[var(--ease-gallery)]",
                    audience === key
                      ? "bg-ink-950 text-canvas shadow-card"
                      : "text-ink-500 hover:text-ink-900"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          {STEPS[audience].map((step, index) => (
            <Reveal key={`${audience}-${step.title}`} delay={index * 110}>
              <div className="relative flex h-full flex-col gap-4 rounded-xl bg-canvas-raised p-8 shadow-card ring-1 ring-ink-100 animate-scale-in">
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-full bg-ink-950 text-canvas">
                    <step.icon className="size-5" />
                  </span>
                  <span className="font-display text-5xl font-light text-ink-100">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="font-display text-xl font-medium text-ink-950">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-500">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
