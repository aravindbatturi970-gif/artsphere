import { Check, CircleDot } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { RoadmapPhase } from "@/types";

const PHASES: RoadmapPhase[] = [
  {
    phase: "01",
    title: "Foundation & design system",
    status: "done",
    points: [
      "Component library & design tokens",
      "Responsive layout shell",
      "Landing experience",
    ],
  },
  {
    phase: "02",
    title: "Marketplace browsing",
    status: "active",
    points: [
      "Discover page with search & filters",
      "Artwork detail pages",
      "Artist profiles",
    ],
  },
  {
    phase: "03",
    title: "Accounts & selling",
    status: "planned",
    points: [
      "Authentication & artist onboarding",
      "Artwork upload flow",
      "Wishlists & shopping cart",
    ],
  },
  {
    phase: "04",
    title: "Checkout & platform ops",
    status: "planned",
    points: [
      "Order management & payments",
      "Admin dashboard",
      "Notifications",
    ],
  },
];

const STATUS_STYLES: Record<RoadmapPhase["status"], { tone: "success" | "brass" | "neutral"; label: string }> = {
  done: { tone: "success", label: "Stage 1 · Done" },
  active: { tone: "brass", label: "Next" },
  planned: { tone: "neutral", label: "Planned" },
};

/** Communicates the staged build plan so early users know what's coming. */
export function Roadmap() {
  return (
    <section id="about" className="scroll-mt-24 py-16 md:py-24">
      <Container>
        <div className="mb-10 md:mb-14">
          <p className="eyebrow mb-3">About the build</p>
          <h2 className="display-title max-w-2xl text-balance text-3xl sm:text-4xl lg:text-5xl">
            A marketplace, built in the open
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PHASES.map((phase) => {
            const style = STATUS_STYLES[phase.status];
            return (
              <Card key={phase.phase} className="flex flex-col gap-5 p-7">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-light text-ink-200">
                    {phase.phase}
</span>
                  <Badge tone={style.tone}>{style.label}</Badge>
                </div>

                <h3 className="font-display text-xl font-medium text-ink-950">
                  {phase.title}
                </h3>

                <ul className="flex flex-col gap-2.5 text-sm text-ink-600">
                  {phase.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5">
                      {phase.status === "done" ? (
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      ) : (
                        <CircleDot className="mt-0.5 size-4 shrink-0 text-ink-300" />
                      )}
                      {point}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
