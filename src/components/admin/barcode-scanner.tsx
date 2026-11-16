'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useMutation, useQuery } from '@tanstack/react-query';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import toast from 'react-hot-toast';
import { Camera, CameraOff, Download, ExternalLink, Pencil, Printer, ScanBarcode, Wand2 } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { cn, formatNaira } from '@/lib/utils';
import { Button, buttonClasses } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { AdminTitle, ActiveBadge, Panel, fieldClass } from './admin-ui';
import type { BarcodeLookup } from '@/types/barcode';

/**
 * The same box barcode can arrive as UPC-A (12 digits) or EAN-13 with a leading 0,
 * depending on the scanner — try both.
 */
const barcodeForms = (code: string) => {
  const forms = [code];
  if (code.length === 12) forms.push(`0${code}`);
  if (code.length === 13 && code.startsWith('0')) forms.push(code.slice(1));
  return forms;
};

async function lookupBarcode(code: string): Promise<BarcodeLookup> {
  let lastError: unknown;
  for (const form of barcodeForms(code)) {
    try {
      return (await api.get<BarcodeLookup>(`/perfumes/barcode/${form}`)).data;
    } catch (error) {
      lastError = error;
      if (!(axios.isAxiosError(error) && error.response?.status === 404)) throw error;
    }
  }
  throw lastError;
}

