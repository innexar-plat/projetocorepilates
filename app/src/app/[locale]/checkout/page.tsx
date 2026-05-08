import type { Locale } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { buildCheckoutQuery } from '@/utils/checkout-flow';

type CheckoutPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ plan?: string; session?: string; checkout?: string }>;
};

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { locale } = await params;
  const { plan, session, checkout } = await searchParams;

  if (checkout === 'success') {
    redirect(`/${locale}/checkout/processando?checkout=success`);
  }

  if (!plan) {
    redirect(`/${locale}/planos`);
  }

  if (session) {
    redirect(`/${locale}/checkout/revisao?${buildCheckoutQuery({ plan, session })}`);
  }

  redirect(`/${locale}/checkout/turma?${buildCheckoutQuery({ plan })}`);
}
