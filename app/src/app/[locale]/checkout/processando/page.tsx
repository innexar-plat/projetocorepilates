import type { Locale } from '@/i18n/routing';
import { CheckoutPaymentProcessingStep } from '@/components/sections/checkout/CheckoutPaymentProcessingStep';

export default async function CheckoutProcessingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;

  return <CheckoutPaymentProcessingStep locale={locale} />;
}