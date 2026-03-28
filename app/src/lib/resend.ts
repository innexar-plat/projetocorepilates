import { Resend } from 'resend';
import type { ReactElement } from 'react';
import { emailLogger } from '@/lib/logger';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  react?: ReactElement;
  html?: string;
}

export async function sendEmail({ to, subject, react, html }: SendEmailParams): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL ?? 'noreply@braziliancorepilates.com';

  const { error } = await resend.emails.send({ from, to, subject, react, html } as any);

  if (error) {
    // Log but never throw — email failure must not break the main flow
    emailLogger.error({ to, subject, err: error }, 'Failed to send email');
  } else {
    emailLogger.info({ to, subject }, 'Email sent');
  }
}
