import Link from 'next/link';
import { X } from 'lucide-react';
import { CONCENTRATION_LABELS } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

interface FragranceFiltersProps {
  /** Page the filters stay on, e.g. "/collections" or "/collections/designer-perfumes" */
  basePath: string;
  categories: Category[];
  category?: string;
  concentration?: string;
  /** Other query params to keep (e.g. sort) — page always resets to 1 */
  keep?: Record<string, string | undefined>;
}

/** Fragrance family + concentration chips that filter on the SAME page (links only, no client JS) */
export function FragranceFilters({ basePath, categories, category, concentration, keep = {} }: FragranceFiltersProps) {
  const href = (next: { category?: string | null; concentration?: string | null }) => {
    const params = new URLSearchParams();
    Object.entries(keep).forEach(([key, value]) => value && params.set(key, value));

    const c = next.category === undefined ? category : next.category;
    const z = next.concentration === undefined ? concentration : next.concentration;
    if (c) params.set('category', c);
    if (z) params.set('concentration', z);

    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ''}#products`;
  };

  const hasFilters = !!(category || concentration);

  const chip = (selected: boolean) =>
    cn(
      'inline-flex h-10 items-center gap-1.5 px-4 text-sm font-medium transition-colors',
      selected ? 'bg-navy text-gold hover:bg-gold hover:text-navy' : 'border border-navy/15 bg-white hover:border-gold hover:text-gold-dark',
    );

  return (
    <div className="space-y-6 border-l-4 border-gold bg-surface p-5 sm:p-6">
      {categories.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">Fragrance family</p>
          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const selected = category === c.slug;
              return (
                <li key={c._id}>
                  <Link href={href({ category: selected ? null : c.slug })} className={chip(selected)} aria-pressed={selected}>
                    {c.name}
                    {selected && <X size={14} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-gold-dark">Concentration</p>
        <ul className="flex flex-wrap gap-2">
          {Object.entries(CONCENTRATION_LABELS).map(([value, label]) => {
            const selected = concentration === value;
            return (
              <li key={value}>
                <Link href={href({ concentration: selected ? null : value })} className={chip(selected)} aria-pressed={selected}>
                  {label}
                  {selected && <X size={14} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {hasFilters && (
        <Link
          href={href({ category: null, concentration: null })}
          className="inline-block text-xs font-semibold uppercase tracking-wider text-gold-dark underline underline-offset-4 hover:text-navy"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}