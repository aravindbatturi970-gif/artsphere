import { useMemo, useState } from "react";
import { SlidersHorizontal, Search, X, ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { ArtworkCard } from "@/components/art/ArtworkCard";
import { QuickViewModal } from "@/components/art/QuickViewModal";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import {
  FilterPanel,
  EMPTY_FILTERS,
  type FilterState,
} from "@/components/discover/FilterPanel";
import { PRICE_RANGES, SORT_OPTIONS } from "@/config/filters";
import { usePublicCatalog } from "@/hooks/usePublicCatalog";
import type { Artwork, ArtworkType, SortOption } from "@/types";

/** Parse/serialize filter state into URL search params (shareable links). */
function filtersToParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.categories.length) params.set("cat", state.categories.join(","));
  if (state.priceRanges.length) params.set("price", state.priceRanges.join(","));
  if (state.types.length) params.set("type", state.types.join(","));
  if (state.sort !== EMPTY_FILTERS.sort) params.set("sort", state.sort);
  return params;
}

function paramsToFilters(params: URLSearchParams): FilterState {
  const state: FilterState = { ...EMPTY_FILTERS };
  const q = params.get("q");
  if (q) state.query = q;
  const cat = params.get("cat");
  if (cat) state.categories = cat.split(",").filter(Boolean);
  const price = params.get("price");
  if (price) state.priceRanges = price.split(",").filter(Boolean);
  const type = params.get("type");
  if (type) {
    state.types = type
      .split(",")
      .filter((t): t is ArtworkType =>
        ["original", "print", "digital"].includes(t)
      );
  }
  const sort = params.get("sort");
  if (sort && SORT_OPTIONS.some((o) => o.id === sort)) {
    state.sort = sort as SortOption;
  }
  return state;
}

