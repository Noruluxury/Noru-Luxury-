import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { serverFetch } from '@/lib/server-api';
import { getCollection, getCollections } from '@/lib/collections';
import { COLLECTION_GROUP_LABELS } from '@/lib/product';
import { GALLERY_PAGE_SIZE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { PerfumeTile } from '@/components/perfume/perfume-tile';
import type { Paginated, PerfumeCard } from '@/types';

type Params = Promise<{ slug: string }>;
type Search = Promise<{ page?: string; sort?: string }>;

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'best_selling', label: 'Best selling' },
  { value: 'top_rated', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollection(slug);
  if (!collection) return { title: 'Collection not found', robots: { index: false } };

  return {
    title: collection.name,
    description: collection.description ?? `Shop ${collection.name} — authentic, QR-verified products.`,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: collection.image ? { images: [{ url: collection.image.url }] } : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const query = await searchParams;

  const collection = await getCollection(slug);
  if (!collection) notFound();

  const sort = SORTS.some((s) => s.value === query.sort) ? query.sort! : 'newest';
  const page = Math.max(1, Number(query.page) || 1);

  const [result, all] = await Promise.all([
    serverFetch<Paginated<PerfumeCard>>(
      `/perfumes?collection=${encodeURIComponent(slug)}&page=${page}&limit=${GALLERY_PAGE_SIZE}&sort=${sort}`,
      { revalidate: 60 },
    ).catch(() => ({ data: [], meta: { page, limit: GALLERY_PAGE_SIZE, total: 0, totalPages: 0 } }) as Paginated<PerfumeCard>),
    getCollections(),
  ]);

  const siblings = all.filter((c) => c.group === collection.group);
  const { data: products, meta } = result;

  const href = (next: { page?: number; sort?: string }) => {
    const p = new URLSearchParams();
    const s = next.sort ?? sort;
    const pg = next.page ?? 1;
    if (s !== 'newest') p.set('sort', s);
    if (pg > 1) p.set('page', String(pg));
    const qs = p.toString();
    return `/collections/${slug}${qs ? `?${qs}` : ''}`;
  };

  return (
    <div className="pb-16 sm:pb-24">
      <PageHeader
        eyebrow={COLLECTION_GROUP_LABELS[collection.group]}
        title={collection.name}
        description={collection.description}
        backHref="/collections"
        backLabel="All collections"
      />

      <div className="container-page pt-6 sm:pt-8">
        {/* Other collections in this heading */}
        {siblings.length > 1 && (
          <nav aria-label="Related collections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex gap-2 pb-2 sm:flex-wrap">
              {siblings.map((c) => (
                <li key={c._id} className="shrink-0">
                  <Link
                    href={`/collections/${c.slug}`}
                    className={cn(
                      'inline-flex h-10 items-center px-4 text-xs font-semibold uppercase tracking-wider transition-colors',
                      c.slug === slug ? 'bg-navy text-gold' : 'border border-navy/15 hover:border-gold',
                    )}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Sort + count */}
        <div className="mt-6 flex flex-col gap-3 border-b border-navy/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-navy/60">
            {meta.total} product{meta.total === 1 ? '' : 's'}
          </p>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex gap-2">
              {SORTS.map((s) => (
                <li key={s.value} className="shrink-0">
                  <Link
                    href={href({ sort: s.value })}
                    scroll={false}
                    className={cn(
                      'inline-flex h-9 items-center px-3 text-xs font-medium transition-colors',
                      sort === s.value ? 'bg-gold font-semibold text-navy' : 'text-navy/70 hover:text-gold-dark',
                    )}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center bg-navy text-gold"><PackageSearch size={26} /></span>
            <p className="mt-5 font-serif text-2xl">Coming soon</p>
            <p className="mt-2 max-w-sm text-sm text-navy/60">We’re adding products to this collection. Explore our other collections in the meantime.</p>
            <Link href="/collections" className="mt-6 inline-flex h-11 items-center bg-navy px-6 text-xs font-semibold uppercase tracking-wider text-gold hover:bg-gold hover:text-navy">
              All collections
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <li key={p._id}>
                <PerfumeTile perfume={p} priority={i < 4} />
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-3">
            {page > 1 ? (
              <Link href={href({ page: page - 1 })} aria-label="Previous page" className="flex h-11 w-11 items-center justify-center border border-navy hover:bg-navy hover:text-gold">
                <ChevronLeft size={18} />
              </Link>
            ) : (
              <span className="flex h-11 w-11 items-center justify-center border border-navy/15 text-navy/25"><ChevronLeft size={18} /></span>
            )}
            <span className="text-sm">
              Page <span className="font-bold">{page}</span> of {meta.totalPages}
            </span>
            {page < meta.totalPages ? (
              <Link href={href({ page: page + 1 })} aria-label="Next page" className="flex h-11 w-11 items-center justify-center border border-navy hover:bg-navy hover:text-gold">
                <ChevronRight size={18} />
              </Link>
            ) : (
              <span className="flex h-11 w-11 items-center justify-center border border-navy/15 text-navy/25"><ChevronRight size={18} /></span>
            )}
          </nav>
        )}
      </div>
    </div>
  );
}