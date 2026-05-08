'use client';

import { FadeIn } from '@/components/atoms/FadeIn';
import { BlogCard } from '@/components/molecules/BlogCard';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { useResource } from '@/hooks/use-resource';
import { websiteService } from '@/services/website.service';

export function BlogContent() {
  const t = useTranslations('blog');
  const locale = useLocale() as Locale;
  const posts = useResource(() => websiteService.listPosts(1, 30));
  const formatter = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });

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
      </FadeIn>

      {/* Cards */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(posts.data ?? []).map((post, i) => (
          <FadeIn key={post.slug} variant="up" delay={((i % 3) + 1) as 1 | 2 | 3}>
            <BlogCard
              slug={post.slug}
              imageUrl={post.coverUrl ?? ''}
              category={t('catAll')}
              title={post.title}
              excerpt={post.excerpt ?? ''}
              author={post.author?.name ?? 'Core Pilates'}
              date={post.publishedAt ? formatter.format(new Date(post.publishedAt)) : formatter.format(new Date(post.createdAt))}
              readMin={6}
              readLabel={t('readMin')}
              locale={locale}
            />
          </FadeIn>
        ))}
      </div>

      {!posts.isLoading && (posts.data?.length ?? 0) === 0 && !posts.error && (
        <p className="mt-8 text-center text-sm text-[var(--color-muted)]">
          {locale === 'pt'
            ? 'Nenhum post publicado no momento.'
            : locale === 'es'
              ? 'No hay publicaciones disponibles en este momento.'
              : 'No published posts are available right now.'}
        </p>
      )}

      {posts.error && (
        <p className="mt-8 text-center text-sm text-red-600">{posts.error}</p>
      )}

      {/* Newsletter CTA */}
      <FadeIn variant="up" className="mt-20 overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-brand)]/10 to-[var(--color-paper-2)] p-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">{t('newsletterEyebrow')}</p>
        <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">{t('newsletterTitle')}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-muted)]">{t('newsletterSub')}</p>
        <div className="mx-auto mt-5 flex max-w-sm gap-2">
          <input
            type="email"
            placeholder={t('newsletterPlaceholder')}
            className="flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
          />
          <button className="rounded-xl bg-[var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-brand-dark)] transition-colors">
            {t('newsletterBtn')}
          </button>
        </div>
      </FadeIn>
    </div>
  );
}
