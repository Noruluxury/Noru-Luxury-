import type { Metadata } from 'next';
import { CollectionsManager } from '@/components/admin/collections-manager';

export const metadata: Metadata = { title: 'Collections' };

export default function AdminCollectionsPage() {
  return <CollectionsManager />;
}