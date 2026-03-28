# Database — Schema Completo

> **Innexar LLC** · Confidencial · v1.0.0

---

## 1. Visão Geral do Schema

```
users ──────────────── subscriptions ── plans
  │                          │
  ├── bookings ─────── class_sessions ── classes
  │
  ├── payments
  │
  ├── support_tickets ── ticket_messages
  │
  └── referrals (referrer + referred)

posts (blog)
gallery_images
leads
```

---

## 2. Schema Prisma Completo

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum UserRole {
  ADMIN
  CLIENT
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  TRIALING
  UNPAID
}

enum BookingStatus {
  CONFIRMED
  CANCELED
  WAITLIST
  ATTENDED
  NO_SHOW
}

enum ClassDayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum ClassSessionStatus {
  SCHEDULED
  COMPLETED
  CANCELED
}

enum PaymentStatus {
  SUCCEEDED
  PENDING
  FAILED
  REFUNDED
}

enum LeadStatus {
  NEW
  CONTACTED
  NEGOTIATING
  CONVERTED
  LOST
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum ReferralStatus {
  PENDING
  CONVERTED
  EXPIRED
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

model User {
  id               String    @id @default(uuid())
  name             String    @db.VarChar(100)
  email            String    @unique @db.VarChar(255)
  emailVerified    DateTime?
  passwordHash     String?   @db.VarChar(255)
  phone            String?   @db.VarChar(20)
  role             UserRole  @default(CLIENT)
  avatarUrl        String?   @db.VarChar(500)
  stripeCustomerId String?   @unique @db.VarChar(100)
  isActive         Boolean   @default(true)

  // Timestamps padrão
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  // Relações
  subscription     Subscription?
  bookings         Booking[]
  payments         Payment[]
  supportTickets   SupportTicket[]
  ticketMessages   TicketMessage[]
  referralsSent    Referral[]      @relation("ReferrerRelation")
  referralReceived Referral?       @relation("ReferredRelation")
  posts            Post[]

  @@index([email])
  @@index([stripeCustomerId])
  @@index([deletedAt])
  @@map("users")
}

// ─────────────────────────────────────────────
// PLANS
// ─────────────────────────────────────────────

model Plan {
  id               String  @id @default(uuid())
  name             String  @db.VarChar(100)
  description      String? @db.Text
  price            Decimal @db.Decimal(15, 2)
  stripePriceId    String  @unique @db.VarChar(100)
  stripeProductId  String  @unique @db.VarChar(100)
  classesPerMonth  Int
  isActive         Boolean @default(true)
  order            Int     @default(0)     // Ordem de exibição

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  subscriptions Subscription[]

  @@index([isActive])
  @@map("plans")
}

// ─────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────

model Subscription {
  id                     String             @id @default(uuid())
  userId                 String             @unique
  planId                 String
  stripeSubscriptionId   String             @unique @db.VarChar(100)
  status                 SubscriptionStatus
  currentPeriodStart     DateTime
  currentPeriodEnd       DateTime
  cancelAtPeriodEnd      Boolean            @default(false)
  classesUsedThisMonth   Int                @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])
  plan Plan @relation(fields: [planId], references: [id])

  @@index([userId])
  @@index([stripeSubscriptionId])
  @@index([status])
  @@map("subscriptions")
}

// ─────────────────────────────────────────────
// CLASSES (template recorrente)
// ─────────────────────────────────────────────

model Class {
  id          String         @id @default(uuid())
  title       String         @db.VarChar(100)
  description String?        @db.Text
  instructor  String         @db.VarChar(100)
  dayOfWeek   ClassDayOfWeek
  startTime   String         @db.VarChar(5)  // "08:00"
  durationMin Int            @default(60)
  maxCapacity Int            @default(10)
  isActive    Boolean        @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions ClassSession[]

  @@index([dayOfWeek])
  @@index([isActive])
  @@map("classes")
}

// ─────────────────────────────────────────────
// CLASS SESSIONS (ocorrências reais das aulas)
// ─────────────────────────────────────────────

