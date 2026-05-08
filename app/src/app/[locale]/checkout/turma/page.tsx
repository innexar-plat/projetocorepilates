import type { Locale } from '@/i18n/routing';
import { redirect } from 'next/navigation';
import { CheckoutClassStep } from '@/components/sections/checkout/CheckoutClassStep';

type CheckoutClassPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ plan?: string }>;
};

export default async function CheckoutClassPage({ params, searchParams }: CheckoutClassPageProps) {
  const { locale } = await params;
  const { plan } = await searchParams;

  if (!plan) {
    redirect(`/${locale}/planos`);
  }

  return <CheckoutClassStep locale={locale} planId={plan} />;
}