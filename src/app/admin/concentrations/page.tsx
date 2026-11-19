import type { Metadata } from 'next';
import { ConcentrationsManager } from '@/components/admin/concentrations-manager';

export const metadata: Metadata = { title: 'Concentrations' };

export default function AdminConcentrationsPage() {
  return <ConcentrationsManager />;
}