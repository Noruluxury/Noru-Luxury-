'use client';

import { Suspense, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { barcodeImageUrl } from '@/lib/barcode';
import { joinParts, sizeLabel } from '@/lib/product';
import { formatNaira } from '@/lib/utils';
import { SITE_NAME } from '@/lib/constants';
import type { Perfume } from '@/types';

const SIZES = {
  small: { label: '50 × 30 mm', w: 50, h: 30 },
  medium: { label: '60 × 40 mm', w: 60, h: 40 },
  large: { label: '70 × 50 mm', w: 70, h: 50 },
} as const;
type SizeKey = keyof typeof SIZES;

function LabelsSheet() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [variantId, setVariantId] = useState(searchParams.get('variant') ?? 'all');
  const [copies, setCopies] = useState(12);
  const [size, setSize] = useState<SizeKey>('medium');
  const [showPrice, setShowPrice] = useState(true);
  const [showBarcode, setShowBarcode] = useState(true);
  const [showQr, setShowQr] = useState(true);

  const { data: perfume, isLoading, isError, error } = useQuery({
    queryKey: ['admin-perfume', id],
    queryFn: async () => (await api.get<Perfume>(`/perfumes/admin/${id}`)).data,
  });

  const labels = useMemo(() => {
    if (!perfume) return [];
    const variants = [...perfume.variants]
      .filter((v) => (variantId === 'all' || v._id === variantId) && (!showBarcode || v.barcode))
      .sort((a, b) => a.size - b.size);
    return variants.flatMap((v) => Array.from({ length: copies }, (_, i) => ({ key: `${v._id}-${i}`, variant: v })));
  }, [perfume, variantId, copies, showBarcode]);

  if (isLoading) return <p className="p-8 text-center text-sm">Loading labels…</p>;
  if (isError || !perfume) return <p className="p-8 text-center text-sm text-error">{getErrorMessage(error, 'Could not load product')}</p>;

  const dims = SIZES[size];
  const qrOnly = !showBarcode && showQr;
  const multipleOptions = perfume.variants.length > 1;

  return (
    <div className="min-h-screen bg-surface print:bg-white">
      <style>{`@page { size: A4; margin: 8mm; } @media print { html, body { background: #fff !important; } }`}</style>

      {/* Controls — hidden when printing */}
      <div className="sticky top-0 z-10 border-b-2 border-gold bg-navy p-4 text-white print:hidden">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">Print labels</p>
            <p className="font-serif text-lg">{perfume.name}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3 text-xs">
            {multipleOptions && (
              <label className="flex flex-col gap-1">
                Size
                <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="h-9 bg-white px-2 text-navy">
                  <option value="all">All sizes</option>
                  {perfume.variants.map((v) => <option key={v._id} value={v._id}>{sizeLabel(v.size) || 'Single price'}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              Copies{multipleOptions ? ' each' : ''}
              <input type="number" min={1} max={100} value={copies} onChange={(e) => setCopies(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className="h-9 w-20 bg-white px-2 text-navy" />
            </label>
            <label className="flex flex-col gap-1">
              Label size
              <select value={size} onChange={(e) => setSize(e.target.value as SizeKey)} className="h-9 bg-white px-2 text-navy">
                {Object.entries(SIZES).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select>
            </label>
            <label className="flex h-9 items-center gap-2"><input type="checkbox" checked={showBarcode} onChange={(e) => setShowBarcode(e.target.checked)} className="accent-gold" /> Barcode</label>
            <label className="flex h-9 items-center gap-2"><input type="checkbox" checked={showQr} onChange={(e) => setShowQr(e.target.checked)} className="accent-gold" /> QR</label>
            <label className="flex h-9 items-center gap-2"><input type="checkbox" checked={showPrice} onChange={(e) => setShowPrice(e.target.checked)} className="accent-gold" /> Price</label>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!showBarcode && !showQr}
              className="flex h-9 items-center gap-2 bg-gold px-4 font-semibold uppercase tracking-wider text-navy hover:bg-gold-light disabled:opacity-40"
            >
              <Printer size={16} /> Print
            </button>
          </div>
        </div>
        <p className="mx-auto mt-2 max-w-5xl text-[11px] text-white/60">
          Box already has the manufacturer’s barcode? Untick <strong>Barcode</strong> to print QR-only authenticity stickers.
        </p>
      </div>

      {/* Sheet */}
      <div className="mx-auto max-w-5xl p-4 print:max-w-none print:p-0">
        {!showBarcode && !showQr ? (
          <p className="p-8 text-center text-sm">Tick Barcode, QR, or both.</p>
        ) : labels.length === 0 ? (
          <p className="p-8 text-center text-sm">No barcodes yet — save the product in the admin panel first.</p>
        ) : (
          <div className="flex flex-wrap gap-[2mm] bg-white p-[4mm] print:p-0">
            {labels.map(({ key, variant }) => {
              const detail = joinParts(sizeLabel(variant.size), showPrice && formatNaira(variant.price));
              return (
                <div
                  key={key}
                  className="flex overflow-hidden border border-dashed border-navy/30 bg-white text-black print:border-black/20"
                  style={{ width: `${dims.w}mm`, height: `${dims.h}mm`, padding: '1.5mm', breakInside: 'avoid' }}
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate font-bold uppercase leading-tight" style={{ fontSize: `${dims.h / 6.5}pt` }}>{perfume.brand?.name}</p>
                    <p className={qrOnly ? 'line-clamp-2 leading-tight' : 'truncate leading-tight'} style={{ fontSize: `${dims.h / 5.5}pt` }}>
                      {perfume.name}
                    </p>
                    {detail && (
                      <p className="font-semibold leading-tight" style={{ fontSize: `${dims.h / 5.5}pt` }}>{detail}</p>
                    )}
                    {showBarcode && variant.barcode ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={barcodeImageUrl(perfume._id, variant._id)} alt={variant.barcode} className="mt-auto w-full object-contain" style={{ height: '55%' }} />
                    ) : (
                      <p className="mt-auto leading-tight" style={{ fontSize: `${dims.h / 7}pt` }}>
                        Genuine product from {SITE_NAME}
                      </p>
                    )}
                  </div>
                  {showQr && perfume.qrCode?.url && (
                    <div
                      className="ml-[1.5mm] flex shrink-0 flex-col items-center justify-center"
                      style={{ width: `${qrOnly ? dims.h * 0.85 : dims.h * 0.42}mm` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={perfume.qrCode.url} alt="QR" className="w-full" />
                      <p className="mt-[0.5mm] text-center leading-tight" style={{ fontSize: qrOnly ? '6pt' : '4.5pt' }}>Scan to verify</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-center text-xs text-navy/50 print:hidden">
          {SITE_NAME} · Tip: in the print dialog choose “Actual size / 100%” and turn off headers & footers.
        </p>
      </div>
    </div>
  );
}

export default function PrintLabelsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-sm">Loading…</p>}>
      <LabelsSheet />
    </Suspense>
  );
}