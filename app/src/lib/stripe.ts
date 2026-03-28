import Stripe from 'stripe';
import { stripeLogger } from '@/lib/logger';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

/**
 * Safely invoke a Stripe API call with structured logging.
 * Usage: await stripeCall('create checkout session', () => stripe.checkout.sessions.create(...))
 */
export async function stripeCall<T>(description: string, fn: () => Promise<T>): Promise<T> {
  try {
    const result = await fn();
    stripeLogger.info({ description }, 'Stripe API call succeeded');
    return result;
  } catch (error) {
    stripeLogger.error({ description, err: error }, 'Stripe API call failed');
    throw error;
  }
}

