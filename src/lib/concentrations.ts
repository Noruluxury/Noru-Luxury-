import { serverFetch } from './server-api';
import type { ConcentrationOption } from '@/types/concentration';

/** Active concentrations in admin order (refreshed instantly when the admin edits them) */
export async function getConcentrations(): Promise<ConcentrationOption[]> {
  try {
    return await serverFetch<ConcentrationOption[]>('/concentrations', { revalidate: 300 });
  } catch {
    return [];
  }
}