import { apiClientError } from '@/lib/api';

export async function POST() {
  return apiClientError(
    403,
    'Registration Closed',
    'New account registration is temporarily closed. Please use the pre-registration form instead.',
  );
}
