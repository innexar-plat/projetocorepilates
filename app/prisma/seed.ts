import { PrismaClient, UserRole, ClassDayOfWeek } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

type ScheduleEntry = {
  dayOfWeek: ClassDayOfWeek;
  startTime: string;
  title: string;
};

const DAY_INDEX: Record<ClassDayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

function toDateOnlyUtc(date: Date): Date {
  const normalized = new Date(date);
  normalized.setUTCHours(12, 0, 0, 0);
  return normalized;
}

function nextWeekdayDate(dayIndex: number, fromDate = new Date()): Date {
  const base = new Date(fromDate);
  const result = new Date(base);
  const daysUntil = (dayIndex - result.getUTCDay() + 7) % 7;
  result.setUTCDate(result.getUTCDate() + daysUntil);
  return toDateOnlyUtc(result);
}

function toSeedClassId(title: string, dayOfWeek: ClassDayOfWeek, startTime: string): string {
  const slug = `${title}-${dayOfWeek}-${startTime}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `seed-${slug}`;
}

const schedule: ScheduleEntry[] = [
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '06:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '07:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '08:00', title: 'Pilates Ball/Mat' },
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '09:00', title: 'Upper Body' },
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '10:00', title: 'Private Class' },
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '13:00', title: 'Brazilian Burn' },
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '14:00', title: 'Brazilian Booty' },
  { dayOfWeek: ClassDayOfWeek.MONDAY, startTime: '15:00', title: 'Brazilian Fit Conditioning' },

  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '06:00', title: 'Upper Body' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '07:00', title: 'Brazilian Booty' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '08:00', title: 'Brazilian Burn' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '09:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '10:00', title: 'Pilates Ball/Mat' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '14:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '15:00', title: 'Brazilian Burn' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '16:00', title: 'Brazilian Fit Conditioning' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '17:00', title: 'Upper Body' },
  { dayOfWeek: ClassDayOfWeek.TUESDAY, startTime: '18:00', title: 'Brazilian Booty' },

  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '06:00', title: 'Brazilian Fit Conditioning' },
  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '07:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '08:00', title: 'Brazilian Booty' },
  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '09:00', title: 'Upper Body' },
  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '10:00', title: 'Private Class' },
  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '13:00', title: 'Pilates Ball/Mat' },
  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '14:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.WEDNESDAY, startTime: '15:00', title: 'Brazilian Burn' },

  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '06:00', title: 'Brazilian Burn' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '07:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '08:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '09:00', title: 'Brazilian Fit Conditioning' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '10:00', title: 'Private Class' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '15:00', title: 'Upper Body' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '16:00', title: 'Brazilian Burn' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '17:00', title: 'Brazilian Booty' },
  { dayOfWeek: ClassDayOfWeek.THURSDAY, startTime: '18:00', title: 'Pilates Ball/Mat' },

  { dayOfWeek: ClassDayOfWeek.FRIDAY, startTime: '06:00', title: 'Brazilian Booty' },
  { dayOfWeek: ClassDayOfWeek.FRIDAY, startTime: '07:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.FRIDAY, startTime: '08:00', title: 'Brazilian Burn' },
  { dayOfWeek: ClassDayOfWeek.FRIDAY, startTime: '09:00', title: 'Pilates Ball/Mat' },
  { dayOfWeek: ClassDayOfWeek.FRIDAY, startTime: '13:00', title: 'Brazilian Fit Conditioning' },
  { dayOfWeek: ClassDayOfWeek.FRIDAY, startTime: '14:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.FRIDAY, startTime: '15:00', title: 'Brazilian Flow Pilates' },

  { dayOfWeek: ClassDayOfWeek.SATURDAY, startTime: '08:00', title: 'Brazilian Flow Pilates' },
  { dayOfWeek: ClassDayOfWeek.SATURDAY, startTime: '09:00', title: 'Brazilian Burn' },
  { dayOfWeek: ClassDayOfWeek.SATURDAY, startTime: '10:00', title: 'Brazilian Booty' },
];

const classDescriptions = {
  pt: {
    'Brazilian Fit Conditioning':
      'Aula para quem busca exercicios dinamicos com acessorios, pesos, cordas e elasticos, usando exercicios funcionais com peso corporal, isometria, forca, cardio e resistencia.',
    'Pilates Ball/Mat':
      'Combinacao de Pilates Mat e Pilates Ball para trabalhar flexibilidade, forca, equilibrio e controle corporal, com baixo impacto e foco em alinhamento postural.',
    'Upper Body':
      'Aula para fortalecer costas, peito e bracos, melhorando postura e resistencia da parte superior do corpo.',
    'Private Class':
      'Sessao individual personalizada conforme objetivos e necessidades do aluno.',
    'Brazilian Burn':
      'Aula focada em pernas, gluteos e abdomen com exercicios dinamicos para tonus muscular, forca e resistencia.',
    'Brazilian Booty':
      'Aula focada em gluteos, fortalecendo tambem abdomen e lombar para mais estabilidade.',
    'Brazilian Flow Pilates':
      'Aula de alinhamento corporal com foco em forca abdominal, alongamento e respiracao.',
  },
  en: {
    'Brazilian Fit Conditioning':
      'Dynamic conditioning class using props, weights, ropes and bands with functional training, bodyweight work, isometrics, strength, cardio and endurance.',
    'Pilates Ball/Mat':
      'A blend of Pilates Mat and Pilates Ball to improve flexibility, strength, balance and body control with low-impact movements and posture focus.',
    'Upper Body':
      'Class focused on strengthening back, chest and arms while improving upper-body posture and endurance.',
    'Private Class':
      'One-on-one personalized session tailored to the student goals and physical needs.',
    'Brazilian Burn':
      'Class focused on legs, glutes and core with dynamic drills to improve muscle tone, strength and endurance.',
    'Brazilian Booty':
      'Glute-focused class that also strengthens core and lower back for better stability and tone.',
    'Brazilian Flow Pilates':
      'Body-alignment class focused on core strength, stretching and breathing.',
  },
  es: {
    'Brazilian Fit Conditioning':
      'Clase dinamica de acondicionamiento con accesorios, pesas, cuerdas y bandas, combinando ejercicios funcionales, peso corporal, isometria, fuerza, cardio y resistencia.',
    'Pilates Ball/Mat':
      'Combinacion de Pilates Mat y Pilates Ball para mejorar flexibilidad, fuerza, equilibrio y control corporal, con bajo impacto y enfoque postural.',
    'Upper Body':
      'Clase enfocada en fortalecer espalda, pecho y brazos, mejorando la postura y la resistencia de la parte superior del cuerpo.',
    'Private Class':
      'Sesion individual personalizada segun los objetivos y necesidades del alumno.',
    'Brazilian Burn':
      'Clase enfocada en piernas, gluteos y abdomen con ejercicios dinamicos para mejorar tono muscular, fuerza y resistencia.',
    'Brazilian Booty':
      'Clase enfocada en gluteos que tambien fortalece abdomen y zona lumbar para mayor estabilidad.',
    'Brazilian Flow Pilates':
      'Clase de alineacion corporal con enfoque en fuerza abdominal, estiramiento y respiracion.',
  },
};

const plansCatalogLocalized = {
  pt: [
    {
      name: 'Starter',
      description: '8 aulas por mes. Perfeito para comecar.',
      classesPerMonth: 8,
      price: 99,
    },
    {
      name: 'Essential',
      description: '12 aulas por mes. Plano mais popular.',
      classesPerMonth: 12,
      price: 179,
    },
    {
      name: 'Premium',
      description: 'Aulas ilimitadas para resultados maximos.',
      classesPerMonth: 999,
      price: 249,
    },
  ],
  en: [
    {
      name: 'Starter',
      description: '8 classes per month. Perfect to get started.',
      classesPerMonth: 8,
      price: 99,
    },
    {
      name: 'Essential',
      description: '12 classes per month. Most popular plan.',
      classesPerMonth: 12,
      price: 179,
    },
    {
      name: 'Premium',
      description: 'Unlimited classes for maximum results.',
      classesPerMonth: 999,
      price: 249,
    },
  ],
  es: [
    {
      name: 'Starter',
      description: '8 clases por mes. Perfecto para empezar.',
      classesPerMonth: 8,
      price: 99,
    },
    {
      name: 'Essential',
      description: '12 clases por mes. El plan mas popular.',
      classesPerMonth: 12,
      price: 179,
    },
    {
      name: 'Premium',
      description: 'Clases ilimitadas para maximos resultados.',
      classesPerMonth: 999,
      price: 249,
    },
  ],
};

const businessHoursLocalized = {
  pt: [
    {
      day: 'Segunda-feira',
      classes: [
        { time: '06:00', title: 'Brazilian Flow Pilates' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Pilates Ball/Mat' },
        { time: '09:00', title: 'Upper Body' },
        { time: '10:00', title: 'Private Class' },
        { time: '13:00', title: 'Brazilian Burn' },
        { time: '14:00', title: 'Brazilian Booty' },
        { time: '15:00', title: 'Brazilian Fit Conditioning' },
      ],
    },
    {
      day: 'Terca-feira',
      classes: [
        { time: '06:00', title: 'Upper Body' },
        { time: '07:00', title: 'Brazilian Booty' },
        { time: '08:00', title: 'Brazilian Burn' },
        { time: '09:00', title: 'Brazilian Flow Pilates' },
        { time: '10:00', title: 'Pilates Ball/Mat' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Burn' },
        { time: '16:00', title: 'Brazilian Fit Conditioning' },
        { time: '17:00', title: 'Upper Body' },
        { time: '18:00', title: 'Brazilian Booty' },
      ],
    },
    {
      day: 'Quarta-feira',
      classes: [
        { time: '06:00', title: 'Brazilian Fit Conditioning' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Booty' },
        { time: '09:00', title: 'Upper Body' },
        { time: '10:00', title: 'Private Class' },
        { time: '13:00', title: 'Pilates Ball/Mat' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Burn' },
      ],
    },
    {
      day: 'Quinta-feira',
      classes: [
        { time: '06:00', title: 'Brazilian Burn' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Flow Pilates' },
        { time: '09:00', title: 'Brazilian Fit Conditioning' },
        { time: '10:00', title: 'Private Class' },
        { time: '15:00', title: 'Upper Body' },
        { time: '16:00', title: 'Brazilian Burn' },
        { time: '17:00', title: 'Brazilian Booty' },
        { time: '18:00', title: 'Pilates Ball/Mat' },
      ],
    },
    {
      day: 'Sexta-feira',
      classes: [
        { time: '06:00', title: 'Brazilian Booty' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Burn' },
        { time: '09:00', title: 'Pilates Ball/Mat' },
        { time: '13:00', title: 'Brazilian Fit Conditioning' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Flow Pilates' },
      ],
    },
    {
      day: 'Sabado',
      classes: [
        { time: '08:00', title: 'Brazilian Flow Pilates' },
        { time: '09:00', title: 'Brazilian Burn' },
        { time: '10:00', title: 'Brazilian Booty' },
      ],
    },
  ],
  en: [
    {
      day: 'Monday',
      classes: [
        { time: '06:00', title: 'Brazilian Flow Pilates' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Pilates Ball/Mat' },
        { time: '09:00', title: 'Upper Body' },
        { time: '10:00', title: 'Private Class' },
        { time: '13:00', title: 'Brazilian Burn' },
        { time: '14:00', title: 'Brazilian Booty' },
        { time: '15:00', title: 'Brazilian Fit Conditioning' },
      ],
    },
    {
      day: 'Tuesday',
      classes: [
        { time: '06:00', title: 'Upper Body' },
        { time: '07:00', title: 'Brazilian Booty' },
        { time: '08:00', title: 'Brazilian Burn' },
        { time: '09:00', title: 'Brazilian Flow Pilates' },
        { time: '10:00', title: 'Pilates Ball/Mat' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Burn' },
        { time: '16:00', title: 'Brazilian Fit Conditioning' },
        { time: '17:00', title: 'Upper Body' },
        { time: '18:00', title: 'Brazilian Booty' },
      ],
    },
    {
      day: 'Wednesday',
      classes: [
        { time: '06:00', title: 'Brazilian Fit Conditioning' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Booty' },
        { time: '09:00', title: 'Upper Body' },
        { time: '10:00', title: 'Private Class' },
        { time: '13:00', title: 'Pilates Ball/Mat' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Burn' },
      ],
    },
    {
      day: 'Thursday',
      classes: [
        { time: '06:00', title: 'Brazilian Burn' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Flow Pilates' },
        { time: '09:00', title: 'Brazilian Fit Conditioning' },
        { time: '10:00', title: 'Private Class' },
        { time: '15:00', title: 'Upper Body' },
        { time: '16:00', title: 'Brazilian Burn' },
        { time: '17:00', title: 'Brazilian Booty' },
        { time: '18:00', title: 'Pilates Ball/Mat' },
      ],
    },
    {
      day: 'Friday',
      classes: [
        { time: '06:00', title: 'Brazilian Booty' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Burn' },
        { time: '09:00', title: 'Pilates Ball/Mat' },
        { time: '13:00', title: 'Brazilian Fit Conditioning' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Flow Pilates' },
      ],
    },
    {
      day: 'Saturday',
      classes: [
        { time: '08:00', title: 'Brazilian Flow Pilates' },
        { time: '09:00', title: 'Brazilian Burn' },
        { time: '10:00', title: 'Brazilian Booty' },
      ],
    },
  ],
  es: [
    {
      day: 'Lunes',
      classes: [
        { time: '06:00', title: 'Brazilian Flow Pilates' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Pilates Ball/Mat' },
        { time: '09:00', title: 'Upper Body' },
        { time: '10:00', title: 'Private Class' },
        { time: '13:00', title: 'Brazilian Burn' },
        { time: '14:00', title: 'Brazilian Booty' },
        { time: '15:00', title: 'Brazilian Fit Conditioning' },
      ],
    },
    {
      day: 'Martes',
      classes: [
        { time: '06:00', title: 'Upper Body' },
        { time: '07:00', title: 'Brazilian Booty' },
        { time: '08:00', title: 'Brazilian Burn' },
        { time: '09:00', title: 'Brazilian Flow Pilates' },
        { time: '10:00', title: 'Pilates Ball/Mat' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Burn' },
        { time: '16:00', title: 'Brazilian Fit Conditioning' },
        { time: '17:00', title: 'Upper Body' },
        { time: '18:00', title: 'Brazilian Booty' },
      ],
    },
    {
      day: 'Miercoles',
      classes: [
        { time: '06:00', title: 'Brazilian Fit Conditioning' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Booty' },
        { time: '09:00', title: 'Upper Body' },
        { time: '10:00', title: 'Private Class' },
        { time: '13:00', title: 'Pilates Ball/Mat' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Burn' },
      ],
    },
    {
      day: 'Jueves',
      classes: [
        { time: '06:00', title: 'Brazilian Burn' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Flow Pilates' },
        { time: '09:00', title: 'Brazilian Fit Conditioning' },
        { time: '10:00', title: 'Private Class' },
        { time: '15:00', title: 'Upper Body' },
        { time: '16:00', title: 'Brazilian Burn' },
        { time: '17:00', title: 'Brazilian Booty' },
        { time: '18:00', title: 'Pilates Ball/Mat' },
      ],
    },
    {
      day: 'Viernes',
      classes: [
        { time: '06:00', title: 'Brazilian Booty' },
        { time: '07:00', title: 'Brazilian Flow Pilates' },
        { time: '08:00', title: 'Brazilian Burn' },
        { time: '09:00', title: 'Pilates Ball/Mat' },
        { time: '13:00', title: 'Brazilian Fit Conditioning' },
        { time: '14:00', title: 'Brazilian Flow Pilates' },
        { time: '15:00', title: 'Brazilian Flow Pilates' },
      ],
    },
    {
      day: 'Sabado',
      classes: [
        { time: '08:00', title: 'Brazilian Flow Pilates' },
        { time: '09:00', title: 'Brazilian Burn' },
        { time: '10:00', title: 'Brazilian Booty' },
      ],
    },
  ],
};

const classDescriptionByTitlePt: Record<string, string> = {
  'Brazilian Fit Conditioning': classDescriptions.pt['Brazilian Fit Conditioning'],
  'Pilates Ball/Mat': classDescriptions.pt['Pilates Ball/Mat'],
  'Upper Body': classDescriptions.pt['Upper Body'],
  'Private Class': classDescriptions.pt['Private Class'],
  'Brazilian Burn': classDescriptions.pt['Brazilian Burn'],
  'Brazilian Booty': classDescriptions.pt['Brazilian Booty'],
  'Brazilian Flow Pilates': classDescriptions.pt['Brazilian Flow Pilates'],
};

async function seedSettings() {
  await db.siteSetting.upsert({
    where: { key: 'business_hours_schedule' },
    update: {
      value: JSON.stringify(businessHoursLocalized),
      group: 'website',
    },
    create: {
      key: 'business_hours_schedule',
      value: JSON.stringify(businessHoursLocalized),
      group: 'website',
    },
  });

  await db.siteSetting.upsert({
    where: { key: 'class_descriptions' },
    update: {
      value: JSON.stringify(classDescriptions),
      group: 'website',
    },
    create: {
      key: 'class_descriptions',
      value: JSON.stringify(classDescriptions),
      group: 'website',
    },
  });

  await db.siteSetting.upsert({
    where: { key: 'plans_catalog_localized' },
    update: {
      value: JSON.stringify(plansCatalogLocalized),
      group: 'website',
    },
    create: {
      key: 'plans_catalog_localized',
      value: JSON.stringify(plansCatalogLocalized),
      group: 'website',
    },
  });
}

async function seedPlans() {
  const plans = await Promise.all([
    db.plan.upsert({
      where: { stripePriceId: 'price_starter_placeholder' },
      update: {
        name: 'Starter',
        description: '8 classes per month. Perfect to get started.',
        price: 99,
        classesPerMonth: 8,
        isActive: false,
        order: 1,
      },
      create: {
        name: 'Starter',
        description: '8 classes per month. Perfect to get started.',
        price: 99,
        stripePriceId: 'price_starter_placeholder',
        stripeProductId: 'prod_starter_placeholder',
        classesPerMonth: 8,
        isActive: false,
        order: 1,
      },
    }),
    db.plan.upsert({
      where: { stripePriceId: 'price_essential_placeholder' },
      update: {
        name: 'Essential',
        description: '12 classes per month. Most popular plan.',
        price: 179,
        classesPerMonth: 12,
        isActive: false,
        order: 2,
      },
      create: {
        name: 'Essential',
        description: '12 classes per month. Most popular plan.',
        price: 179,
        stripePriceId: 'price_essential_placeholder',
        stripeProductId: 'prod_essential_placeholder',
        classesPerMonth: 12,
        isActive: false,
        order: 2,
      },
    }),
    db.plan.upsert({
      where: { stripePriceId: 'price_premium_placeholder' },
      update: {
        name: 'Premium',
        description: 'Unlimited classes for maximum results.',
        price: 249,
        classesPerMonth: 999,
        isActive: false,
        order: 3,
      },
      create: {
        name: 'Premium',
        description: 'Unlimited classes for maximum results.',
        price: 249,
        stripePriceId: 'price_premium_placeholder',
        stripeProductId: 'prod_premium_placeholder',
        classesPerMonth: 999,
        isActive: false,
        order: 3,
      },
    }),
  ]);

  console.log(`✅ Plans seeded: ${plans.map((p) => p.name).join(', ')}`);
}

async function seedClassesAndSessions() {
  const desiredSeedClassIds = schedule.map((slot) =>
    toSeedClassId(slot.title, slot.dayOfWeek, slot.startTime),
  );

  const obsoleteSeedClasses = await db.class.findMany({
    where: {
      id: { startsWith: 'seed-' },
      NOT: { id: { in: desiredSeedClassIds } },
    },
    select: { id: true },
  });

  if (obsoleteSeedClasses.length > 0) {
    const obsoleteIds = obsoleteSeedClasses.map((c) => c.id);

    await db.booking.deleteMany({
      where: {
        classSession: {
          classId: { in: obsoleteIds },
        },
      },
    });

    await db.classSession.deleteMany({
      where: {
        classId: { in: obsoleteIds },
      },
    });

    await db.class.deleteMany({
      where: {
        id: { in: obsoleteIds },
      },
    });

    console.log(`✅ Removed obsolete seed class slots: ${obsoleteIds.length}`);
  }

  let classSlotCount = 0;
  for (const slot of schedule) {
    const id = toSeedClassId(slot.title, slot.dayOfWeek, slot.startTime);

    await db.class.upsert({
      where: { id },
      update: {
        title: slot.title,
        description: classDescriptionByTitlePt[slot.title] ?? null,
        instructor: 'Brazilian Core Team',
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        durationMin: slot.title === 'Private Class' ? 50 : 60,
        maxCapacity: slot.title === 'Private Class' ? 1 : 14,
        isActive: true,
      },
      create: {
        id,
        title: slot.title,
        description: classDescriptionByTitlePt[slot.title] ?? null,
        instructor: 'Brazilian Core Team',
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        durationMin: slot.title === 'Private Class' ? 50 : 60,
        maxCapacity: slot.title === 'Private Class' ? 1 : 14,
        isActive: true,
      },
    });

    classSlotCount += 1;
  }

  console.log(`✅ Class slots seeded: ${classSlotCount}`);

  const classes = await db.class.findMany({
    where: { isActive: true, id: { startsWith: 'seed-' } },
    select: { id: true, dayOfWeek: true },
  });

  let sessionCount = 0;
  for (const cls of classes) {
    const firstDate = nextWeekdayDate(DAY_INDEX[cls.dayOfWeek]);

    for (let week = 0; week < 8; week += 1) {
      const occurrence = new Date(firstDate);
      occurrence.setUTCDate(occurrence.getUTCDate() + week * 7);

      await db.classSession.upsert({
        where: {
          classId_date: {
            classId: cls.id,
            date: toDateOnlyUtc(occurrence),
          },
        },
        update: {
          status: 'SCHEDULED',
        },
        create: {
          classId: cls.id,
          date: toDateOnlyUtc(occurrence),
          status: 'SCHEDULED',
        },
      });

      sessionCount += 1;
    }
  }

  console.log(`✅ Upcoming class sessions ensured: ${sessionCount}`);
}

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await db.user.upsert({
    where: { email: 'admin@corepilates.com' },
    update: {
      name: 'Admin Core Pilates',
      role: UserRole.ADMIN,
      isActive: true,
      passwordHash,
    },
    create: {
      name: 'Admin Core Pilates',
      email: 'admin@corepilates.com',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Admin user: ${admin.email}`);

  await seedPlans();
  await seedSettings();
  await seedClassesAndSessions();

  console.log('✅ Database seeded successfully with PT/EN/ES schedule and class content');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
