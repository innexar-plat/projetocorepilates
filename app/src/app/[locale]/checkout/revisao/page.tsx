import type { Locale } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { CheckoutReviewStep } from '@/components/sections/checkout/CheckoutReviewStep';
import { buildCheckoutQuery } from '@/utils/checkout-flow';

type CheckoutReviewPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ plan?: string; session?: string }>;
};

export default async function CheckoutReviewPage({ params, searchParams }: CheckoutReviewPageProps) {
  const { locale } = await params;
  const { plan, session } = await searchParams;

  if (!plan) {
    redirect(`/${locale}/planos`);
  }

  if (!session) {
    redirect(`/${locale}/checkout/turma?${buildCheckoutQuery({ plan })}`);
  }

  return <CheckoutReviewStep locale={locale} planId={plan} sessionId={session} />;
}