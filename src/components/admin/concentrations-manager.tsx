'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/ui/spinner';
import { ActiveBadge, AdminTitle, ConfirmDialog, ErrorBox, Modal, Panel, fieldClass } from './admin-ui';
import type { ConcentrationOption } from '@/types/concentration';

const KEY = ['admin-concentrations'];

export function ConcentrationsManager() {
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<ConcentrationOption | null>(null);
  const [editName, setEditName] = useState('');
  const [deleting, setDeleting] = useState<ConcentrationOption | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: KEY,
    queryFn: async () => (await api.get<ConcentrationOption[]>('/concentrations/admin')).data,
  });

  const items = useMemo(() => [...(data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [data]);
  const refresh = () => queryClient.invalidateQueries({ queryKey: KEY });

  const createMutation = useMutation({
    mutationFn: async () => api.post('/concentrations', { name: newName.trim() }),
    onSuccess: () => {
      refresh();
      toast.success(`“${newName.trim()}” added`);
      setNewName('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: { name?: string; isActive?: boolean } }) => api.patch(`/concentrations/${id}`, body),
    onSuccess: () => {
      refresh();
      setEditing(null);
      toast.success('Saved');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => (await api.patch<ConcentrationOption[]>('/concentrations/reorder', { ids })).data,
    onSuccess: (list) => queryClient.setQueryData(KEY, list),
    onError: (err) => {
      toast.error(getErrorMessage(err));
      refresh();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (c: ConcentrationOption) => api.delete(`/concentrations/${c._id}`),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success('Deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    queryClient.setQueryData<ConcentrationOption[]>(KEY, next.map((c, i) => ({ ...c, sortOrder: i })));
    reorderMutation.mutate(next.map((c) => c._id));
  };

  if (isLoading) return <PageLoader label="Loading concentrations..." />;
  if (isError) return <ErrorBox message={getErrorMessage(error)} />;

  return (
    <div className="space-y-6">
      <AdminTitle
        title="Concentrations"
        description="Shown in the product form and as filters on the Collections pages. Use the arrows to set the order."
      />

      <Panel title="Add a concentration">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createMutation.mutate();
          }}
          className="flex flex-col gap-2 xs:flex-row"
        >
          <input
            value={newName}
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Oud Intense, Hair Mist"
            className={cn(fieldClass, 'h-11 flex-1')}
          />
          <Button type="submit" variant="gold" loading={createMutation.isPending} disabled={!newName.trim()}>
            <Plus size={16} /> Add
          </Button>
        </form>
      </Panel>

      <Panel title={`All concentrations (${items.length})`} bodyClassName="p-0 sm:p-0">
        {items.length === 0 ? (
          <p className="p-5 text-sm text-navy/55">No concentrations yet.</p>
        ) : (
          <ul className="divide-y divide-navy/10">
            {items.map((c, index) => (
              <li key={c._id} className={cn('flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap sm:p-4', !c.isActive && 'opacity-60')}>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorderMutation.isPending}
                    aria-label={`Move ${c.name} up`}
                    className="flex h-7 w-7 items-center justify-center text-navy/60 hover:bg-gold hover:text-navy disabled:opacity-20"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || reorderMutation.isPending}
                    aria-label={`Move ${c.name} down`}
                    className="flex h-7 w-7 items-center justify-center text-navy/60 hover:bg-gold hover:text-navy disabled:opacity-20"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-navy text-xs font-bold text-gold">{index + 1}</span>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{c.name}</p>
                  <p className="text-xs text-navy/55">
                    {c.productCount ?? 0} product{c.productCount === 1 ? '' : 's'} · <span className="font-mono">{c.slug}</span>
                  </p>
                </div>

                <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate({ id: c._id, body: { isActive: !c.isActive } })}
                    title={c.isActive ? 'Hide' : 'Show'}
                  >
                    <ActiveBadge active={!!c.isActive} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c);
                      setEditName(c.name);
                    }}
                    aria-label={`Rename ${c.name}`}
                    className="flex h-9 w-9 items-center justify-center bg-navy text-gold hover:bg-gold hover:text-navy"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(c)}
                    aria-label={`Delete ${c.name}`}
                    className="flex h-9 w-9 items-center justify-center text-navy/45 hover:text-error"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Rename concentration"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={updateMutation.isPending}>Cancel</Button>
            <Button
              variant="gold"
              loading={updateMutation.isPending}
              disabled={!editName.trim()}
              onClick={() => editing && updateMutation.mutate({ id: editing._id, body: { name: editName.trim() } })}
            >
              Save
            </Button>
          </>
        }
      >
        <input value={editName} maxLength={40} onChange={(e) => setEditName(e.target.value)} className={cn(fieldClass, 'h-11')} />
        <p className="mt-2 text-xs text-navy/55">Products using it update automatically.</p>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete “${deleting?.name}”?`}
        message="Only concentrations no product uses can be deleted. To keep it but remove it from the shop, hide it instead."
        confirmLabel="Delete"
        tone="danger"
        loading={deleteMutation.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </div>
  );
}