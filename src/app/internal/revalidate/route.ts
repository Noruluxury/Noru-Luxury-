import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

const ALLOWED_TAGS = new Set(['perfumes', 'brands', 'categories', 'settings', 'collections', 'concentrations']);

/** These are used on many pages (menu, filters, product pages) — refresh the whole site */
const SITE_WIDE_TAGS = new Set(['collections', 'concentrations']);

const PATHS_FOR_TAG: Record<string, string[]> = {
  perfumes: ['/', '/perfumes', '/perfumes/[slug]', '/collections', '/collections/[slug]', '/sitemap.xml'],
  brands: ['/', '/brands', '/perfumes'],
  categories: ['/', '/perfumes', '/collections', '/collections/[slug]'],
  settings: ['/', '/contact', '/delivery-returns'],
};

/** Called by the NestJS backend after admin changes */
export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;

  if (!secret) {
    console.error('[revalidate] REVALIDATE_SECRET is not set in the frontend env');
    return NextResponse.json({ ok: false, error: 'Frontend REVALIDATE_SECRET not set' }, { status: 500 });
  }
  if (request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown };
  const tags = (Array.isArray(body.tags) ? body.tags : []).filter(
    (tag): tag is string => typeof tag === 'string' && ALLOWED_TAGS.has(tag),
  );

  for (const tag of tags) {
    revalidateTag(tag, { expire: 0 });

    if (SITE_WIDE_TAGS.has(tag)) {
      revalidatePath('/', 'layout');
      continue;
    }

    for (const path of PATHS_FOR_TAG[tag] ?? []) {
      revalidatePath(path, path.includes('[') ? 'page' : undefined);
    }
  }

  return NextResponse.json({ ok: true, revalidated: tags });
}