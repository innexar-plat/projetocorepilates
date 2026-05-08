import { Link } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const BLOG_FALLBACK = 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1600&q=80';

interface BlogCardProps {
  slug: string;
  imageUrl: string;
  category: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readMin: number;
  readLabel: string;
  locale: Locale;
}

export function BlogCard({
  slug,
  imageUrl,
  category,
  title,
  excerpt,
  author,
  date,
  readMin,
  readLabel,
  locale,
}: BlogCardProps) {
  return (
    <article className="card-lift glass-card group flex flex-col rounded-2xl overflow-hidden">
      {/* Cover */}
      <div className="img-zoom relative h-48">
        <img
          src={imageUrl}
          alt={title}
          className="img-inner h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            if (img.src !== BLOG_FALLBACK) img.src = BLOG_FALLBACK;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <span className="absolute left-3 top-3 inline-block rounded-full bg-white/85 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink)]">
          {category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-brand)] transition-colors">
          {title}
        </h3>
        <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">
          {excerpt}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-paper-2)] text-[var(--color-brand)]">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 14a4 4 0 10-8 0m8 0a4 4 0 118 0m-8 0H8m8 0v1a3 3 0 11-6 0v-1m6 0H8" />
              </svg>
            </div>
            <span className="text-xs font-medium text-[var(--color-muted)]">{author}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
            <span>{date}</span>
            <span>·</span>
            <span>{readMin} min {readLabel}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
