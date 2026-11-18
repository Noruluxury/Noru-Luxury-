'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, ExternalLink, ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { MAX_IMAGE_SIZE_MB } from '@/lib/constants';
import { COLLECTION_GROUP_LABELS, COLLECTION_GROUP_ORDER } from '@/lib/product';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { ActiveBadge, AdminTitle, ConfirmDialog, ErrorBox, Modal, Panel, fieldClass } from './admin-ui';
import type { CollectionGroup } from '@/types';
import type { ProductCollection } from '@/types/collection';

const QUERY_KEY = ['admin-collections'];
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

interface FormState {
  name: string;
  group: CollectionGroup;
  description: string;
  isActive: boolean;
  image: File | null;
  preview: string | null;
}

const emptyForm = (group: CollectionGroup = 'fragrance'): FormState => ({
  name: '',
  group,
  description: '',
  isActive: true,
  image: null,
  preview: null,
});

export function CollectionsManager() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ProductCollection | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleting, setDeleting] = useState<ProductCollection | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => (await api.get<ProductCollection[]>('/collections/admin')).data,
  });

  useEffect(() => () => {
    if (form.preview?.startsWith('blob:')) URL.revokeObjectURL(form.preview);
  }, [form.preview]);

  const grouped = useMemo(
    () =>
      COLLECTION_GROUP_ORDER.map((group) => ({
        group,
        items: (data ?? []).filter((c) => c.group === group).sort((a, b) => a.sortOrder - b.sortOrder),
      })),
    [data],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['admin-collection-options'] });
  };

  /* ---------- Save (create / edit) ---------- */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('group', form.group);
      fd.append('description', form.description.trim());
      fd.append('isActive', String(form.isActive));
      if (form.image) fd.append('image', form.image);

      if (editing === 'new') return api.post('/collections', fd);
      return api.patch(`/collections/${(editing as ProductCollection)._id}`, fd);
    },
    onSuccess: () => {
      refresh();
      toast.success(editing === 'new' ? 'Collection added' : 'Collection updated');
      setEditing(null);
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not save collection')),
  });

  /* ---------- Reorder ---------- */
  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => (await api.patch<ProductCollection[]>('/collections/reorder', { ids })).data,
    onSuccess: (list) => queryClient.setQueryData(QUERY_KEY, list),
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Could not reorder'));
      refresh();
    },
  });

  const move = (items: ProductCollection[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];

    // Instant feedback, then save
    queryClient.setQueryData<ProductCollection[]>(QUERY_KEY, (old) =>
      old?.map((c) => {
        const pos = next.findIndex((n) => n._id === c._id);
        return pos === -1 ? c : { ...c, sortOrder: pos };
      }),
    );
    reorderMutation.mutate(next.map((c) => c._id));
  };

  /* ---------- Quick hide / show ---------- */
  const toggleMutation = useMutation({
    mutationFn: async (c: ProductCollection) => {
      const fd = new FormData();
      fd.append('isActive', String(!c.isActive));
      return api.patch(`/collections/${c._id}`, fd);
    },
    onSuccess: () => {
      refresh();
      toast.success('Visibility updated');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  /* ---------- Delete ---------- */
  const deleteMutation = useMutation({
    mutationFn: async (c: ProductCollection) => api.delete(`/collections/${c._id}`),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success('Collection deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openNew = (group: CollectionGroup) => {
    setForm(emptyForm(group));
    setEditing('new');
  };

  const openEdit = (c: ProductCollection) => {
    setForm({
      name: c.name,
      group: c.group,
      description: c.description ?? '',
      isActive: c.isActive,
      image: null,
      preview: c.image?.url ?? null,
    });
    setEditing(c);
  };

  const pickImage = (file?: File) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return toast.error('Use a JPG, PNG, WebP or AVIF image');
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) return toast.error(`Image must be under ${MAX_IMAGE_SIZE_MB}MB`);
    setForm((f) => ({ ...f, image: file, preview: URL.createObjectURL(file) }));
  };

  if (isLoading) return <PageLoader label="Loading collections..." />;
  if (isError) return <ErrorBox message={getErrorMessage(error)} />;

  return (
    <div className="space-y-6">
      <AdminTitle
        title="Collections"
        description="These appear under “Browse” in the menu and on the Collections page. Use the arrows to set the order."
        actions={
          <Button variant="gold" onClick={() => openNew('fragrance')}>
            <Plus size={16} /> Add collection
          </Button>
        }
      />

      {grouped.map(({ group, items }) => (
        <Panel
          key={group}
          title={COLLECTION_GROUP_LABELS[group]}
          actions={
            <button type="button" onClick={() => openNew(group)} className="inline-flex items-center gap-1 text-xs font-semibold uppercase text-gold-dark hover:text-navy">
              <Plus size={14} /> Add
            </button>
          }
          bodyClassName="p-0 sm:p-0"
        >
          {items.length === 0 ? (
            <p className="p-5 text-sm text-navy/55">No collections under this heading yet.</p>
          ) : (
            <ul className="divide-y divide-navy/10">
              {items.map((c, index) => (
                <li key={c._id} className={cn('flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4', !c.isActive && 'opacity-60')}>
                  {/* Order */}
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => move(items, index, -1)}
                      disabled={index === 0 || reorderMutation.isPending}
                      aria-label={`Move ${c.name} up`}
                      className="flex h-7 w-7 items-center justify-center text-navy/60 hover:bg-gold hover:text-navy disabled:opacity-20"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(items, index, 1)}
                      disabled={index === items.length - 1 || reorderMutation.isPending}
                      aria-label={`Move ${c.name} down`}
                      className="flex h-7 w-7 items-center justify-center text-navy/60 hover:bg-gold hover:text-navy disabled:opacity-20"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-navy text-xs font-bold text-gold">{index + 1}</span>

                  <div className="relative h-12 w-12 shrink-0 overflow-hidden bg-surface">
                    {c.image ? (
                      <Image src={c.image.url} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center font-serif text-lg italic text-gold-dark">{c.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-xs text-navy/55">
                      {c.productCount ?? 0} product{c.productCount === 1 ? '' : 's'} · <span className="font-mono">/{c.slug}</span>
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
                    <button type="button" onClick={() => toggleMutation.mutate(c)} title={c.isActive ? 'Hide from shop' : 'Show in shop'}>
                      <ActiveBadge active={c.isActive} />
                    </button>
                    <a
                      href={`/collections/${c.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View in shop"
                      className="flex h-9 w-9 items-center justify-center text-navy/50 hover:text-gold-dark"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button type="button" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`} className="flex h-9 w-9 items-center justify-center bg-navy text-gold hover:bg-gold hover:text-navy">
                      <Pencil size={14} />
                    </button>
                    <button type="button" onClick={() => setDeleting(c)} aria-label={`Delete ${c.name}`} className="flex h-9 w-9 items-center justify-center text-navy/45 hover:text-error">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ))}

      {/* Add / edit */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add collection' : 'Edit collection'}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button variant="gold" loading={saveMutation.isPending} disabled={!form.name.trim()} onClick={() => saveMutation.mutate()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider">Name</span>
            <input value={form.name} maxLength={60} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Arabian Perfume Oils" className={cn(fieldClass, 'h-11')} />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider">Heading</span>
            <select value={form.group} onChange={(e) => setForm((f) => ({ ...f, group: e.target.value as CollectionGroup }))} className={cn(fieldClass, 'h-11')}>
              {COLLECTION_GROUP_ORDER.map((g) => (
                <option key={g} value={g}>{COLLECTION_GROUP_LABELS[g]}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider">
              Description <span className="font-normal normal-case text-navy/50">(optional)</span>
            </span>
            <textarea rows={3} maxLength={300} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={cn(fieldClass, 'py-3')} />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider">
              Image <span className="font-normal normal-case text-navy/50">(shown on the collection card)</span>
            </span>
            <div className="flex items-center gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden border border-navy/10 bg-surface">
                {form.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center text-navy/30"><ImagePlus size={22} /></span>
                )}
              </div>
              <label className="cursor-pointer border border-navy px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-navy hover:text-gold">
                {form.preview ? 'Change image' : 'Upload image'}
                <input type="file" accept={IMAGE_TYPES.join(',')} className="sr-only" onChange={(e) => { pickImage(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 accent-navy" />
            Visible in shop
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete “${deleting?.name}”?`}
        message="Only empty collections can be deleted. To keep it but remove it from the shop, hide it instead."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}