/** Apply the filter state to a catalogue (memoized by the caller). */
function applyFilters(state: FilterState, artworks: Artwork[]): Artwork[] {
  const q = state.query.trim().toLowerCase();

  const filtered = artworks.filter((artwork) => {
    if (q) {
      const haystack = `${artwork.title} ${artwork.artist} ${artwork.category}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (
      state.categories.length &&
      !state.categories.includes(artwork.category)
    ) {
      return false;
    }
    if (state.priceRanges.length) {
      const ranges = state.priceRanges
        .map((id) => PRICE_RANGES.find((r) => r.id === id))
        .filter((r) => r !== undefined);
      const matches = ranges.some(
        (r) =>
          (r.min === null || artwork.price >= r.min) &&
          (r.max === null || artwork.price <= r.max)
      );
      if (!matches) return false;
    }
    if (state.types.length && !state.types.includes(artwork.type)) {
      return false;
    }
    return true;
  });

  const sorters: Record<SortOption, (a: Artwork, b: Artwork) => number> = {
    recommended: (a, b) => b.recommended - a.recommended,
    newest: (a, b) => b.addedAt.localeCompare(a.addedAt),
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
  };

  return [...filtered].sort(sorters[state.sort]);
}

/**
 * Discover Artwork — the marketplace browse experience: search across
 * title/artist/category, faceted filters, sorting, and a responsive grid.
 * Filter state lives in the URL so views are shareable.
 */
export function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams]);
  const [quickView, setQuickView] = useState<Artwork | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { catalog } = usePublicCatalog();

  const update = (patch: Partial<FilterState>) => {
    setSearchParams(filtersToParams({ ...filters, ...patch }), { replace: true });
  };

  const toggleValue = (key: "categories" | "priceRanges" | "types") => (value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update({ [key]: next } as Partial<FilterState>);
  };

  const results = useMemo(
    () => applyFilters(filters, catalog),
    [filters, catalog]
  );

  const activeFilterCount =
    filters.categories.length +
    filters.priceRanges.length +
    filters.types.length;

  const filterPanel = (
    <FilterPanel
      state={filters}
      onToggleCategory={toggleValue("categories")}
      onTogglePrice={toggleValue("priceRanges")}
      onToggleType={toggleValue("types")}
      onClearAll={() =>
        update({ categories: [], priceRanges: [], types: [] })
      }
      activeCount={activeFilterCount}
    />
  );

  return (
    <div className="pt-24 md:pt-32">
      {/* Page header + search */}
      <Container className="pb-10 md:pb-14">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3">The collection</p>
            <h1 className="display-title text-balance text-4xl sm:text-5xl">
              Discover Artwork
            </h1>
            <p className="mt-4 text-balance text-lg leading-relaxed text-ink-600">
              Browse original paintings, prints, photography and sculpture from
              independent artists worldwide.
            </p>
          </div>

          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-400" />
              <input
                type="search"
                value={filters.query}
                onChange={(event) => update({ query: event.target.value })}
                placeholder="Search by title, artist or category…"
                aria-label="Search artwork by title, artist or category"
                className="h-13 w-full rounded-full bg-canvas-raised pl-12 pr-12 text-[15px] text-ink-900 shadow-card ring-1 ring-ink-200 placeholder:text-ink-400 transition-shadow duration-300 hover:ring-ink-300 focus:ring-2 focus:ring-brass-500 focus:outline-none"
              />
              {filters.query && (
                <button
                  type="button"
                  onClick={() => update({ query: "" })}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-900"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
        </Reveal>
      </Container>

      <Container className="pb-20 md:pb-28">
        <div className="flex gap-10">
          {/* Desktop filter sidebar */}
          <aside className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-28">{filterPanel}</div>
          </aside>

          {/* Results */}
          <div className="min-w-0 flex-1">
            {/* Toolbar */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-500">
                {results.length} {results.length === 1 ? "artwork" : "artworks"}
                {filters.query && (
                  <span className="text-ink-400"> for “{filters.query}”</span>
                )}
              </p>

              <div className="flex items-center gap-3">
                {/* Mobile filter trigger */}
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-canvas-raised px-4 text-sm font-semibold text-ink-900 shadow-card ring-1 ring-ink-200 transition-all duration-300 hover:ring-ink-400 lg:hidden"
                >
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-ink-950 text-[11px] font-bold text-canvas">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort select */}
                <div className="relative">
                  <select
                    value={filters.sort}
                    onChange={(event) =>
                      update({ sort: event.target.value as SortOption })
                    }
                    aria-label="Sort artworks"
                    className="h-10 cursor-pointer appearance-none rounded-full bg-canvas-raised pl-4 pr-10 text-sm font-semibold text-ink-900 shadow-card ring-1 ring-ink-200 transition-shadow duration-300 hover:ring-ink-400 focus:ring-2 focus:ring-brass-500 focus:outline-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                </div>
              </div>
            </div>

            {/* Grid */}
            {results.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((artwork, index) => (
                  <Reveal key={artwork.id} delay={(index % 3) * 80}>
                    <ArtworkCard
                      artwork={artwork}
                      onQuickView={setQuickView}
                    />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-xl bg-canvas-raised p-16 text-center shadow-card ring-1 ring-ink-100">
                <p className="font-display text-2xl font-medium text-ink-950">
                  No artwork found
                </p>
                <p className="max-w-sm text-sm leading-relaxed text-ink-500">
                  Try adjusting your search or removing a filter — the
                  collection is growing every week.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
                  className="mt-2 cursor-pointer rounded-md bg-ink-950 px-5 py-2.5 text-sm font-semibold text-canvas transition-colors hover:bg-ink-800"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile filter modal */}
      <Modal
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
      >
        {filterPanel}
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() =>
              update({ categories: [], priceRanges: [], types: [] })
            }
            className="h-11 flex-1 cursor-pointer rounded-md bg-canvas-raised text-sm font-semibold text-ink-900 ring-1 ring-ink-200 transition-colors hover:bg-ink-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(false)}
            className="h-11 flex-1 cursor-pointer rounded-md bg-ink-950 text-sm font-semibold text-canvas transition-colors hover:bg-ink-800"
          >
            Show {results.length} {results.length === 1 ? "artwork" : "artworks"}
          </button>
        </div>
      </Modal>

      <QuickViewModal artwork={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
