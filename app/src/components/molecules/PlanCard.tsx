import { Link } from '@/i18n/navigation';
import { cn } from '@/utils/cn';
import type { Locale } from '@/i18n/routing';

interface PlanCardProps {
  name: string;
  description: string | null;
  price: number | string;
  isPromotion?: boolean;
  originalPrice?: number | string | null;
  promotionalPrice?: number | string | null;
  classesPerMonth: number;
  featured?: boolean;
  ctaLabel: string;
  unlimitedLabel: string;
  classesLabel: string;
  perMonthLabel: string;
  locale: Locale;
  planId: string;
}

export function PlanCard({
  name,
  description,
  price,
  isPromotion,
  originalPrice,
  promotionalPrice,
  classesPerMonth,
  featured,
  ctaLabel,
  unlimitedLabel,
  classesLabel,
  perMonthLabel,
  locale,
  planId,
}: PlanCardProps) {
  const numericPrice = Number(price);
  const numericPromotional = Number(promotionalPrice);
  const numericOriginal = Number(originalPrice);

  const displayPrice =
    isPromotion && Number.isFinite(numericPromotional)
      ? numericPromotional
      : Number.isFinite(numericPrice)
        ? numericPrice
        : 0;

  const showOriginalPrice =
    Boolean(isPromotion) &&
    Number.isFinite(numericOriginal) &&
    numericOriginal > displayPrice;

  return (
    <div
      className={cn(
        'card-lift glass-card relative flex flex-col rounded-2xl p-7 transition-all duration-300',
        featured
          ? 'ring-2 ring-[var(--color-brand)]/35'
          : 'hover:border-[var(--color-brand)]/50',
      )}
    >
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-brand)] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-[var(--color-brand)]/35">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 17.3l-6.18 3.73 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.76 1.64 7.03z" />
            </svg>
            Most Popular
          </span>
        </div>
      )}

      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">
        {classesPerMonth >= 999 ? unlimitedLabel : classesLabel.replace('{count}', String(classesPerMonth))}
      </p>
      <h3 className="mt-1.5 text-xl font-black text-[var(--color-ink)]">{name}</h3>
      {description && (
        <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
      )}

      <div className="mt-5 flex items-end gap-2">
        {showOriginalPrice && (
          <span className="text-lg font-semibold text-[var(--color-muted)] line-through">
            ${numericOriginal.toFixed(0)}
          </span>
        )}
        <span className="text-4xl font-black tracking-tight text-[var(--color-ink)]">
          ${displayPrice.toFixed(0)}
        </span>
        <span className="mb-1 text-sm text-[var(--color-muted)]">{perMonthLabel}</span>
      </div>

      {Boolean(isPromotion) && (
        <span className="mt-2 inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
          Promo
        </span>
      )}

      <div className="my-5 border-t border-[var(--color-border)]" />

      <ul className="flex-1 space-y-2.5 text-sm text-[var(--color-muted)]">
        <li className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          {classesPerMonth >= 999 ? unlimitedLabel : classesLabel.replace('{count}', String(classesPerMonth))}
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Expert instructors
        </li>
        <li className="flex items-center gap-2">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand)]/15 text-[var(--color-brand)]">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
          Online booking
        </li>
      </ul>

      <Link
        href={`/checkout/turma?plan=${planId}`}
        locale={locale}
        className={cn(
          'mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition-all duration-200',
          featured
            ? 'bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/30 hover:bg-[var(--color-brand-dark)] hover:shadow-lg'
            : 'border border-[var(--color-brand)] text-[var(--color-brand)] hover:bg-[var(--color-brand)] hover:text-white',
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
