'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import { useResource } from '@/hooks/use-resource';
import { portalService } from '@/services/portal.service';

export function PortalOnboardingContent() {
  const t = useTranslations('portal.onboarding');
  const router = useRouter();

  const profile = useResource(() => portalService.getClientProfile());
  const flow = useResource(() => portalService.getFlowStatus());

  const [emergencyName, setEmergencyName] = useState(profile.data?.emergencyName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile.data?.emergencyPhone ?? '');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [preExistingConditions, setPreExistingConditions] = useState('');
  const [surgeries, setSurgeries] = useState('');
  const [goals, setGoals] = useState('');

  const [liabilityWaiverAccepted, setLiabilityWaiverAccepted] = useState(false);
  const [photoVideoConsent, setPhotoVideoConsent] = useState(false);
  const [dataProcessingConsent, setDataProcessingConsent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onboardingSteps = [
    {
      id: 'checkout',
      title: 'Checkout completed',
      description: 'Plan and first booking completed',
      done: true,
    },
    {
      id: 'payment',
      title: 'Payment approved',
      description: 'Onboarding unlocked after confirmation',
      done: !!flow.data?.canStartOnboarding,
    },
    {
      id: 'profile',
      title: 'Health onboarding',
      description: 'Complete profile and consent forms',
      done: !!(profile.data?.isComplete || flow.data?.profileCompleted),
    },
    {
      id: 'portal',
      title: 'Portal ready',
      description: 'Full dashboard access enabled',
      done: !!(profile.data?.isComplete || flow.data?.profileCompleted),
    },
  ] as const;

  if (flow.isLoading || profile.isLoading) {
    return <Card className="glass-card border-[#9cc8aa]/45 animate-pulse h-32" />;
  }

  if (!flow.data?.canStartOnboarding) {
    return (
      <div className="space-y-5">
        <Card className="glass-card border-[#9cc8aa]/45">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">Journey</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-ink)]">Onboarding steps</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {onboardingSteps.map((step, index) => (
              <div key={step.id} className="rounded-xl border border-[var(--color-border)] bg-white/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">Step {index + 1}</span>
                  <span className={step.done ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700' : 'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700'}>
                    {step.done ? 'Done' : 'Pending'}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-[var(--color-ink)]">{step.title}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card border-[#9cc8aa]/45">
          <p className="text-sm font-semibold text-amber-700">{t('paymentRequired')}</p>
          <Button className="mt-4" onClick={() => router.push('/portal/pagamentos')}>
            {t('goPayments')}
          </Button>
        </Card>
      </div>
    );
  }

  if (profile.data?.isComplete || flow.data?.profileCompleted) {
    return (
      <div className="space-y-5">
        <Card className="glass-card border-[#9cc8aa]/45">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">Journey</p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-ink)]">Onboarding steps</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {onboardingSteps.map((step, index) => (
              <div key={step.id} className="rounded-xl border border-[var(--color-border)] bg-white/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">Step {index + 1}</span>
                  <span className={step.done ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700' : 'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700'}>
                    {step.done ? 'Done' : 'Pending'}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-[var(--color-ink)]">{step.title}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{step.description}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-card border-[#9cc8aa]/45">
          <p className="text-sm font-semibold text-emerald-700">{t('alreadyComplete')}</p>
          <Button className="mt-4" onClick={() => router.push('/portal/dashboard')}>
            {t('goPortal')}
          </Button>
        </Card>
      </div>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await portalService.completeClientProfile({
        emergencyName,
        emergencyPhone,
        emergencyRelation,
        allergies,
        medications,
        preExistingConditions,
        surgeries,
        goals,
        liabilityWaiverAccepted,
        photoVideoConsent,
        dataProcessingConsent,
      });

      setMessage(t('success'));
      router.push('/portal/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="glass-card border-[#9cc8aa]/45">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand)]">Journey</p>
        <h2 className="mt-1 text-xl font-black text-[var(--color-ink)]">Onboarding steps</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {onboardingSteps.map((step, index) => (
            <div key={step.id} className="rounded-xl border border-[var(--color-border)] bg-white/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">Step {index + 1}</span>
                <span className={step.done ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-emerald-700' : 'rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-amber-700'}>
                  {step.done ? 'Done' : 'Pending'}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-[var(--color-ink)]">{step.title}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{step.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass-card border-[#9cc8aa]/45">
        <h2 className="text-2xl font-black text-[var(--color-ink)]">{t('title')}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{t('subtitle')}</p>
      </Card>

      <Card className="glass-card border-[#9cc8aa]/45">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('emergencyName')}</label>
              <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('emergencyPhone')}</label>
              <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('emergencyRelation')}</label>
            <Input value={emergencyRelation} onChange={(e) => setEmergencyRelation(e.target.value)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('allergies')}</label>
              <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-white/80 px-3 py-2 text-sm" rows={3} value={allergies} onChange={(e) => setAllergies(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('medications')}</label>
              <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-white/80 px-3 py-2 text-sm" rows={3} value={medications} onChange={(e) => setMedications(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('conditions')}</label>
              <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-white/80 px-3 py-2 text-sm" rows={3} value={preExistingConditions} onChange={(e) => setPreExistingConditions(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('surgeries')}</label>
              <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-white/80 px-3 py-2 text-sm" rows={3} value={surgeries} onChange={(e) => setSurgeries(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-muted)]">{t('goals')}</label>
            <textarea className="w-full rounded-xl border border-[var(--color-border)] bg-white/80 px-3 py-2 text-sm" rows={3} value={goals} onChange={(e) => setGoals(e.target.value)} />
          </div>

          <div className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-paper)] p-3">
            <label className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
              <input type="checkbox" checked={liabilityWaiverAccepted} onChange={(e) => setLiabilityWaiverAccepted(e.target.checked)} className="mt-1" />
              <span>{t('liability')}</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
              <input type="checkbox" checked={photoVideoConsent} onChange={(e) => setPhotoVideoConsent(e.target.checked)} className="mt-1" />
              <span>{t('photo')}</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
              <input type="checkbox" checked={dataProcessingConsent} onChange={(e) => setDataProcessingConsent(e.target.checked)} className="mt-1" />
              <span>{t('data')}</span>
            </label>
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
