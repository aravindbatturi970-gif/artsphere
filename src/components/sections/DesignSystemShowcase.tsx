import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  Search,
  Heart,
  ShoppingBag,
  Bell,
  Star,
} from "lucide-react";

const SWATCHES = [
  { name: "ink-950", className: "bg-ink-950" },
  { name: "ink-800", className: "bg-ink-800" },
  { name: "ink-600", className: "bg-ink-600" },
  { name: "ink-400", className: "bg-ink-400" },
  { name: "ink-200", className: "bg-ink-200" },
  { name: "brass-600", className: "bg-brass-600" },
  { name: "brass-400", className: "bg-brass-400" },
  { name: "brass-200", className: "bg-brass-200" },
  { name: "canvas", className: "bg-canvas-raised ring-1 ring-ink-200" },
] as const;

/**
 * Living reference of the Stage 1 design system: buttons, inputs, badges,
 * cards, modal and color ramp. Doubles as documentation for later stages —
 * when the system evolves, this page evolves with it.
 */
export function DesignSystemShowcase() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      id="categories"
      className="scroll-mt-24 border-t border-ink-100 bg-ink-50/60 py-16 md:py-24"
    >
      <Container>
        <div className="mb-10 md:mb-14">
          <p className="eyebrow mb-3">Design system</p>
          <h2 className="display-title text-3xl sm:text-4xl lg:text-5xl">
            One visual language
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-500">
            Colors, type, buttons, inputs, badges, cards and modals — shared by
            every future page of the marketplace.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Palette */}
          <Card className="p-7">
            <h3 className="font-display text-lg font-medium text-ink-950">
              Palette
            </h3>
            <div className="mt-5 grid grid-cols-5 gap-3 sm:grid-cols-9">
              {SWATCHES.map((swatch) => (
                <div
                  key={swatch.name}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={`h-9 w-full rounded-md ${swatch.className}`}
                  />
                  <span className="text-[10px] text-ink-400">
                    {swatch.name}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink-400">
              Warm gallery neutrals with a single brass accent used sparingly.
            </p>
          </Card>

          {/* Buttons */}
          <Card className="p-7">
            <h3 className="font-display text-lg font-medium text-ink-950">
              Buttons
            </h3>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
              <Button disabled>Disabled</Button>
            </div>
            <p className="mt-4 text-xs text-ink-400">
              Three variants and three sizes cover every future surface.
            </p>
          </Card>

          {/* Inputs */}
          <Card className="p-7">
            <h3 className="font-display text-lg font-medium text-ink-950">
              Inputs
            </h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Search" placeholder="Try “still life”…" />
              <Input label="Email" placeholder="you@example.com" type="email" />
              <Input label="Disabled" placeholder="Not editable" disabled />
              <Input
                label="With hint"
                placeholder="A dense, textured canvas"
                hint="Shown below the field"
              />
            </div>
            <p className="mt-4 text-xs text-ink-400">
              Inputs power auth, upload and admin forms in later stages.
            </p>
          </Card>

          {/* Badges, icons + modal */}
          <Card className="p-7">
            <h3 className="font-display text-lg font-medium text-ink-950">
              Badges, icons & modal
            </h3>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="brass">Brass</Badge>
              <Badge tone="success">Success</Badge>
              <Badge tone="dark">Dark</Badge>
            </div>
            <div className="mt-6 flex items-center gap-5 text-ink-700">
              <Search className="size-5" />
              <Heart className="size-5" />
              <ShoppingBag className="size-5" />
              <Bell className="size-5" />
              <Star className="size-5" />
            </div>
            <div className="mt-6">
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(true)}>
                Open modal
              </Button>
            </div>
          </Card>
        </div>
      </Container>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Modal dialog"
      >
        <p className="text-sm leading-relaxed text-ink-600">
          Portalled dialog with overlay, escape-to-close and scroll locking.
          Artwork previews, authentication and admin confirmations will reuse
          this primitive.
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setModalOpen(false)}>Got it</Button>
        </div>
      </Modal>
    </section>
  );
}
