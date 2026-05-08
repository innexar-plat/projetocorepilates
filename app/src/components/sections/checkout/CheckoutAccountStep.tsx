'use client';

import { useEffect, useState } from 'react';
import { getSession, signIn } from 'next-auth/react';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useResource } from '@/hooks/use-resource';
import { authService } from '@/services/auth.service';
import type { Locale } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { buildCheckoutQuery, buildTurmaGroups, fetchCheckoutContext } from '@/utils/checkout-flow';
import { CheckoutStepper } from './CheckoutStepper';

type CheckoutAccountStepProps = {
  planId: string;
  sessionId: string;
  locale: Locale;
};

export function CheckoutAccountStep({ planId, sessionId, locale }: CheckoutAccountStepProps) {
  const t = useTranslations('checkoutFlow');
  const router = useRouter();
  const resource = useResource(() => fetchCheckoutContext(planId), [planId]);
  const turmaGroups = buildTurmaGroups(resource.data?.sessions ?? [], locale);
  const selectedGroup = turmaGroups.find((group) => group.sessions.some((session) => session.id === sessionId));

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    getSession().then((session) => setIsAuthenticated(Boolean(session?.user?.id))).catch(() => undefined);
  }, []);

  async function refreshAuthState() {
    const currentSession = await getSession();
    const authenticated = Boolean(currentSession?.user?.id);

    setIsAuthenticated(authenticated);
    return authenticated;
  }

  async function goToReview() {
    router.push(`/checkout/revisao?${buildCheckoutQuery({ plan: planId, session: sessionId })}`);
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsRegistering(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await authService.register({
        name: registerName,
        email: registerEmail,
        password: registerPassword,
        phone: registerPhone || undefined,
      });

      const signInResult = await signIn('credentials', {
        email: registerEmail,
        password: registerPassword,
        redirect: false,
      });

      if (!signInResult || signInResult.error) {
        throw new Error(t('account.autoLoginError'));
      }

      await refreshAuthState();
      await goToReview();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('account.createError'));
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoggingIn(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const result = await signIn('credentials', {
        email: loginEmail,
        password: loginPassword,
        redirect: false,
      });

      if (!result || result.error) {
        throw new Error(t('account.invalidCredentials'));
      }

      await refreshAuthState();
      await goToReview();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t('account.loginError'));
    } finally {
      setIsLoggingIn(false);
    }
  }

  return (
    <main className="premium-bg mx-auto flex min-h-screen w-full max-w-6xl rounded-3xl px-4 py-8 sm:px-6">
      <div className="w-full space-y-6">
        <CheckoutStepper currentStep="account" />

        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="glass-card rounded-3xl p-6 sm:p-7">
            <Link
              href={`/checkout/turma?${buildCheckoutQuery({ plan: planId })}`}
              locale={locale}
              className="inline-flex items-center rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)] transition-colors hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]"
            >
              {t('account.backClasses')}
            </Link>

            <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{t('steps.account.title')}</p>
            <h1 className="mt-2 text-3xl font-black text-[var(--color-ink)]">{t('account.heading')}</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              {t('account.subtitle')}
            </p>

            {isAuthenticated ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {t('account.authenticatedSuccess')}
                </div>
                <Button type="button" className="w-full sm:w-auto" onClick={goToReview}>
                  {t('account.continueReview')}
                </Button>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <form className="space-y-3" onSubmit={handleRegister}>
                  <h3 className="text-lg font-bold text-[var(--color-ink)]">{t('account.createTitle')}</h3>
                  <Input value={registerName} onChange={(event) => setRegisterName(event.target.value)} placeholder={t('account.namePlaceholder')} required />
                  <Input type="email" value={registerEmail} onChange={(event) => setRegisterEmail(event.target.value)} placeholder={t('account.emailPlaceholder')} required />
                  <Input value={registerPhone} onChange={(event) => setRegisterPhone(event.target.value)} placeholder={t('account.phonePlaceholder')} />
                  <Input type="password" value={registerPassword} onChange={(event) => setRegisterPassword(event.target.value)} placeholder={t('account.passwordPlaceholder')} required />
                  <Button type="submit" className="w-full" disabled={isRegistering}>
                    {isRegistering ? t('account.creating') : t('account.createContinue')}
                  </Button>
                </form>

                <div className="border-t border-[var(--color-border)] pt-5">
                  <form className="space-y-3" onSubmit={handleLogin}>
                    <h3 className="text-lg font-bold text-[var(--color-ink)]">{t('account.loginTitle')}</h3>
                    <Input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder={t('account.emailPlaceholder')} required />
                    <Input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder={t('account.passwordPlaceholder')} required />
                    <Button type="submit" className="w-full" disabled={isLoggingIn}>
                      {isLoggingIn ? t('account.authenticating') : t('account.loginContinue')}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {statusMessage ? (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{statusMessage}</p>
            ) : null}

            {errorMessage ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
            ) : null}
          </section>

          <section className="glass-card rounded-3xl p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">{t('account.summaryLabel')}</p>
            <h2 className="mt-2 text-2xl font-black text-[var(--color-ink)]">{t('account.summaryTitle')}</h2>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{t('account.summarySubtitle')}</p>

            {resource.isLoading ? <p className="mt-5 text-sm text-[var(--color-muted)]">{t('account.loadingSelection')}</p> : null}

            {resource.error ? (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resource.error}</p>
            ) : null}

            {resource.data?.plan ? (
              <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('account.planLabel')}</p>
                <p className="mt-1 text-lg font-bold text-[var(--color-ink)]">{resource.data.plan.name}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{resource.data.plan.description ?? t('account.planFallback')}</p>
              </div>
            ) : null}

            {selectedGroup ? (
              <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]">{t('account.classLabel')}</p>
                <p className="mt-1 text-lg font-bold text-[var(--color-ink)]">{selectedGroup.title}</p>
                <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
                  <p><span className="font-semibold text-[var(--color-ink)]">{t('account.teacherLabel')}:</span> {selectedGroup.instructor}</p>
                  <p><span className="font-semibold text-[var(--color-ink)]">{t('account.daysLabel')}:</span> {selectedGroup.daysLabel}</p>
                  <p><span className="font-semibold text-[var(--color-ink)]">{t('account.timeLabel')}:</span> {selectedGroup.timeLabel}</p>
                  <p><span className="font-semibold text-[var(--color-ink)]">{t('account.nextClassLabel')}:</span> {selectedGroup.nextSessionLabel}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {t('account.classMissing')}
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}