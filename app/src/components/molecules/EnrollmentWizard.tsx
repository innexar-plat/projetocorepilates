'use client';

import { useState, type ReactNode } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { adminService, type AdminPlan } from '@/services/admin.service';
import { useTranslations } from 'next-intl';

// Shared styles

const FIELD =
  'w-full rounded-lg border border-[#d4e2e5] bg-white px-4 py-2.5 text-sm text-[#1f2e35] placeholder-[#90a4af] outline-none focus:border-[#3c8ea8] focus:ring-2 focus:ring-[#3c8ea8]/20';
const LABEL = 'block text-xs font-medium text-[#5f7480] mb-1';
const SECTION = 'space-y-4';

// Step label map
// Built inside the component using translations (see EnrollmentWizard)

// Types

type FormData = {
  // Step 1 - Account
  name: string;
  email: string;
  password: string;
  phone: string;
  // Step 2 - Personal
  dateOfBirth: string;
  gender: string;
  street: string;
  complement: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  // Step 3 - Emergency Contact
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  // Step 4 - Health History
  allergies: string;
  medications: string;
  preExistingConditions: string;
  surgeries: string;
  // Step 5 - PAR-Q
  parqHeartCondition: boolean;
  parqChestPainActivity: boolean;
  parqChestPainRest: boolean;
  parqDizziness: boolean;
  parqBoneJoint: boolean;
  parqBloodPressureMeds: boolean;
  parqOtherReason: boolean;
  parqNotes: string;
  physicianClearance: boolean;
  physicianName: string;
  physicianPhone: string;
  // Step 6 - Plan & Payment
  planId: string;
  paymentMethod: 'cash' | 'stripe' | '';
  // Consents
  liabilityWaiverAccepted: boolean;
  photoVideoConsent: boolean;
  dataProcessingConsent: boolean;
};

const INITIAL: FormData = {
  name: '', email: '', password: '', phone: '',
  dateOfBirth: '', gender: '', street: '', complement: '', city: '', state: '', zipCode: '', country: 'US',
  emergencyName: '', emergencyPhone: '', emergencyRelation: '',
  allergies: '', medications: '', preExistingConditions: '', surgeries: '',
  parqHeartCondition: false, parqChestPainActivity: false, parqChestPainRest: false,
  parqDizziness: false, parqBoneJoint: false, parqBloodPressureMeds: false,
  parqOtherReason: false, parqNotes: '', physicianClearance: false, physicianName: '', physicianPhone: '',
  planId: '', paymentMethod: '',
  liabilityWaiverAccepted: false, photoVideoConsent: false, dataProcessingConsent: false,
};

// Sub-components

