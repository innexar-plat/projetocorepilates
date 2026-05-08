import { AppShell } from '@/components/layout/AppShell';
import { PortalPaymentsContent } from '@/components/sections/PortalPaymentsContent';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/i18n/routing';

export default async function PortalPaymentsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = await getTranslations('portal');

  const NAV = [
    { href: '/portal/dashboard', label: t('nav.dashboard') },
    { href: '/portal/aulas', label: t('nav.classes') },
    { href: '/portal/pagamentos', label: t('nav.payments') },
    { href: '/portal/suporte', label: t('nav.support') },
  ];

  return (
    <AppShell title={t('title')} locale={locale} nav={NAV}>
      <SectionHeading eyebrow={t('payments.eyebrow')} title={t('payments.title')} subtitle={t('payments.subtitle')} />
      <PortalPaymentsContent />
    </AppShell>
  );
}
