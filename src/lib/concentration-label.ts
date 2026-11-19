import { CONCENTRATION_LABELS } from './labels';

/** Display name for a concentration code — from the admin list, then built-in names, then a tidy version of the code */
export function concentrationName(slug?: string | null, list?: { slug: string; name: string }[]) {
  if (!slug) return '';
  return (
    list?.find((c) => c.slug === slug)?.name ??
    (CONCENTRATION_LABELS as Record<string, string>)[slug] ??
    slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
  );
}