function IconAlert({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 9v5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconBanknote({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M7 9h.01M17 15h.01" />
    </svg>
  );
}

function IconCard({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function IconCheckCircle({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.2 2.2 4.8-4.8" />
    </svg>
  );
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-red-500">{msg}</p>;
}

function ParqQuestion({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-[#d4e2e5] bg-white p-3">
      <div className="flex gap-4 shrink-0 pt-0.5">
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input type="radio" checked={!value} onChange={() => onChange(false)} className="accent-[#3c8ea8]" />
          <span className="text-[#1f2e35]">No</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer text-sm">
          <input type="radio" checked={value} onChange={() => onChange(true)} className={`accent-red-500`} />
          <span className={value ? 'text-red-600 font-medium' : 'text-[#1f2e35]'}>Yes</span>
        </label>
      </div>
      <p className="text-sm text-[#1f2e35] leading-snug">{label}</p>
    </div>
  );
}

// Step progress indicator

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < current ? 'bg-[#3c8ea8]' : i === current ? 'bg-[#3c8ea8]/60' : 'bg-[#d4e2e5]'
          }`}
        />
      ))}
      <span className="ml-2 text-xs text-[#8097a3] shrink-0">
        {current + 1}/{total}
      </span>
    </div>
  );
}

// Main wizard component

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: (name: string) => void;
  plans: AdminPlan[];
};

export function EnrollmentWizard({ open, onClose, onSuccess, plans }: Props) {
  const t = useTranslations('admin.enrollment');

  const STEPS = [
    t('steps.account'), t('steps.personal'), t('steps.emergency'),
    t('steps.health'), t('steps.parq'), t('steps.plan'), t('steps.confirm'),
  ];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};

    if (step === 0) {
      if (!form.name.trim() || form.name.length < 2) e.name = 'Name must be at least 2 characters';
      if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email';
      if (form.password.length < 8) e.password = 'Minimum 8 characters';
      else if (!form.password.match(/[A-Z]/)) e.password = 'Must contain at least one uppercase letter';
      else if (!form.password.match(/[0-9]/)) e.password = 'Must contain at least one number';
    }
    if (step === 2) {
      if (!form.emergencyName.trim()) e.emergencyName = 'Required';
      if (!form.emergencyPhone.trim()) e.emergencyPhone = 'Required';
    }
    if (step === 4) {
      const anyParq = form.parqHeartCondition || form.parqChestPainActivity || form.parqChestPainRest ||
        form.parqDizziness || form.parqBoneJoint || form.parqBloodPressureMeds || form.parqOtherReason;
      if (anyParq && !form.physicianClearance) {
        e.physicianClearance = 'Physician clearance required when any PAR-Q answer is YES';
      }
    }
    if (step === 5) {
      if (!form.planId) e.planId = 'Select a plan';
      if (!form.paymentMethod) e.paymentMethod = 'Select a payment method';
      if (!form.liabilityWaiverAccepted) e.liabilityWaiverAccepted = 'Client must accept the liability waiver';
      if (!form.dataProcessingConsent) e.dataProcessingConsent = 'Data processing consent required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;

    // Step 0: create user account immediately
    if (step === 0 && !createdUserId) {
      setIsSubmitting(true);
      try {
        const user = await adminService.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
        });
        setCreatedUserId((user as any).id ?? (user as any).data?.id);
      } catch (e: any) {
        const msg = String(e.message ?? '');
        if (msg.toLowerCase().includes('email')) {
          setErrors({ email: 'This email is already in use' });
        } else {
          setErrors({ name: msg || 'Error creating account' });
        }
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
    }

    setStep((s) => s + 1);
  }

  async function handleFinish() {
    if (!validate() || !createdUserId) return;
    setIsSubmitting(true);

    try {
      // Save full client profile
      await adminService.updateClientProfile(createdUserId, {
        dateOfBirth: form.dateOfBirth || undefined,
        gender: (form.gender as any) || undefined,
        street: form.street || undefined,
        complement: form.complement || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode || undefined,
        country: form.country || 'US',
        emergencyName: form.emergencyName || undefined,
        emergencyPhone: form.emergencyPhone || undefined,
        emergencyRelation: form.emergencyRelation || undefined,
        allergies: form.allergies || undefined,
        medications: form.medications || undefined,
        preExistingConditions: form.preExistingConditions || undefined,
        surgeries: form.surgeries || undefined,
        parqHeartCondition: form.parqHeartCondition,
        parqChestPainActivity: form.parqChestPainActivity,
        parqChestPainRest: form.parqChestPainRest,
        parqDizziness: form.parqDizziness,
        parqBoneJoint: form.parqBoneJoint,
        parqBloodPressureMeds: form.parqBloodPressureMeds,
        parqOtherReason: form.parqOtherReason,
        parqNotes: form.parqNotes || undefined,
        physicianClearance: form.physicianClearance,
        physicianName: form.physicianName || undefined,
        physicianPhone: form.physicianPhone || undefined,
        liabilityWaiverAccepted: form.liabilityWaiverAccepted,
        photoVideoConsent: form.photoVideoConsent,
        dataProcessingConsent: form.dataProcessingConsent,
      });

      // Process payment
      if (form.paymentMethod === 'cash') {
        await adminService.createManualSubscription(createdUserId, form.planId);
        setDone(true);
        onSuccess(form.name);
      } else {
        const result = await adminService.createCheckoutLink(createdUserId, form.planId);
        setCheckoutUrl(result.url);
        setDone(true);
      }
    } catch (e: any) {
      setErrors({ name: e.message ?? 'Error completing enrollment' });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setStep(0);
    setForm(INITIAL);
    setErrors({});
    setCreatedUserId(null);
    setCheckoutUrl(null);
    setDone(false);
    onClose();
  }

  const anyParq =
    form.parqHeartCondition || form.parqChestPainActivity || form.parqChestPainRest ||
    form.parqDizziness || form.parqBoneJoint || form.parqBloodPressureMeds || form.parqOtherReason;

  return (
    <Modal
      title={done ? t('doneTitle') : t('title', { step: STEPS[step] })}
      open={open}
      onClose={handleClose}
      size="lg"
      footer={
        done ? (
          <button
            onClick={handleClose}
            className="rounded-lg bg-[#3c8ea8] px-5 py-2 text-sm font-medium text-white hover:bg-[#367f96]"
          >
            {t('btnClose')}
          </button>
        ) : (
          <>
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                disabled={isSubmitting}
                className="rounded-lg border border-[#d4e2e5] px-4 py-2 text-sm text-[#5f7480] hover:bg-[#f3f8fa] disabled:opacity-50"
              >
                {t('btnBack')}
              </button>
            )}
            <button
              onClick={() => {
                if (step === 6) handleFinish();
                else void handleNext();
              }}
              disabled={isSubmitting}
              className="rounded-lg bg-[#3c8ea8] px-5 py-2 text-sm font-medium text-white hover:bg-[#367f96] disabled:opacity-50"
            >
              {isSubmitting ? t('btnWait') : step === 6 ? t('btnConfirm') : t('btnNext')}
            </button>
          </>
        )
      }
    >
      {done ? (
        <DoneStep
          name={form.name}
          paymentMethod={form.paymentMethod as 'cash' | 'stripe'}
          checkoutUrl={checkoutUrl}
          planName={plans.find((p) => p.id === form.planId)?.name ?? ''}
        />
      ) : (
        <>
          <StepIndicator current={step} total={STEPS.length} />
          {step === 0 && <Step1Account form={form} set={set} errors={errors} />}
          {step === 1 && <Step2Personal form={form} set={set} errors={errors} />}
          {step === 2 && <Step3Emergency form={form} set={set} errors={errors} />}
          {step === 3 && <Step4Health form={form} set={set} errors={errors} />}
          {step === 4 && <Step5Parq form={form} set={set} errors={errors} anyParq={anyParq} />}
          {step === 5 && <Step6Plan form={form} set={set} errors={errors} plans={plans} />}
          {step === 6 && <Step7Review form={form} plans={plans} />}
        </>
      )}
    </Modal>
  );
}

// Steps

type StepProps = {
  form: FormData;
  set: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
  errors: Partial<Record<keyof FormData, string>>;
};

function Step1Account({ form, set, errors }: StepProps) {
  return (
    <div className={SECTION}>
      <p className="text-sm text-[#5f7480]">Basic account information. The client can update their password later.</p>
      <div>
        <label className={LABEL}>Full Name *</label>
        <input className={FIELD} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Maria Silva" />
        <FieldErr msg={errors.name} />
      </div>
      <div>
        <label className={LABEL}>Email *</label>
        <input type="email" className={FIELD} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="maria@email.com" />
        <FieldErr msg={errors.email} />
      </div>
      <div>
        <label className={LABEL}>Password *</label>
        <input type="password" className={FIELD} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 chars, 1 uppercase, 1 number" />
        <FieldErr msg={errors.password} />
      </div>
      <div>
        <label className={LABEL}>Phone</label>
        <input className={FIELD} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
      </div>
    </div>
  );
}

function Step2Personal({ form, set }: StepProps) {
  return (
    <div className={SECTION}>
      <p className="text-sm text-[#5f7480]">Personal details and address. Required for legal documentation.</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Date of Birth</label>
          <input type="date" className={FIELD} value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
        </div>
        <div>
          <label className={LABEL}>Gender</label>
          <select className={FIELD} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">Select...</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </div>
      </div>
      <div>
        <label className={LABEL}>Street Address</label>
        <input className={FIELD} value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="123 Main St" />
      </div>
      <div>
        <label className={LABEL}>Apt / Suite / Unit</label>
        <input className={FIELD} value={form.complement} onChange={(e) => set('complement', e.target.value)} placeholder="Apt 4B" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className={LABEL}>City</label>
          <input className={FIELD} value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Miami" />
        </div>
        <div>
          <label className={LABEL}>State</label>
          <input className={FIELD} value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="FL" maxLength={2} />
        </div>
        <div>
          <label className={LABEL}>ZIP Code</label>
          <input className={FIELD} value={form.zipCode} onChange={(e) => set('zipCode', e.target.value)} placeholder="33101" />
        </div>
      </div>
    </div>
  );
}

function Step3Emergency({ form, set, errors }: StepProps) {
  return (
    <div className={SECTION}>
      <p className="text-sm text-[#5f7480]">Emergency contact - required for all studio members.</p>
      <div>
        <label className={LABEL}>Emergency Contact Name *</label>
        <input className={FIELD} value={form.emergencyName} onChange={(e) => set('emergencyName', e.target.value)} placeholder="John Silva" />
        <FieldErr msg={errors.emergencyName} />
      </div>
      <div>
        <label className={LABEL}>Emergency Contact Phone *</label>
        <input className={FIELD} value={form.emergencyPhone} onChange={(e) => set('emergencyPhone', e.target.value)} placeholder="+1 (555) 000-0000" />
        <FieldErr msg={errors.emergencyPhone} />
      </div>
      <div>
        <label className={LABEL}>Relationship</label>
        <input className={FIELD} value={form.emergencyRelation} onChange={(e) => set('emergencyRelation', e.target.value)} placeholder="Spouse, Parent, Friend..." />
      </div>
    </div>
  );
}

function Step4Health({ form, set }: StepProps) {
  const textarea = `${FIELD} resize-none`;
  return (
    <div className={SECTION}>
      <p className="text-sm text-[#5f7480]">Health history for instructor awareness and client safety. Leave blank if not applicable.</p>
      <div>
        <label className={LABEL}>Allergies</label>
        <textarea rows={2} className={textarea} value={form.allergies} onChange={(e) => set('allergies', e.target.value)} placeholder="Food, medication, environmental allergies..." />
      </div>
      <div>
        <label className={LABEL}>Current Medications</label>
        <textarea rows={2} className={textarea} value={form.medications} onChange={(e) => set('medications', e.target.value)} placeholder="List any medications currently taking..." />
      </div>
      <div>
        <label className={LABEL}>Pre-existing Conditions</label>
        <textarea rows={2} className={textarea} value={form.preExistingConditions} onChange={(e) => set('preExistingConditions', e.target.value)} placeholder="Diabetes, hypertension, asthma, etc." />
      </div>
      <div>
        <label className={LABEL}>Previous Surgeries / Injuries</label>
        <textarea rows={2} className={textarea} value={form.surgeries} onChange={(e) => set('surgeries', e.target.value)} placeholder="Knee replacement 2022, shoulder surgery..." />
      </div>
    </div>
  );
}

function Step5Parq({ form, set, errors, anyParq }: StepProps & { anyParq: boolean }) {
  return (
    <div className={SECTION}>
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        <strong className="inline-flex items-center gap-1.5"><IconAlert className="h-4 w-4" /> PAR-Q - Physical Activity Readiness Questionnaire</strong><br />
        If the client answers YES to any question, physician clearance is required before starting the program.
      </div>
      <ParqQuestion label="Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?" value={form.parqHeartCondition} onChange={(v) => set('parqHeartCondition', v)} />
      <ParqQuestion label="Do you feel pain in your chest when you do physical activity?" value={form.parqChestPainActivity} onChange={(v) => set('parqChestPainActivity', v)} />
      <ParqQuestion label="In the past month, have you had chest pain when you were not doing physical activity?" value={form.parqChestPainRest} onChange={(v) => set('parqChestPainRest', v)} />
      <ParqQuestion label="Do you lose your balance because of dizziness, or do you ever lose consciousness?" value={form.parqDizziness} onChange={(v) => set('parqDizziness', v)} />
      <ParqQuestion label="Do you have a bone or joint problem that could be made worse by a change in your physical activity?" value={form.parqBoneJoint} onChange={(v) => set('parqBoneJoint', v)} />
      <ParqQuestion label="Is your doctor currently prescribing drugs for your blood pressure or heart condition?" value={form.parqBloodPressureMeds} onChange={(v) => set('parqBloodPressureMeds', v)} />
      <ParqQuestion label="Do you know of any other reason why you should not do physical activity?" value={form.parqOtherReason} onChange={(v) => set('parqOtherReason', v)} />

      {anyParq && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          <p className="text-sm font-medium text-red-700 inline-flex items-center gap-1.5"><IconAlert className="h-4 w-4" /> One or more YES answers require physician clearance.</p>
          <div>
            <label className={LABEL}>Additional Notes</label>
            <textarea rows={2} className={`${FIELD} resize-none`} value={form.parqNotes} onChange={(e) => set('parqNotes', e.target.value)} />
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" className="mt-0.5 accent-[#3c8ea8]" checked={form.physicianClearance} onChange={(e) => set('physicianClearance', e.target.checked)} />
            <span className="text-sm text-[#1f2e35]">Physician clearance confirmed - client has provided written medical clearance</span>
          </label>
          {errors.physicianClearance && <p className="text-xs text-red-500">{errors.physicianClearance}</p>}
          {form.physicianClearance && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Physician Name</label>
                <input className={FIELD} value={form.physicianName} onChange={(e) => set('physicianName', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Physician Phone</label>
                <input className={FIELD} value={form.physicianPhone} onChange={(e) => set('physicianPhone', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Step6Plan({ form, set, errors, plans }: StepProps & { plans: AdminPlan[] }) {
  return (
    <div className={SECTION}>
      <div>
        <label className={LABEL}>Select Plan *</label>
        <div className="space-y-2">
          {plans.filter((p) => p.isActive).map((plan) => (
            <label
              key={plan.id}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                form.planId === plan.id ? 'border-[#3c8ea8] bg-[#3c8ea8]/5' : 'border-[#d4e2e5] bg-white hover:border-[#3c8ea8]/50'
              }`}
            >
              <input type="radio" value={plan.id} checked={form.planId === plan.id} onChange={() => set('planId', plan.id)} className="mt-0.5 accent-[#3c8ea8]" />
              <div>
                <p className="text-sm font-medium text-[#1f2e35]">{plan.name}</p>
                <p className="text-xs text-[#8097a3]">{plan.description}</p>
                <p className="text-sm font-semibold text-[#3c8ea8] mt-0.5">${Number(plan.price).toFixed(2)}/month - {plan.classesPerMonth === 999 ? 'Unlimited' : `${plan.classesPerMonth} classes`}</p>
              </div>
            </label>
          ))}
        </div>
        <FieldErr msg={errors.planId} />
      </div>

      <div>
        <label className={LABEL}>Payment Method *</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'cash', label: 'Cash / Check', desc: 'Confirm received in-person', icon: <IconBanknote className="h-4 w-4" /> },
            { value: 'stripe', label: 'Card / Online', desc: 'Send Stripe checkout link', icon: <IconCard className="h-4 w-4" /> },
          ].map((m: { value: string; label: string; desc: string; icon: ReactNode }) => (
            <label
              key={m.value}
              className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                form.paymentMethod === m.value ? 'border-[#3c8ea8] bg-[#3c8ea8]/5' : 'border-[#d4e2e5] bg-white hover:border-[#3c8ea8]/50'
              }`}
            >
              <input type="radio" value={m.value} checked={form.paymentMethod === m.value} onChange={() => set('paymentMethod', m.value as 'cash' | 'stripe')} className="sr-only" />
              <p className="text-sm font-medium text-[#1f2e35] inline-flex items-center gap-2">{m.icon}{m.label}</p>
              <p className="text-xs text-[#8097a3]">{m.desc}</p>
            </label>
          ))}
        </div>
        <FieldErr msg={errors.paymentMethod} />
      </div>

      <div className="rounded-lg border border-[#d4e2e5] bg-[#f7fbfc] p-4 space-y-3">
        <p className="text-xs font-semibold text-[#5f7480] uppercase tracking-wide">Legal Consents</p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-[#3c8ea8]" checked={form.liabilityWaiverAccepted} onChange={(e) => set('liabilityWaiverAccepted', e.target.checked)} />
          <span className="text-xs text-[#1f2e35]">Client has read and accepted the <strong>Liability Waiver & Release of Claims</strong> for physical activity at the studio.</span>
        </label>
        <FieldErr msg={errors.liabilityWaiverAccepted} />
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-[#3c8ea8]" checked={form.photoVideoConsent} onChange={(e) => set('photoVideoConsent', e.target.checked)} />
          <span className="text-xs text-[#1f2e35]">Client consents to photos/videos taken at the studio for social media and marketing purposes (optional).</span>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" className="mt-0.5 accent-[#3c8ea8]" checked={form.dataProcessingConsent} onChange={(e) => set('dataProcessingConsent', e.target.checked)} />
          <span className="text-xs text-[#1f2e35]">Client accepts the <strong>Privacy Policy</strong> and consents to data processing for studio operations and billing.</span>
        </label>
        <FieldErr msg={errors.dataProcessingConsent} />
      </div>
    </div>
  );
}

function Step7Review({ form, plans }: { form: FormData; plans: AdminPlan[] }) {
  const plan = plans.find((p) => p.id === form.planId);
  const anyParq = form.parqHeartCondition || form.parqChestPainActivity || form.parqChestPainRest ||
    form.parqDizziness || form.parqBoneJoint || form.parqBloodPressureMeds || form.parqOtherReason;

  const rows = [
    { label: 'Name', value: form.name },
    { label: 'Email', value: form.email },
    { label: 'Phone', value: form.phone || '-' },
    { label: 'Date of Birth', value: form.dateOfBirth || '-' },
    { label: 'Address', value: [form.street, form.city, form.state, form.zipCode].filter(Boolean).join(', ') || '-' },
    { label: 'Emergency Contact', value: form.emergencyName ? `${form.emergencyName} (${form.emergencyRelation || 'contact'}) - ${form.emergencyPhone}` : '-' },
    { label: 'PAR-Q Result', value: anyParq ? (form.physicianClearance ? 'YES answers - Physician cleared' : 'YES answers - NO clearance') : 'All NO (clear)' },
    { label: 'Plan', value: plan ? `${plan.name} - $${Number(plan.price).toFixed(2)}/mo` : '-' },
    { label: 'Payment', value: form.paymentMethod === 'cash' ? 'Cash/Check (confirm in-person)' : 'Stripe checkout link' },
    { label: 'Liability Waiver', value: form.liabilityWaiverAccepted ? 'Accepted' : 'Not accepted' },
    { label: 'Data Consent', value: form.dataProcessingConsent ? 'Accepted' : 'Not accepted' },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#5f7480]">Review all information before confirming enrollment.</p>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex justify-between border-b border-[#f0ebe0] pb-2 gap-4">
          <span className="text-xs font-medium text-[#8097a3] uppercase tracking-wide shrink-0">{label}</span>
          <span className="text-sm text-[#1f2e35] text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

function DoneStep({
  name,
  paymentMethod,
  checkoutUrl,
  planName,
}: {
  name: string;
  paymentMethod: 'cash' | 'stripe';
  checkoutUrl: string | null;
  planName: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (paymentMethod === 'cash') {
    return (
      <div className="space-y-4 text-center py-4">
        <div className="flex justify-center text-green-600"><IconCheckCircle className="h-10 w-10" /></div>
        <h3 className="text-lg font-semibold text-[#1f2e35]">{name} enrolled successfully!</h3>
        <p className="text-sm text-[#5f7480]">
          Account created, health profile saved, and <strong>{planName}</strong> subscription activated.
        </p>
        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          Cash payment confirmed - subscription is now <strong>ACTIVE</strong>.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <div className="text-center">
        <div className="mb-2 flex justify-center text-green-600"><IconCheckCircle className="h-10 w-10" /></div>
        <h3 className="text-lg font-semibold text-[#1f2e35]">{name} account created!</h3>
        <p className="text-sm text-[#5f7480]">Health profile saved. Send the checkout link to complete payment.</p>
      </div>
      {checkoutUrl && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[#5f7480] uppercase tracking-wide">Stripe Checkout Link</p>
          <div className="flex gap-2">
            <input readOnly value={checkoutUrl} className={`${FIELD} text-xs flex-1`} />
            <button
              onClick={copy}
              className="shrink-0 rounded-lg border border-[#d4e2e5] px-3 py-1 text-xs text-[#5f7480] hover:border-[#3c8ea8] hover:text-[#3c8ea8] transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-[#8097a3]">Link expires in 24 hours. Share via email or WhatsApp.</p>
        </div>
      )}
    </div>
  );
}

