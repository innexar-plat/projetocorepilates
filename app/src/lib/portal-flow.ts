import { SubscriptionStatus } from '@prisma/client';

export type PortalFlowInput = {
  hasPlan: boolean;
  hasBooking: boolean;
  hasPayment: boolean;
  profileCompleted: boolean;
  subscriptionStatus: SubscriptionStatus | null | undefined;
};

export type PortalFlowState = {
  hasActiveSubscription: boolean;
  canStartOnboarding: boolean;
  nextStep: string;
};

export function resolvePortalFlow(input: PortalFlowInput): PortalFlowState {
  const hasActiveSubscription =
    input.subscriptionStatus === SubscriptionStatus.ACTIVE ||
    input.subscriptionStatus === SubscriptionStatus.TRIALING;

  let nextStep = '/portal/dashboard';

  if (!input.hasPlan) {
    nextStep = '/portal/dashboard';
  } else if (!input.profileCompleted) {
    nextStep = '/portal/onboarding';
  } else if (!input.hasBooking) {
    nextStep = '/portal/aulas';
  }

  return {
    hasActiveSubscription,
    canStartOnboarding: input.hasPayment && hasActiveSubscription,
    nextStep,
  };
}