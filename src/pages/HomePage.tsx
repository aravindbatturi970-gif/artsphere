import { Hero } from "@/components/sections/Hero";
import { FeaturedWorks } from "@/components/sections/FeaturedWorks";
import { Categories } from "@/components/sections/Categories";
import { FeaturedArtists } from "@/components/sections/FeaturedArtists";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { CallToAction } from "@/components/sections/CallToAction";

/**
 * Landing experience: hero, featured artwork, categories, artists, how it
 * works and closing CTA. Section components stay route-agnostic.
 */
export function HomePage() {
  return (
    <main>
      <Hero />
      <FeaturedWorks />
      <Categories />
      <FeaturedArtists />
      <HowItWorks />
      <CallToAction />
    </main>
  );
}