/* ---------- Phone / webcam scanning (also used in the perfume form) ---------- */
export function CameraScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const callback = useRef(onDetected);
  callback.current = onDetected;

  useEffect(() => {
    let controls: IScannerControls | undefined;
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    reader
      .decodeFromConstraints({ video: { facingMode: 'environment' } }, videoRef.current!, (result, _err, ctrl) => {
        if (result) {
          ctrl.stop();
          navigator.vibrate?.(80);
          callback.current(result.getText());
        }
      })
      .then((c) => {
        if (cancelled) c.stop();
        else controls = c;
      })
      .catch((e: { name?: string }) =>
        setError(e?.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Could not start the camera on this device.'),
      );

    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, []);

  return (
    <div className="relative overflow-hidden border-2 border-gold bg-navy">
      <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
      <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-error/80 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
      {error && <p className="absolute inset-x-0 bottom-0 bg-error p-2 text-center text-xs text-white">{error}</p>}
    </div>
  );
}

/* ---------- Page ---------- */
export function BarcodeScanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [input, setInput] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  const lookup = useQuery({
    queryKey: ['barcode-lookup', code],
    enabled: !!code,
    retry: false,
    queryFn: () => lookupBarcode(code!),
  });

  const backfill = useMutation({
    mutationFn: async () => (await api.post<{ message: string }>('/perfumes/barcodes/backfill')).data,
    onSuccess: (res) => toast.success(res.message),
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const [exporting, setExporting] = useState(false);
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/perfumes/barcodes/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `product-barcodes_${new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Download failed'));
    } finally {
      setExporting(false);
    }
  };

  const search = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return;
    setCode(digits);
    setRecent((r) => [digits, ...r.filter((c) => c !== digits)].slice(0, 6));
    setInput('');
    setCamera(false);
    inputRef.current?.focus();
  }, []);

  // USB scanners type the digits then press Enter — keep the box focused
  useEffect(() => inputRef.current?.focus(), []);

  const data = lookup.data;
  const variant = data?.variant;
  const perfume = data?.perfume;

  return (
    <div className="space-y-6">
      <AdminTitle title="Barcode scanner" description="Scan the box barcode or your own sticker — USB scanner or phone / laptop camera." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Input */}
        <Panel title={<span className="flex items-center gap-2"><ScanBarcode size={16} className="text-gold-dark" /> Scan or type</span>}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              search(input);
            }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Scan a barcode…"
              className={cn(fieldClass, 'h-12 flex-1 font-mono text-lg')}
            />
            <Button type="submit" size="lg">Find</Button>
          </form>

          <div className="mt-4">
            <Button variant={camera ? 'danger' : 'gold'} fullWidth onClick={() => setCamera((c) => !c)}>
              {camera ? <><CameraOff size={16} /> Stop camera</> : <><Camera size={16} /> Scan with camera</>}
            </Button>
            {camera && <div className="mt-3"><CameraScanner onDetected={search} /></div>}
          </div>

          {recent.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-navy/55">Recent scans</p>
              <div className="flex flex-wrap gap-2">
                {recent.map((c) => (
                  <button key={c} type="button" onClick={() => search(c)} className="border border-navy/15 px-2 py-1 font-mono text-xs hover:border-gold">
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* Result */}
        <Panel title="Result">
          {!code ? (
            <p className="py-10 text-center text-sm text-navy/55">Scan a barcode to see the product.</p>
          ) : lookup.isLoading ? (
            <div className="flex justify-center py-10 text-gold"><Spinner size="lg" /></div>
          ) : lookup.isError ? (
            <div className="border-l-4 border-error bg-error/10 p-4 text-sm">
              <p className="font-semibold text-error">Not found</p>
              <p className="mt-1">{getErrorMessage(lookup.error)}</p>
              <p className="mt-2 text-xs text-navy/60">
                New box? Open the perfume in <Link href="/admin/perfumes" className="font-semibold underline">Perfumes</Link> and scan this
                barcode into the right size.
              </p>
            </div>
          ) : perfume && variant ? (
            <div>
              <div className="flex gap-4">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden border border-navy/10 bg-surface">
                  {perfume.images[0] && <Image src={perfume.images[0].url} alt="" fill sizes="96px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">{perfume.brand?.name}</p>
                  <p className="font-serif text-xl leading-tight">{perfume.name}</p>
                  <p className="mt-1 text-sm">{variant.size}ml</p>
                  <div className="mt-2"><ActiveBadge active={perfume.isActive} /></div>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="bg-navy p-3 text-white">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-gold">Price</dt>
                  <dd className="mt-1 text-xl font-semibold">{formatNaira(variant.price)}</dd>
                </div>
                <div className={cn('p-3', variant.stock === 0 ? 'bg-error/10' : variant.stock <= 5 ? 'bg-gold/20' : 'bg-success/10')}>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-navy/60">In stock</dt>
                  <dd className={cn('mt-1 text-xl font-semibold', variant.stock === 0 && 'text-error')}>{variant.stock}</dd>
                </div>
                <div className="col-span-2 bg-surface p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-navy/60">Barcode · SKU</dt>
                  <dd className="mt-1 font-mono">{data.barcode} · {variant.sku ?? '—'}</dd>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-1 gap-2 xs:grid-cols-3">
                <Link href={`/admin/perfumes/${perfume._id}`} className={buttonClasses({ size: 'sm' })}><Pencil size={14} /> Edit</Link>
                <a href={`/print/labels/${perfume._id}?variant=${variant._id}`} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'gold', size: 'sm' })}>
                  <Printer size={14} /> Labels
                </a>
                <a href={`/perfumes/${perfume.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
                  <ExternalLink size={14} /> Store
                </a>
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      {/* Tools */}
      <Panel title="Barcode tools">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border-t-4 border-gold bg-surface p-4">
            <p className="font-semibold">Give remaining sizes a barcode</p>
            <p className="mt-1 text-sm text-navy/65">
              Creates a new barcode for every size that still has none. <strong>First</strong> scan the box barcodes into perfumes that
              have them — then use this for the rest.
            </p>
            <Button variant="primary" size="sm" className="mt-3" loading={backfill.isPending} onClick={() => backfill.mutate()}>
              <Wand2 size={14} /> Generate missing barcodes
            </Button>
          </div>
          <div className="border-t-4 border-gold bg-surface p-4">
            <p className="font-semibold">Product list for supermarkets</p>
            <p className="mt-1 text-sm text-navy/65">
              CSV with barcode, product name, brand, size and price — send it to stores so their tills show your perfumes when scanned.
            </p>
            <Button variant="gold" size="sm" className="mt-3" loading={exporting} onClick={exportCsv}>
              <Download size={14} /> Download barcode list (CSV)
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}