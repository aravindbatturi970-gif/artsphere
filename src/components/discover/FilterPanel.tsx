import { FilterGroup } from "@/components/discover/FilterGroup";
import { ARTWORK_TYPES, CATEGORY_FILTERS, PRICE_RANGES } from "@/config/filters";
import type { ArtworkType, SortOption } from "@/types";

export interface FilterState {
  categories: string[];
  priceRanges: string[];
  types: ArtworkType[];
  sort: SortOption;
  query: string;
}

export const EMPTY_FILTERS: FilterState = {
  categories: [],
  priceRanges: [],
  types: [],
  sort: "recommended",
  query: "",
};

interface FilterPanelProps {
  state: FilterState;
  onToggleCategory: (id: string) => void;
  onTogglePrice: (id: string) => void;
  onToggleType: (type: ArtworkType) => void;
  onClearAll: () => void;
  activeCount: number;
}

/**
 * Filter rail for Discover: categories, price buckets, artwork type.
 * Rendered as a sidebar on desktop and inside a modal on mobile.
 */
export function FilterPanel({
  state,
  onToggleCategory,
  onTogglePrice,
  onToggleType,
  onClearAll,
  activeCount,
}: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Filters</p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="cursor-pointer text-xs font-semibold text-brass-700 transition-colors hover:text-brass-600"
          >
            Clear all ({activeCount})
          </button>
        )}
      </div>

      <FilterGroup
        title="Category"
        options={CATEGORY_FILTERS}
        selected={state.categories}
        onToggle={onToggleCategory}
      />

      <FilterGroup
        title="Price"
        options={PRICE_RANGES.map((r) => ({ id: r.id, label: r.label }))}
        selected={state.priceRanges}
        onToggle={onTogglePrice}
      />

      <FilterGroup
        title="Artwork type"
        options={ARTWORK_TYPES}
        selected={state.types}
        onToggle={(id) => onToggleType(id as ArtworkType)}
      />
    </div>
  );
}
