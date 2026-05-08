'use client';

import { useMemo, useState } from 'react';
import { FadeIn } from '@/components/atoms/FadeIn';
import { useTranslations } from 'next-intl';
import { useResource } from '@/hooks/use-resource';
import { websiteService } from '@/services/website.service';
import { useLocale } from 'next-intl';

const PILATES_FALLBACK = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80';

const ASPECTS = ['square', 'tall', 'wide'] as const;

export function GalleryContent() {
  const t = useTranslations('gallery');
  const locale = useLocale();
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [activeAlbum, setActiveAlbum] = useState<string>('all');
  const images = useResource(() => websiteService.listGalleryImages());
  const albumsResource = useResource(() => websiteService.listGalleryAlbums());

  const items = useMemo(() => images.data ?? [], [images.data]);
  const albums = useMemo(() => albumsResource.data ?? [], [albumsResource.data]);

  const photoWord = locale === 'pt' ? 'fotos' : locale === 'es' ? 'fotos' : 'photos';
  const albumWord = locale === 'pt' ? 'albuns' : locale === 'es' ? 'albumes' : 'albums';

  const albumCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const key = item.album?.trim();
      if (!key) continue;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const visibleAlbums = useMemo(
    () => albums.filter((album) => (albumCountMap.get(album.name) ?? 0) > 0),
    [albums, albumCountMap],
  );

  const filteredItems = useMemo(
    () => (activeAlbum === 'all' ? items : items.filter((item) => item.album === activeAlbum)),
    [activeAlbum, items],
  );
  const lightboxItem = filteredItems.find((i) => i.id === lightbox);

  return (
    <div className="premium-bg mx-auto w-full max-w-7xl rounded-3xl px-4 py-16 sm:px-6">
      {/* Header */}
      <FadeIn variant="up" className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
          {t('eyebrow')}
        </p>
        <h1 className="mt-2 text-4xl font-black text-[var(--color-ink)] sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-[var(--color-muted)]">
          {t('subtitle')}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
            {items.length} {photoWord}
          </span>
          <span className="rounded-full border border-[var(--color-border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--color-muted)]">
            {visibleAlbums.length || 1} {albumWord}
          </span>
        </div>
      </FadeIn>

      <FadeIn variant="up" delay={2} className="mt-8 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => setActiveAlbum('all')}
          className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
            activeAlbum === 'all'
              ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
              : 'border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-brand)]'
          }`}
        >
          {t('filterAll')} ({items.length})
        </button>
        {visibleAlbums.map((album) => (
          <button
            key={album.id}
            type="button"
            onClick={() => setActiveAlbum(album.name)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
              activeAlbum === album.name
                ? 'border-[var(--color-brand)] bg-[var(--color-brand)] text-white'
                : 'border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-brand)]'
            }`}
          >
            {album.name} ({albumCountMap.get(album.name) ?? 0})
          </button>
        ))}
      </FadeIn>

      {/* Grid */}
      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map((item, i) => {
          const aspect = ASPECTS[i % ASPECTS.length];
          return (
          <FadeIn
            key={item.id}
            variant="scale"
            delay={((i % 4) + 1) as 1 | 2 | 3 | 4}
            className={`img-zoom cursor-pointer rounded-2xl ${
              aspect === 'tall'   ? 'row-span-2' :
              aspect === 'wide'   ? 'col-span-2' : ''
            }`}
          >
            <div
              onClick={() => setLightbox(item.id)}
              className="img-zoom soft-glow flex h-full min-h-[160px] items-center justify-center rounded-2xl border border-[var(--color-border)]/40 group relative overflow-hidden"
            >
              <img
                src={item.url}
                alt={item.altText ?? item.title ?? 'Core Pilates gallery'}
                className="img-inner h-full w-full object-cover transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.src !== PILATES_FALLBACK) img.src = PILATES_FALLBACK;
                }}
              />
              {/* overlay */}
              <div className="absolute inset-0 flex items-end rounded-2xl bg-gradient-to-t from-black/30 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="flex flex-col items-start gap-1">
                  <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-[var(--color-ink)]">
                    {item.title || t('title')}
                  </span>
                  {item.album && (
                    <span className="rounded-lg bg-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      {item.album}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
          );
        })}
      </div>

      {!images.isLoading && filteredItems.length === 0 && !images.error && (
        <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
          {locale === 'pt'
            ? 'Nenhuma imagem disponivel na galeria agora.'
            : locale === 'es'
              ? 'No hay imagenes disponibles en la galeria ahora.'
              : 'No gallery images available right now.'}
        </p>
      )}

      {images.error && (
        <p className="mt-8 text-center text-sm text-red-600">{images.error}</p>
      )}

      {/* Lightbox */}
      {lightbox !== null && lightboxItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="site-scale glass-card relative w-full max-w-2xl rounded-3xl p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-paper-2)] transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={lightboxItem.url}
              alt="Core Pilates large gallery"
              className="h-[70vh] w-full rounded-2xl object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src !== PILATES_FALLBACK) img.src = PILATES_FALLBACK;
              }}
            />
            <p className="mt-4 text-center text-xs font-bold uppercase tracking-wide text-[var(--color-brand)]">
              {lightboxItem.title || t('title')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