model ClassSession {
  id              String             @id @default(uuid())
  classId         String
  date            DateTime           @db.Date
  currentCapacity Int                @default(0)
  status          ClassSessionStatus @default(SCHEDULED)
  notes           String?            @db.VarChar(500)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  class    Class     @relation(fields: [classId], references: [id])
  bookings Booking[]

  @@unique([classId, date])
  @@index([classId])
  @@index([date])
  @@index([status])
  @@map("class_sessions")
}

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────

model Booking {
  id             String        @id @default(uuid())
  userId         String
  classSessionId String
  status         BookingStatus @default(CONFIRMED)
  waitlistPosition Int?        // null = confirmado, número = posição na fila

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user         User         @relation(fields: [userId], references: [id])
  classSession ClassSession @relation(fields: [classSessionId], references: [id])

  @@unique([userId, classSessionId])
  @@index([userId])
  @@index([classSessionId])
  @@index([status])
  @@map("bookings")
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

model Payment {
  id                    String        @id @default(uuid())
  userId                String
  stripePaymentIntentId String?       @unique @db.VarChar(100)
  stripeInvoiceId       String?       @unique @db.VarChar(100)
  amount                Decimal       @db.Decimal(15, 2)
  currency              String        @default("brl") @db.VarChar(3)
  status                PaymentStatus
  description           String?       @db.VarChar(255)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("payments")
}

// ─────────────────────────────────────────────
// LEADS
// ─────────────────────────────────────────────

model Lead {
  id      String     @id @default(uuid())
  name    String     @db.VarChar(100)
  email   String     @db.VarChar(255)
  phone   String?    @db.VarChar(20)
  source  String?    @db.VarChar(50)  // "site", "indicacao", "instagram"
  status  LeadStatus @default(NEW)
  notes   String?    @db.Text
  utm     Json?                        // { source, medium, campaign }

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@index([status])
  @@index([createdAt])
  @@map("leads")
}

// ─────────────────────────────────────────────
// POSTS (blog)
// ─────────────────────────────────────────────

model Post {
  id          String     @id @default(uuid())
  authorId    String
  title       String     @db.VarChar(200)
  slug        String     @unique @db.VarChar(220)
  excerpt     String?    @db.VarChar(500)
  content     String     @db.Text
  coverUrl    String?    @db.VarChar(500)
  status      PostStatus @default(DRAFT)
  publishedAt DateTime?
  metaTitle   String?    @db.VarChar(60)
  metaDesc    String?    @db.VarChar(160)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author User @relation(fields: [authorId], references: [id])

  @@index([slug])
  @@index([status])
  @@index([publishedAt])
  @@map("posts")
}

// ─────────────────────────────────────────────
// GALLERY
// ─────────────────────────────────────────────

model GalleryImage {
  id       String  @id @default(uuid())
  title    String? @db.VarChar(100)
  url      String  @db.VarChar(500)    // MinIO URL
  altText  String? @db.VarChar(200)
  order    Int     @default(0)
  isActive Boolean @default(true)

  createdAt DateTime @default(now())

  @@index([isActive])
  @@index([order])
  @@map("gallery_images")
}

// ─────────────────────────────────────────────
// SUPPORT TICKETS
// ─────────────────────────────────────────────

model SupportTicket {
  id      String       @id @default(uuid())
  userId  String
  subject String       @db.VarChar(200)
  status  TicketStatus @default(OPEN)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user     User            @relation(fields: [userId], references: [id])
  messages TicketMessage[]

  @@index([userId])
  @@index([status])
  @@map("support_tickets")
}

model TicketMessage {
  id       String  @id @default(uuid())
  ticketId String
  userId   String
  message  String  @db.Text
  isAdmin  Boolean @default(false)

  createdAt DateTime @default(now())

  ticket SupportTicket @relation(fields: [ticketId], references: [id])
  user   User          @relation(fields: [userId], references: [id])

  @@index([ticketId])
  @@map("ticket_messages")
}

// ─────────────────────────────────────────────
// REFERRALS
// ─────────────────────────────────────────────

model Referral {
  id         String         @id @default(uuid())
  referrerId String
  referredId String?        @unique
  code       String         @unique @db.VarChar(20)
  status     ReferralStatus @default(PENDING)
  rewardPaid Boolean        @default(false)

  createdAt  DateTime  @default(now())
  convertedAt DateTime?

  referrer User  @relation("ReferrerRelation", fields: [referrerId], references: [id])
  referred User? @relation("ReferredRelation", fields: [referredId], references: [id])

  @@index([referrerId])
  @@index([code])
  @@index([status])
  @@map("referrals")
}
```

---

## 3. Relacionamentos

```
User (1) ──────── (0..1) Subscription
User (1) ──────── (N)    Booking
User (1) ──────── (N)    Payment
User (1) ──────── (N)    SupportTicket
User (1) ──────── (N)    TicketMessage
User (1) ──────── (N)    Referral (como referrer)
User (1) ──────── (0..1) Referral (como referred)
User (1) ──────── (N)    Post

Plan (1) ──────── (N)    Subscription

Class (1) ─────── (N)    ClassSession
ClassSession (1) ─(N)    Booking

SupportTicket (1) (N)    TicketMessage
```

---

## 4. Índices e Performance

| Tabela | Índices | Motivo |
|--------|---------|--------|
| `users` | `email`, `stripeCustomerId`, `deletedAt` | Login, webhook lookup, soft delete filter |
| `subscriptions` | `userId`, `stripeSubscriptionId`, `status` | Verificação de planos ativo |
| `bookings` | `userId`, `classSessionId`, `status` | Listagem por aluno, verificação de vaga |
| `class_sessions` | `classId`, `date`, `status` | Grade de aulas por data |
| `payments` | `userId`, `status`, `createdAt` | Histórico e relatórios financeiros |
| `leads` | `email`, `status`, `createdAt` | Funil de vendas |
| `posts` | `slug`, `status`, `publishedAt` | Blog público com SEO |
| `referrals` | `referrerId`, `code`, `status` | Programa de indicação |

---

## 5. Migrations

### Estratégia

```bash
# Criar migration nova
npx prisma migrate dev --name add_referrals_table

# Aplicar em produção
npx prisma migrate deploy

# Reset em dev apenas
npx prisma migrate reset
```

### Convenção de Nomenclatura

```
YYYYMMDDHHMMSS_action_entity_description
Exemplo: 20260328120000_add_referral_status_enum
```

---

## 6. Seed Inicial

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  // Admin user
  await db.user.upsert({
    where: { email: 'admin@braziliancorepilates.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@braziliancorepilates.com',
      passwordHash: await hash('Admin@2026!', 12),
      role: 'ADMIN',
    },
  });

  // Planos iniciais
  const plans = [
    {
      name: 'Starter',
      description: '4 aulas por mês',
      price: 197.00,
      classesPerMonth: 4,
      stripePriceId: 'price_starter',
      stripeProductId: 'prod_starter',
      order: 1,
    },
    {
      name: 'Essential',
      description: '8 aulas por mês',
      price: 347.00,
      classesPerMonth: 8,
      stripePriceId: 'price_essential',
      stripeProductId: 'prod_essential',
      order: 2,
    },
    {
      name: 'Premium',
      description: 'Aulas ilimitadas',
      price: 497.00,
      classesPerMonth: 999,
      stripePriceId: 'price_premium',
      stripeProductId: 'prod_premium',
      order: 3,
    },
  ];

  for (const plan of plans) {
    await db.plan.upsert({
      where: { stripePriceId: plan.stripePriceId },
      update: {},
      create: plan,
    });
  }
}

main().finally(() => db.$disconnect());
```

---

## 7. Tipos de Dados

| Dado | Tipo Prisma | SQL | Motivo |
|------|-------------|-----|--------|
| ID | `String @default(uuid())` | `UUID` | Sem exposição de sequência |
| Valor monetário | `Decimal @db.Decimal(15,2)` | `DECIMAL(15,2)` | Precisão financeira — nunca FLOAT |
| Datas | `DateTime` | `TIMESTAMP WITH TIME ZONE` | UTC automático |
| Textos curtos | `String @db.VarChar(N)` | `VARCHAR(N)` | Limit explícito |
| Textos longos | `String @db.Text` | `TEXT` | Conteúdo de blog, notas |
| Flags | `Boolean` | `BOOLEAN` | |
| JSON | `Json` | `JSONB` | UTM params, metadados |

---

> **Innexar LLC** · Confidencial · Database v1.0.0
