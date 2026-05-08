'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState, SkeletonTable } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { DataTable } from '@/components/organisms/DataTable';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { useResource } from '@/hooks/use-resource';
import { adminService, type AdminPost, type CreatePostDto } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const EMPTY_FORM: CreatePostDto = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverUrl: '',
  status: 'DRAFT',
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
      {message}
    </div>
  );
}

export function AdminBlogContent() {
  const t = useTranslations('admin.blog');
  const tc = useTranslations('admin.common');

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
  const [form, setForm] = useState<CreatePostDto>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const posts = useResource(() => adminService.listPosts(1, 50, statusFilter || undefined), [refreshKey, statusFilter]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function setField<K extends keyof CreatePostDto>(k: K, v: CreatePostDto[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setShowModal(true);
  }

  function openEdit(p: AdminPost) {
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      content: p.content ?? '',
      coverUrl: p.coverUrl ?? '',
      status: p.status as CreatePostDto['status'],
    });
    setEditTarget(p);
    setShowModal(true);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await adminService.updatePost(editTarget.id, form);
        showToast(t('toastUpdated'));
      } else {
        await adminService.createPost(form);
        showToast(t('toastCreated'));
      }
      setShowModal(false);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await adminService.deletePost(deleteTarget.id);
      showToast(t('toastDeleted'));
      setDeleteTarget(null);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastDeleteError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const STATUS_OPTIONS = [
    { value: '', label: tc('all') },
    { value: 'DRAFT', label: t('statusDraft') },
    { value: 'PUBLISHED', label: t('statusPublished') },
    { value: 'ARCHIVED', label: t('statusArchived') },
  ];

  const columns: { key: keyof AdminPost; label: string; render: (_v: unknown, row: AdminPost) => ReactNode }[] = [
    {
      key: 'title',
      label: t('colTitle'),
      render: (_v, p) => (
        <div>
          <p className="font-medium text-[#1f2e35]">{p.title}</p>
          <p className="text-xs text-[#5f7480]">{p.slug}</p>
        </div>
      ),
    },
    {
      key: 'status',
      label: t('colStatus'),
      render: (_v, p) => (
        <StatusBadge
          label={t(`status${p.status.charAt(0) + p.status.slice(1).toLowerCase()}` as any)}
          variant={p.status === 'PUBLISHED' ? 'success' : p.status === 'DRAFT' ? 'warning' : 'neutral'}
        />
      ),
    },
    {
      key: 'author',
      label: t('colAuthor'),
      render: (_v, p) => <span className="text-sm text-[#5f7480]">{p.author?.name ?? '-'}</span>,
    },
    {
      key: 'publishedAt',
      label: t('colPublishedAt'),
      render: (_v, p) => (
        <span className="text-sm text-[#5f7480]">
          {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: tc('actions'),
      render: (_v, p) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(p)}
            className="rounded-lg border border-[#d4e2e5] px-3 py-1.5 text-xs font-medium text-[#5f7480] hover:bg-[#eef4f6] transition-colors"
          >
            {tc('edit')}
          </button>
          <button
            onClick={() => setDeleteTarget(p)}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            {tc('delete')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <button
            onClick={openCreate}
            className="rounded-xl bg-[#3c8ea8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2f7084] transition-colors"
          >
            {t('newPost')}
          </button>
        }
      />

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-[#3c8ea8] text-white'
                : 'border border-[#d4e2e5] text-[#5f7480] hover:bg-[#eef4f6]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {posts.isLoading && <SkeletonTable rows={6} cols={5} />}
      {posts.error && <ErrorState message={posts.error} />}
      {!posts.isLoading && !posts.error && (
        <DataTable
          columns={columns as any}
          rows={posts.data ?? []}
          keyField="id"
          emptyText={t('noResults')}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        title={editTarget ? t('modalTitleEdit') : t('modalTitleNew')}
        onClose={() => setShowModal(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
              {t('fieldTitle')} *
            </label>
            <input
              className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
              value={form.title}
              onChange={(e) => {
                setField('title', e.target.value);
                if (!editTarget) setField('slug', slugify(e.target.value));
              }}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
              {t('fieldSlug')} *
            </label>
            <input
              className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm font-mono text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
              value={form.slug}
              onChange={(e) => setField('slug', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
              {t('fieldExcerpt')}
            </label>
            <textarea
              rows={2}
              className="w-full resize-none rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
              value={form.excerpt}
              onChange={(e) => setField('excerpt', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
              {t('fieldContent')} *
            </label>
            <textarea
              rows={8}
              className="w-full resize-y rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
              value={form.content}
              onChange={(e) => setField('content', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
              {t('fieldCoverUrl')}
            </label>
            <input
              className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
              placeholder="https://..."
              value={form.coverUrl}
              onChange={(e) => setField('coverUrl', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
              {t('fieldStatus')}
            </label>
            <select
              className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
              value={form.status}
              onChange={(e) => setField('status', e.target.value as CreatePostDto['status'])}
            >
              <option value="DRAFT">{t('statusDraft')}</option>
              <option value="PUBLISHED">{t('statusPublished')}</option>
              <option value="ARCHIVED">{t('statusArchived')}</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowModal(false)}
            className="rounded-xl border border-[#d4e2e5] px-5 py-2.5 text-sm text-[#5f7480] hover:bg-[#eef4f6]"
          >
            {tc('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-xl bg-[#3c8ea8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2f7084] disabled:opacity-60 transition-colors"
          >
            {isSubmitting ? tc('saving') : tc('save')}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={t('deleteTitle')}
        message={t('deleteMsg', { title: deleteTarget?.title ?? '' })}
        confirmLabel={tc('delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isSubmitting}
        danger
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}

