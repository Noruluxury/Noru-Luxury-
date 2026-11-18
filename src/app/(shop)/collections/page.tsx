import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/server-api';
import { getCollections } from '@/lib/collections';
import { groupCollections } from '@/lib/product';
import { PageHeader } from '@/components/ui/page-header';
import { SectionHeading, ProductRail } from '@/components/home/product-rail';
import { CollectionCard } from '@/components/collections/collection-card';
import type { Category, Paginated, PerfumeCard } from '@/types';

export const metadata: Metadata = {
  title: 'Collections',
  description: 'Browse our designer and niche perfumes, perfume oils, diffusers, gift sets and lifestyle products.',
  alternates: { canonical: '/collections' },
};

export default async function CollectionsPage() {
  const [collections, categories, topRated] = await Promise.all([
    getCollections(),
    serverFetch<Category[]>('/categories', { revalidate: 300 }).catch(() => [] as Category[]),
    serverFetch<Paginated<PerfumeCard>>('/perfumes?sort=top_rated&limit=8', { revalidate: 120 })
      .then((r) => r.data.filter((p) => (p.ratingCount ?? 0) > 0))
      .catch(() => [] as PerfumeCard[]),
  ]);

  const groups = groupCollections(collections);

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
            </section>
          ))
        )}

        {categories.length > 0 && (
          <section>
            <SectionHeading eyebrow="Explore" title="Shop by fragrance family" href="/perfumes" linkLabel="All products" />
            <ul className="mt-6 flex flex-wrap gap-2 sm:gap-3">
              {categories.map((c) => (
                <li key={c._id}>
                  <Link
                    href={`/perfumes?category=${c.slug}`}
                    className="inline-flex h-11 items-center border border-navy/15 px-5 text-sm font-medium transition-colors hover:border-gold hover:bg-navy hover:text-gold"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {topRated.length > 0 && <ProductRail eyebrow="Loved by buyers" title="Top rated" href="/perfumes?sort=top_rated" perfumes={topRated} />}
    </div>
  );
}