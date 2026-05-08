'use client';

import { useState, useCallback, type ChangeEvent } from 'react';
import { AdminPageHeader } from '@/components/molecules/AdminPageHeader';
import { ErrorState } from '@/components/molecules/AdminStates';
import { Modal } from '@/components/molecules/Modal';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { useResource } from '@/hooks/use-resource';
import {
  adminService,
  type AdminGalleryImage,
  type CreateGalleryImageDto,
  type AdminGalleryAlbum,
  type CreateGalleryAlbumDto,
} from '@/services/admin.service';
import { useTranslations } from 'next-intl';

const EMPTY_FORM: CreateGalleryImageDto = {
  url: '',
  title: '',
  album: '',
  altText: '',
  order: 0,
  isActive: true,
};

type CreateMode = 'upload' | 'url';

const EMPTY_ALBUM_FORM: CreateGalleryAlbumDto = {
  name: '',
  description: '',
  order: 0,
  isActive: true,
};

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

function Toast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-[#1f2e35] px-5 py-3 text-sm text-white shadow-2xl animate-fade-up">
      {message}
    </div>
  );
}

export function AdminGalleryContent() {
  const t = useTranslations('admin.gallery');
  const tc = useTranslations('admin.common');

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminGalleryImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminGalleryImage | null>(null);
  const [form, setForm] = useState<CreateGalleryImageDto>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [createMode, setCreateMode] = useState<CreateMode>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [activeAlbum, setActiveAlbum] = useState<string>('all');
  const [showAlbumsModal, setShowAlbumsModal] = useState(false);
  const [albumForm, setAlbumForm] = useState<CreateGalleryAlbumDto>(EMPTY_ALBUM_FORM);
  const [albumEditTarget, setAlbumEditTarget] = useState<AdminGalleryAlbum | null>(null);
  const [albumDeleteTarget, setAlbumDeleteTarget] = useState<AdminGalleryAlbum | null>(null);

  const images = useResource(
    () => adminService.listGalleryImages(activeAlbum === 'all' ? undefined : activeAlbum),
    [refreshKey, activeAlbum],
  );

  const albums = useResource(() => adminService.listGalleryAlbums(), [refreshKey, showAlbumsModal]);

  const allAlbums = (
    albums.data?.filter((a) => a.isActive).map((a) => a.name) ??
    Array.from(
      new Set((images.data ?? []).map((img) => img.album?.trim()).filter((v): v is string => !!v)),
    )
  ).sort((a, b) => a.localeCompare(b));

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function setField<K extends keyof CreateGalleryImageDto>(k: K, v: CreateGalleryImageDto[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditTarget(null);
    setCreateMode('upload');
    setFiles([]);
    setShowModal(true);
  }

  function openAlbumsManager() {
    setAlbumForm(EMPTY_ALBUM_FORM);
    setAlbumEditTarget(null);
    setShowAlbumsModal(true);
  }

  function openAlbumEdit(album: AdminGalleryAlbum) {
    setAlbumEditTarget(album);
    setAlbumForm({
      name: album.name,
      description: album.description ?? '',
      order: album.order,
      isActive: album.isActive,
    });
  }

  function openEdit(img: AdminGalleryImage) {
    setForm({
      url: img.url,
      title: img.title ?? '',
      album: img.album ?? '',
      altText: img.altText ?? '',
      order: img.order,
      isActive: img.isActive,
    });
    setEditTarget(img);
    setCreateMode('url');
    setFiles([]);
    setShowModal(true);
  }

  function onFilesSelected(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);

    const invalidTypeFiles = selected.filter((file) => !ALLOWED_UPLOAD_MIME_TYPES.has(file.type));
    const oversizedFiles = selected.filter((file) => file.size > MAX_UPLOAD_SIZE_BYTES);
    const validFiles = selected.filter(
      (file) => ALLOWED_UPLOAD_MIME_TYPES.has(file.type) && file.size <= MAX_UPLOAD_SIZE_BYTES,
    );

    if (invalidTypeFiles.length > 0) {
      showToast(`Formato invalido: ${invalidTypeFiles[0].name}. Use JPG, PNG ou WEBP.`);
    }

    if (oversizedFiles.length > 0) {
      showToast(`Arquivo maior que 5MB: ${oversizedFiles[0].name}.`);
    }

    setFiles(validFiles);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      if (editTarget) {
        await adminService.updateGalleryImage(editTarget.id, form);
        showToast(t('toastUpdated'));
      } else if (createMode === 'upload') {
        if (files.length === 0) {
          showToast(t('toastUploadMissing'));
          return;
        }

        const invalidType = files.find((file) => !ALLOWED_UPLOAD_MIME_TYPES.has(file.type));
        if (invalidType) {
          showToast(`Formato invalido: ${invalidType.name}. Use JPG, PNG ou WEBP.`);
          return;
        }

        const oversized = files.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES);
        if (oversized) {
          showToast(`Arquivo maior que 5MB: ${oversized.name}.`);
          return;
        }

        const result = await adminService.uploadGalleryImages(files, {
          title: form.title,
          album: form.album,
          altText: form.altText,
          order: form.order,
          isActive: form.isActive,
        });

        if (result.failed.length > 0) {
          showToast(t('toastCreatedWithFailures', { created: result.created.length, failed: result.failed.length }));
        } else {
          showToast(t('toastCreatedMany', { count: result.created.length }));
        }
      } else {
        if (!form.url.trim()) {
          showToast(t('toastUrlRequired'));
          return;
        }
        await adminService.createGalleryImage(form);
        showToast(t('toastCreated'));
      }
      setShowModal(false);
      setFiles([]);
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
      await adminService.deleteGalleryImage(deleteTarget.id);
      showToast(t('toastDeleted'));
      setDeleteTarget(null);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('toastDeleteError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAlbumSubmit() {
    setIsSubmitting(true);
    try {
      if (!albumForm.name?.trim()) {
        showToast(t('albumNameRequired'));
        return;
      }

      if (albumEditTarget) {
        await adminService.updateGalleryAlbum(albumEditTarget.id, {
          name: albumForm.name,
          description: albumForm.description,
          order: albumForm.order,
          isActive: albumForm.isActive,
        });
        showToast(t('albumUpdated'));
      } else {
        await adminService.createGalleryAlbum({
          name: albumForm.name,
          description: albumForm.description,
          order: albumForm.order,
          isActive: albumForm.isActive,
        });
        showToast(t('albumCreated'));
      }

      setAlbumForm(EMPTY_ALBUM_FORM);
      setAlbumEditTarget(null);
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('albumSaveError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAlbumDelete() {
    if (!albumDeleteTarget) return;
    setIsSubmitting(true);
    try {
      await adminService.deleteGalleryAlbum(albumDeleteTarget.id);
      showToast(t('albumDeleted'));
      setAlbumDeleteTarget(null);
      if (activeAlbum !== 'all' && activeAlbum === albumDeleteTarget.name) {
        setActiveAlbum('all');
      }
      refresh();
    } catch (e: any) {
      showToast(e.message ?? t('albumDeleteError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={openAlbumsManager}
              className="rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm font-semibold text-[#3c5564] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors"
            >
              {t('manageAlbums')}
            </button>
            <button
              onClick={openCreate}
              className="rounded-xl bg-[#3c8ea8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2f7084] transition-colors"
            >
              {t('newImage')}
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveAlbum('all')}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            activeAlbum === 'all'
              ? 'border-[#3c8ea8] bg-[#3c8ea8] text-white'
              : 'border-[#d4e2e5] bg-white text-[#5f7480] hover:border-[#3c8ea8]'
          }`}
        >
          {t('filterAllAlbums')}
        </button>
        {allAlbums.map((album) => (
          <button
            key={album}
            type="button"
            onClick={() => setActiveAlbum(album)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              activeAlbum === album
                ? 'border-[#3c8ea8] bg-[#3c8ea8] text-white'
                : 'border-[#d4e2e5] bg-white text-[#5f7480] hover:border-[#3c8ea8]'
            }`}
          >
            {album}
          </button>
        ))}
      </div>

      {images.isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-[#d4e2e5]" />
          ))}
        </div>
      )}
      {images.error && <ErrorState message={images.error} />}

      {!images.isLoading && !images.error && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(images.data ?? []).length === 0 && (
            <p className="col-span-full text-center text-sm text-[#5f7480] py-16">{t('noResults')}</p>
          )}
          {(images.data ?? []).map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-[#d4e2e5] bg-[#eef4f6]"
            >
              {/* Image */}
              <img
                src={img.url}
                alt={img.altText ?? img.title ?? ''}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23e3d8b8" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%236f6654" font-size="12">No image</text></svg>';
                }}
              />
              {/* Inactive overlay */}
              {!img.isActive && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs text-white">{tc('inactive')}</span>
                </div>
              )}
              {/* Hover actions */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <button
                  onClick={() => openEdit(img)}
                  className="rounded-lg bg-white/90 px-4 py-1.5 text-xs font-semibold text-[#1f2e35] hover:bg-white transition-colors"
                >
                  {tc('edit')}
                </button>
                <button
                  onClick={() => setDeleteTarget(img)}
                  className="rounded-lg bg-red-500/90 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
                >
                  {tc('delete')}
                </button>
              </div>
              {/* Order badge */}
              <div className="absolute top-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
                #{img.order}
              </div>
              {img.album && (
                <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1f2e35]">
                  {img.album}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        title={editTarget ? t('modalTitleEdit') : t('modalTitleNew')}
        onClose={() => setShowModal(false)}
      >
        <div className="space-y-4">
          {!editTarget && (
            <div className="flex items-center gap-2 rounded-xl border border-[#d4e2e5] bg-[#f7fafb] p-1">
              <button
                type="button"
                onClick={() => setCreateMode('upload')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  createMode === 'upload'
                    ? 'bg-[#3c8ea8] text-white'
                    : 'text-[#3c5564] hover:bg-[#e5eff2]'
                }`}
              >
                {t('modeUpload')}
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('url')}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  createMode === 'url'
                    ? 'bg-[#3c8ea8] text-white'
                    : 'text-[#3c5564] hover:bg-[#e5eff2]'
                }`}
              >
                {t('modeUrl')}
              </button>
            </div>
          )}

          {(editTarget || createMode === 'url') && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
                  {t('fieldUrl')} *
                </label>
                <input
                  className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setField('url', e.target.value)}
                />
              </div>
              {form.url && (
                <div className="overflow-hidden rounded-xl border border-[#d4e2e5]">
                  <img src={form.url} alt="Preview" className="h-40 w-full object-cover" />
                </div>
              )}
            </>
          )}

          {!editTarget && createMode === 'upload' && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
                {t('fieldFiles')} *
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={onFilesSelected}
                className="block w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2 text-sm text-[#1f2e35] file:mr-3 file:rounded-lg file:border-0 file:bg-[#3c8ea8] file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#2f7084]"
              />
              <p className="mt-2 text-xs text-[#5f7480]">{t('uploadHint')}</p>
              {files.length > 0 && (
                <div className="mt-3 rounded-xl border border-[#d4e2e5] bg-[#f7fafb] p-3">
                  <p className="text-sm font-semibold text-[#1f2e35]">
                    {t('selectedFiles', { count: files.length })}
                  </p>
                  <ul className="mt-2 max-h-28 space-y-1 overflow-auto text-xs text-[#4d6470]">
                    {files.map((file) => (
                      <li key={`${file.name}-${file.size}`}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
                {t('fieldTitle')}
              </label>
              <input
                className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
                {t('fieldAlbum')}
              </label>
              <select
                className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
                value={form.album ?? ''}
                onChange={(e) => setField('album', e.target.value)}
              >
                <option value="">-</option>
                {allAlbums.map((album) => (
                  <option key={album} value={album}>
                    {album}
                  </option>
                ))}
                {!!form.album && !allAlbums.includes(form.album) && (
                  <option value={form.album}>{form.album}</option>
                )}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
                {t('fieldOrder')}
              </label>
              <input
                type="number"
                className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
                value={form.order}
                onChange={(e) => setField('order', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">
                {t('fieldAltText')}
              </label>
              <input
                className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
                value={form.altText}
                onChange={(e) => setField('altText', e.target.value)}
              />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setField('isActive', e.target.checked)}
              className="h-4 w-4 accent-[#3c8ea8]"
            />
            <span className="text-sm font-medium text-[#1f2e35]">{t('fieldActive')}</span>
          </label>
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
        message={t('deleteMsg')}
        confirmLabel={tc('delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isSubmitting}
        danger
      />

      <Modal
        open={showAlbumsModal}
        title={t('albumsTitle')}
        onClose={() => {
          setShowAlbumsModal(false);
          setAlbumEditTarget(null);
          setAlbumForm(EMPTY_ALBUM_FORM);
        }}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">{t('albumName')}</label>
              <input
                className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
                value={albumForm.name ?? ''}
                onChange={(e) => setAlbumForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">{t('albumOrder')}</label>
              <input
                type="number"
                className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
                value={albumForm.order ?? 0}
                onChange={(e) => setAlbumForm((f) => ({ ...f, order: Number(e.target.value) }))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#5f7480]">{t('albumDescription')}</label>
            <input
              className="w-full rounded-xl border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] focus:border-[#3c8ea8] focus:outline-none"
              value={albumForm.description ?? ''}
              onChange={(e) => setAlbumForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={albumForm.isActive ?? true}
              onChange={(e) => setAlbumForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4 accent-[#3c8ea8]"
            />
            <span className="text-sm font-medium text-[#1f2e35]">{t('albumActive')}</span>
          </label>

          <div className="flex justify-end gap-2">
            {albumEditTarget && (
              <button
                type="button"
                onClick={() => {
                  setAlbumEditTarget(null);
                  setAlbumForm(EMPTY_ALBUM_FORM);
                }}
                className="rounded-xl border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#eef4f6]"
              >
                {t('albumCancelEdit')}
              </button>
            )}
            <button
              type="button"
              onClick={handleAlbumSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-[#3c8ea8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2f7084] disabled:opacity-60"
            >
              {albumEditTarget ? t('albumUpdate') : t('albumCreate')}
            </button>
          </div>

          <div className="rounded-xl border border-[#d4e2e5] divide-y divide-[#eef4f6]">
            {(albums.data ?? []).length === 0 && (
              <p className="px-4 py-5 text-sm text-[#5f7480]">{t('albumsEmpty')}</p>
            )}
            {(albums.data ?? []).map((album) => (
              <div key={album.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f2e35]">{album.name}</p>
                  <p className="truncate text-xs text-[#8097a3]">{album.description || '-'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!album.isActive && (
                    <span className="rounded-full bg-[#eef4f6] px-2 py-0.5 text-[10px] font-semibold uppercase text-[#5f7480]">
                      {tc('inactive')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => openAlbumEdit(album)}
                    className="rounded-lg border border-[#d4e2e5] px-2.5 py-1 text-xs font-semibold text-[#3c5564] hover:border-[#3c8ea8] hover:text-[#3c8ea8]"
                  >
                    {tc('edit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlbumDeleteTarget(album)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    {tc('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!albumDeleteTarget}
        title={t('albumDeleteTitle')}
        message={t('albumDeleteMsg', { name: albumDeleteTarget?.name ?? '' })}
        confirmLabel={tc('delete')}
        onConfirm={handleAlbumDelete}
        onCancel={() => setAlbumDeleteTarget(null)}
        isLoading={isSubmitting}
        danger
      />

      {toast && <Toast message={toast} />}
    </div>
  );
}

