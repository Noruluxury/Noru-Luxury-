import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { getCollections } from '@/lib/collections';
import { getConcentrations } from '@/lib/concentrations';
import { concentrationName } from '@/lib/concentration-label';
import { groupCollections } from '@/lib/product';
import { GALLERY_PAGE_SIZE } from '@/lib/constants';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading, ProductRail } from '@/components/home/product-rail';
import { CollectionCard } from '@/components/collections/collection-card';
import { FragranceFilters } from '@/components/collections/fragrance-filters';
import { PerfumeTile } from '@/components/perfume/perfume-tile';
import type { Category, Paginated, PerfumeCard } from '@/types';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse our designer and niche perfumes, perfume oils, diffusers, gift sets and lifestyle products.',
  alternates: { canonical: '/collections' },
};

type Search = Promise<{ category?: string; concentration?: string; page?: string }>;

const emptyPage = (page: number): Paginated<PerfumeCard> => ({ data: [], meta: { page, limit: GALLERY_PAGE_SIZE, total: 0, totalPages: 0 } });

export default async function CollectionsPage({ searchParams }: { searchParams: Search }) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);

  const [collections, categories, concentrations, topRated] = await Promise.all([
    getCollections(),
    serverFetch<Category[]>('/categories', { revalidate: 300 }).catch(() => [] as Category[]),
    getConcentrations(),
    serverFetch<Paginated<PerfumeCard>>('/perfumes?sort=top_rated&limit=8', { revalidate: 120 })
      .then((r) => r.data.filter((p) => (p.ratingCount ?? 0) > 0))
      .catch(() => [] as PerfumeCard[]),
  ]);

  const category = query.category?.trim() || undefined;
  const concentration = concentrations.some((c) => c.slug === query.concentration) ? query.concentration : undefined;
  const filtering = !!(category || concentration);

  const results = filtering
    ? await serverFetch<Paginated<PerfumeCard>>(
        `/perfumes?page=${page}&limit=${GALLERY_PAGE_SIZE}` +
          (category ? `&category=${encodeURIComponent(category)}` : '') +
          (concentration ? `&concentration=${concentration}` : ''),
        { revalidate: 60 },
      ).catch(() => emptyPage(page))
    : emptyPage(page);

  const groups = groupCollections(collections);
  const activeLabel = [categories.find((c) => c.slug === category)?.name, concentrationName(concentration, concentrations)]
    .filter(Boolean)
    .join(' · ');

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (concentration) params.set('concentration', concentration);
    if (p > 1) params.set('page', String(p));
    return `/collections?${params.toString()}#products`;
  };

  const fragranceFilterBlock = (
    <div className="mt-8">
      <FragranceFilters
        basePath="/collections"
        categories={categories}
        concentrations={concentrations}
        category={category}
        concentration={concentration}
      />

      {filtering && (
        <div id="products" className="scroll-mt-32 pt-8">
          <p className="text-sm text-navy/60">
            {results.meta.total} product{results.meta.total === 1 ? '' : 's'} · <span className="font-semibold text-navy">{activeLabel}</span>
          </p>

          {results.data.length === 0 ? (
            <div className="mt-6 flex flex-col items-center border border-navy/10 py-12 text-center">
              <span className="flex h-12 w-12 items-center justify-center bg-navy text-gold"><PackageSearch size={22} /></span>
              <p className="mt-4 font-serif text-xl">No products match</p>
              <Link href="/collections#products" className="mt-3 text-xs font-semibold uppercase tracking-wider text-gold-dark underline underline-offset-4">
                Clear filters
              </Link>
            </div>
          ) : (
            <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
              {results.data.map((p) => (
                <li key={p._id}><PerfumeTile perfume={p} /></li>
              ))}
            </ul>
          )}

          {results.meta.totalPages > 1 && (
            <nav aria-label="Pages" className="mt-10 flex items-center justify-center gap-3">
              {page > 1 ? (
                <Link href={pageHref(page - 1)} aria-label="Previous page" className="flex h-11 w-11 items-center justify-center border border-navy hover:bg-navy hover:text-gold"><ChevronLeft size={18} /></Link>
              ) : (
                <span className="flex h-11 w-11 items-center justify-center border border-navy/15 text-navy/25"><ChevronLeft size={18} /></span>
              )}
              <span className="text-sm">Page <span className="font-bold">{page}</span> of {results.meta.totalPages}</span>
              {page < results.meta.totalPages ? (
                <Link href={pageHref(page + 1)} aria-label="Next page" className="flex h-11 w-11 items-center justify-center border border-navy hover:bg-navy hover:text-gold"><ChevronRight size={18} /></Link>
              ) : (
                <span className="flex h-11 w-11 items-center justify-center border border-navy/15 text-navy/25"><ChevronRight size={18} /></span>
              )}
            </nav>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="pb-16 sm:pb-24">
      <PageHeader
        eyebrow="Browse"
        title="Our collections"
        description="Designer and niche perfumes, perfume oils, diffusers, gift sets and lifestyle products — find exactly what you’re looking for."
      />

      <div className="container-page space-y-14 pt-10 sm:space-y-16 sm:pt-14">
        {groups.length === 0 ? (
          <p className="border-l-4 border-gold bg-gold/10 p-4 text-sm">Collections are coming soon.</p>
        ) : (
          groups.map((g) => (
            <section key={g.group}>
              <SectionHeading eyebrow="Collections" title={g.label} />
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {g.items.map((c) => (
                  <li key={c._id}>
                    <CollectionCard collection={c} />
                  </li>
                ))}
              </ul>

              {g.group === 'fragrance' && fragranceFilterBlock}
            </section>
          ))
        )}
      </div>

      {topRated.length > 0 && <ProductRail eyebrow="Loved by buyers" title="Top rated" href="/perfumes?sort=top_rated" perfumes={topRated} />}
    </div>
  );
}