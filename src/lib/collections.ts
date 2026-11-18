import { ApiError, serverFetch } from './server-api';
import type { ProductCollection } from '@/types/collection';

/** Active collections in admin order (cached, refreshed instantly when the admin edits them) */
export async function getCollections(): Promise<ProductCollection[]> {
  try {
    return await serverFetch<ProductCollection[]>('/collections', { revalidate: 300 });
  } catch {
    return [];
  }
}

export async function getCollection(slug: string): Promise<ProductCollection | null> {
  try {
    return await serverFetch<ProductCollection>(`/collections/slug/${encodeURIComponent(slug)}`, { revalidate: 300 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}