'use client';

import { SimpleTable } from '@/components/organisms/SimpleTable';
import { useResource } from '@/hooks/use-resource';
import { portalService } from '@/services/portal.service';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

export function PortalPaymentsContent() {
  const t = useTranslations('portal.payments');
  const locale = useLocale();
  const payments = useResource(() => portalService.getPayments());

  const formatAmount = (amount: number, currency?: string) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: (currency ?? 'USD').toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));

  const inferType = (description: string | null) => {
    const normalized = (description ?? '').toLowerCase();

    if (normalized.includes('checkout')) return t('typeCheckout');
    if (normalized.includes('subscription')) return t('typeSubscription');

    return t('typeOther');
  };

  const formatReference = (invoiceId?: string | null) => {
    if (!invoiceId) return t('notAvailable');
    return `${invoiceId.slice(0, 14)}...`;
  };

  if (payments.isLoading) return <p>{t('loading')}</p>;
  if (payments.error) return <p className="text-red-600">{payments.error}</p>;

  return (
    <SimpleTable
      title={t('historyCount', { count: payments.data?.total ?? 0 })}
      rows={(payments.data?.data ?? []).map((item) => ({
        type: inferType(item.description),
        description: item.description ?? t('defaultDescription'),
        amount: formatAmount(Number(item.amount), item.currency),
        date: formatDate(item.createdAt),
        reference: formatReference(item.stripeInvoiceId),
        status: item.status,
      }))}
      columns={[
        { key: 'type', label: t('type') },
        { key: 'description', label: t('description') },
        { key: 'amount', label: t('amount') },
        { key: 'date', label: t('date') },
        { key: 'reference', label: t('reference') },
        { key: 'status', label: t('status') },
      ]}
    />
  );
}
