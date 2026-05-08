import type { Locale } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { CheckoutAccountStep } from '@/components/sections/checkout/CheckoutAccountStep';
import { buildCheckoutQuery } from '@/utils/checkout-flow';

type CheckoutAccountPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ plan?: string; session?: string }>;
};

export default async function CheckoutAccountPage({ params, searchParams }: CheckoutAccountPageProps) {
  const { locale } = await params;
  const { plan, session } = await searchParams;

  if (!plan) {
    redirect(`/${locale}/planos`);
  }

  if (!session) {
    redirect(`/${locale}/checkout/turma?${buildCheckoutQuery({ plan })}`);
  }

  return <CheckoutAccountStep locale={locale} planId={plan} sessionId={session} />;
}