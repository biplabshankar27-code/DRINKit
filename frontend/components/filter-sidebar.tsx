'use client';

import { FLAVOR_OPTIONS, OCCASION_OPTIONS, ABV_RANGES } from '@/lib/search-params';
import type { ShopFilters } from '@/lib/search-params';
import { TasteSlider } from '@/components/taste-slider';

const SWEETNESS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
const BODY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'full', label: 'Full' },
];
const INTENSITY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'smooth', label: 'Smooth' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'bold', label: 'Bold' },
];

export interface FilterSidebarProps {
  filters: ShopFilters;
  onChange: (patch: Partial<ShopFilters>) => void;
  onClear: () => void;
  categories: { name: string; productCount: number }[];
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div className="py-4 border-t first:border-t-0" style={{ borderColor: 'var(--border)' }}>
      <button
        id={id}
        className="mb-3 flex w-full items-center justify-between text-sm font-semibold"
        style={{ color: 'var(--text)' }}
        aria-label={`Filter: ${title}`}
        tabIndex={-1}
        disabled
      >
        {title}
      </button>
      {children}
    </div>
  );
}

export function FilterSidebar({ filters, onChange, onClear, categories }: FilterSidebarProps) {
  return (
    <div className="space-y-0">
      <Section title="Category">
        <div role="radiogroup" aria-label="Category" className="space-y-1">
          <button
            type="button"
            role="radio"
            aria-checked={filters.category === ''}
            onClick={() => onChange({ category: '' })}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors"
            style={{ color: filters.category === '' ? 'var(--accent)' : 'var(--text-2)', background: filters.category === '' ? 'var(--accent-soft)' : 'transparent' }}
          >
            <span>All drinks</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={filters.category === c.name}
              onClick={() => onChange({ category: c.name })}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors"
              style={{ color: filters.category === c.name ? 'var(--accent)' : 'var(--text-2)', background: filters.category === c.name ? 'var(--accent-soft)' : 'transparent' }}
            >
              <span>{c.name}</span>
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                {c.productCount}
              </span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Price">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="filter-min-price">Minimum price</label>
          <input
            id="filter-min-price"
            inputMode="numeric"
            placeholder="Min ₹"
            value={filters.minPrice}
            onChange={(e) => onChange({ minPrice: e.target.value.replace(/\D/g, '') })}
            className="input text-xs"
          />
          <span aria-hidden style={{ color: 'var(--text-3)' }}>–</span>
          <label className="sr-only" htmlFor="filter-max-price">Maximum price</label>
          <input
            id="filter-max-price"
            inputMode="numeric"
            placeholder="Max ₹"
            value={filters.maxPrice}
            onChange={(e) => onChange({ maxPrice: e.target.value.replace(/\D/g, '') })}
            className="input text-xs"
          />
        </div>
      </Section>

      <Section title="ABV">
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="filter-abv-min">Minimum ABV</label>
          <input
            id="filter-abv-min"
            inputMode="numeric"
            placeholder="Min %"
            value={filters.abvMin}
            onChange={(e) => onChange({ abvMin: e.target.value.replace(/\D/g, '') })}
            className="input text-xs"
          />
          <span aria-hidden style={{ color: 'var(--text-3)' }}>–</span>
          <label className="sr-only" htmlFor="filter-abv-max">Maximum ABV</label>
          <input
            id="filter-abv-max"
            inputMode="numeric"
            placeholder="Max %"
            value={filters.abvMax}
            onChange={(e) => onChange({ abvMax: e.target.value.replace(/\D/g, '') })}
            className="input text-xs"
          />
        </div>
        <div className="mt-2 flex gap-1.5">
          {ABV_RANGES.map((r) => {
            const active = filters.abvMin === r.abvMin && filters.abvMax === r.abvMax;
            return (
              <button
                key={r.label}
                type="button"
                onClick={() => onChange(active ? { abvMin: '', abvMax: '' } : { abvMin: r.abvMin, abvMax: r.abvMax })}
                className="flex-1 rounded-full border py-1 text-[11px] font-medium transition-colors"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Flavor">
        <div role="group" aria-label="Flavor notes" className="flex flex-wrap gap-1.5">
          {FLAVOR_OPTIONS.map((f) => {
            const active = filters.flavors.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({
                    flavors: active ? filters.flavors.filter((x) => x !== f) : [...filters.flavors, f],
                  })
                }
                className={`chip cursor-pointer ${active ? 'chip-accent' : ''}`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Taste">
        <div className="space-y-3">
          <TasteSlider label="Sweetness" options={SWEETNESS_OPTIONS} value={filters.sweetness} onChange={(v) => onChange({ sweetness: v })} />
          <TasteSlider label="Body" options={BODY_OPTIONS} value={filters.body} onChange={(v) => onChange({ body: v })} />
          <TasteSlider label="Intensity" options={INTENSITY_OPTIONS} value={filters.intensity} onChange={(v) => onChange({ intensity: v })} />
        </div>
      </Section>

      <Section title="Occasion">
        <div role="group" aria-label="Occasion" className="flex flex-wrap gap-1.5">
          {OCCASION_OPTIONS.map((o) => {
            const active = filters.occasion === o;
            return (
              <button
                key={o}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ occasion: active ? '' : o })}
                className={`chip cursor-pointer ${active ? 'chip-accent' : ''}`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Availability">
        <label className="flex cursor-pointer items-center gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
          <input
            type="checkbox"
            id="filter-availability"
            checked={filters.availability === 'in_stock'}
            onChange={(e) => onChange({ availability: e.target.checked ? 'in_stock' : '' })}
            className="h-4 w-4 rounded"
          />
          In stock only
        </label>
      </Section>

      <div className="py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button type="button" onClick={onClear} className="btn btn-ghost btn-sm w-full">
          Clear filters
        </button>
      </div>
    </div>
  );
}
