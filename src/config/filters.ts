import type { NavLink, PriceRange, SortOption } from "@/types";

/**
 * Category filter values. Display names differ slightly from the homepage
 * category cards per the Discover spec (Illustration/Sculpture/Portrait
 * singular). Mock artwork categories use the same labels as the homepage
 * grid ("Illustrations", "Sculptures", "Portraits"), so this map bridges
 * the two — the Discover rail shows the spec labels, filtering normalizes.
 */
export const CATEGORY_FILTERS: Array<{ id: string; label: string }> = [
  { id: "Paintings", label: "Paintings" },
  { id: "Digital Art", label: "Digital Art" },
  { id: "Photography", label: "Photography" },
  { id: "Illustrations", label: "Illustration" },
  { id: "Sculptures", label: "Sculpture" },
  { id: "Abstract", label: "Abstract" },
  { id: "Portraits", label: "Portrait" },
  { id: "Traditional Art", label: "Traditional" },
];

export const PRICE_RANGES: PriceRange[] = [
  { id: "under-1000", label: "Under ₹1,000", min: null, max: 1000 },
  { id: "1000-5000", label: "₹1,000 – ₹5,000", min: 1000, max: 5000 },
  { id: "5000-10000", label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
  { id: "above-10000", label: "Above ₹10,000", min: 10000, max: null },
];

export const ARTWORK_TYPES: Array<{ id: string; label: string }> = [
  { id: "original", label: "Original" },
  { id: "print", label: "Print" },
  { id: "digital", label: "Digital" },
];

export const SORT_OPTIONS: Array<{ id: SortOption; label: string }> = [
  { id: "recommended", label: "Recommended" },
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
];

/**
 * Header navigation. Hash sections live on the one-page home, so they are
 * routed as `/#section` — SiteLayout scrolls to the target on arrival and
 * the links keep working from every page.
 */
export const NAV_LINKS: NavLink[] = [
  { label: "Discover", href: "/discover" },
  { label: "Artists", href: "/#artists" },
  { label: "Categories", href: "/#categories" },
  { label: "About", href: "/#how-it-works" },
];
