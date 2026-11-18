import type { CollectionGroup, ProductType } from '@/types';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  perfume: 'Perfume',
  perfume_oil: 'Perfume oil',
  diffuser: 'Diffuser',
  gift_set: 'Gift set',
  lifestyle: 'Lifestyle product',
};

export const COLLECTION_GROUP_LABELS: Record<CollectionGroup, string> = {
  fragrance: 'Fragrance Collections',
  diffuser: 'Diffuser Collections',
  more: 'More',
};

export const COLLECTION_GROUP_ORDER: CollectionGroup[] = ['fragrance', 'diffuser', 'more'];

/** Perfumes and oils come in ml sizes; everything else has one price */
export const isSizedType = (type?: ProductType | null) => !type || type === 'perfume' || type === 'perfume_oil';

/** "50ml" for perfumes, "" for one-price products (size 0) */
export const sizeLabel = (size?: number | null) => (size && size > 0 ? `${size}ml` : '');

/** Joins non-empty parts with " · " */
export const joinParts = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' · ');

/** Groups collections under their headings (Fragrance → Diffuser → More), skipping empty headings */
export function groupCollections<T extends { group: CollectionGroup }>(items: T[]) {
  return COLLECTION_GROUP_ORDER.map((group) => ({
    group,
    label: COLLECTION_GROUP_LABELS[group],
    items: items.filter((c) => c.group === group),
  })).filter((g) => g.items.length > 0);
}