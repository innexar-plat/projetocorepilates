import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await db.user.upsert({
    where: { email: 'admin@corepilates.com' },
    update: {},
    create: {
      name: 'Admin Core Pilates',
      email: 'admin@corepilates.com',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Plans
  const plans = await Promise.all([
    db.plan.upsert({
      where: { stripePriceId: 'price_starter_placeholder' },
      update: {},
      create: {
        name: 'Starter',
        description: '8 classes per month. Perfect to get started.',
        price: 99,
        stripePriceId: 'price_starter_placeholder',
        stripeProductId: 'prod_starter_placeholder',
        classesPerMonth: 8,
        isActive: true,
        order: 1,
      },
    }),
    db.plan.upsert({
      where: { stripePriceId: 'price_essential_placeholder' },
      update: {},
      create: {
        name: 'Essential',
        description: '12 classes per month. Our most popular plan!',
        price: 179,
        stripePriceId: 'price_essential_placeholder',
        stripeProductId: 'prod_essential_placeholder',
        classesPerMonth: 12,
        isActive: true,
        order: 2,
      },
    }),
    db.plan.upsert({
      where: { stripePriceId: 'price_premium_placeholder' },
      update: {},
      create: {
        name: 'Premium',
        description: 'Unlimited classes. Maximum results.',
        price: 249,
        stripePriceId: 'price_premium_placeholder',
        stripeProductId: 'prod_premium_placeholder',
        classesPerMonth: 999,
        isActive: true,
        order: 3,
      },
    }),
  ]);
  console.log(`✅ Plans seeded: ${plans.map((p) => p.name).join(', ')}`);

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
