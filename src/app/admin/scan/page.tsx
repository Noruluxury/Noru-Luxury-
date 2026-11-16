import type { Metadata } from 'next';
import { BarcodeScanner } from '@/components/admin/barcode-scanner';

export const metadata: Metadata = { title: 'Scan' };

export default function AdminScanPage() {
  return <BarcodeScanner />;
}