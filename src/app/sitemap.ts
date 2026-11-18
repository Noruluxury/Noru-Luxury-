import type { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/server-api';
import { getCollections } from '@/lib/collections';
import { getSiteUrl } from '@/lib/site';
import type { Paginated, PerfumeCard } from '@/types';

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const pages: { path: string; freq: Entry['changeFrequency']; priority: number }[] = [
    { path: '', freq: 'daily', priority: 1 },
    { path: '/perfumes', freq: 'daily', priority: 0.9 },
    { path: '/collections', freq: 'weekly', priority: 0.9 },
    { path: '/brands', freq: 'weekly', priority: 0.7 },
    { path: '/about', freq: 'monthly', priority: 0.5 },
    { path: '/contact', freq: 'monthly', priority: 0.5 },
    { path: '/delivery-returns', freq: 'monthly', priority: 0.5 },
    { path: '/faq', freq: 'monthly', priority: 0.5 },
    { path: '/terms', freq: 'yearly', priority: 0.3 },
    { path: '/privacy', freq: 'yearly', priority: 0.3 },
  ];

  const collections = await getCollections();

  const perfumes: PerfumeCard[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const res = await serverFetch<Paginated<PerfumeCard>>(`/perfumes?limit=100&page=${page}`).catch(() => null);
    if (!res) break;
    perfumes.push(...res.data);
    totalPages = res.meta.totalPages;
    page++;
  } while (page <= totalPages && page <= 50);

  return [
    ...pages.map<Entry>((p) => ({
      url: `${base}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    })),
    ...collections.map<Entry>((c) => ({
      url: `${base}/collections/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      ...(c.image ? { images: [c.image.url] } : {}),
    })),
    ...perfumes.map<Entry>((p) => ({
      url: `${base}/perfumes/${p.slug}`,
      lastModified: new Date(p.createdAt),
      changeFrequency: 'weekly',
      priority: 0.8,
      ...(p.images?.[0] ? { images: [p.images[0].url] } : {}),
    })),
  ];
}