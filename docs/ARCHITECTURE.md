# Arquitetura — Brazilian Core Pilates

> **Innexar LLC** · Confidencial · v1.0.0

---

## 1. Visão Arquitetural

A plataforma segue **Clean Architecture** com **Domain-Driven Design (DDD)**, organizada por domínios de negócio. Cada domínio é autocontido com suas próprias camadas: controller → service → repository → database.

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                   │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────┐
│                    Nginx (Reverse Proxy)                  │
│              SSL termination · Rate limiting              │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│              Next.js 14 (App Router) via PM2              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   (marketing)│  │  (portal)    │  │   (admin)      │  │
│  │  Site Público│  │  Cliente     │  │  Administrativo│  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│  ┌──────────────────────────────────────────────────┐    │
│  │                  API Routes /api/v1               │    │
│  └──────────────────────────────────────────────────┘    │
└──────────┬──────────────────┬────────────────────────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼──────────────────────────┐
│   PostgreSQL    │  │     Serviços Externos               │
│   (Prisma ORM)  │  │  Stripe · Resend · MinIO           │
└─────────────────┘  └────────────────────────────────────┘
```

---

## 2. Princípios Arquiteturais

### Clean Architecture por Domínio

```
Requisição → Controller → Service → Repository → Database
                 ↓             ↓
           DTO/Validação   Lógica de negócio
```

**Regras:**
- Controller: recebe request, valida DTO, retorna response — sem lógica de negócio
- Service: implementa regras de negócio, orquestra repositórios
- Repository: único responsável por queries ao banco
- DTO: valida e tipifica entrada/saída

### SOLID + DRY + KISS + YAGNI

| Princípio | Aplicação prática |
|-----------|-------------------|
| Single Responsibility | 1 service = 1 domínio |
| Open/Closed | Extensão via interfaces, não modificação |
| Dependency Inversion | Todos os serviços injetados via construtor |
| DRY | Helpers compartilhados em `lib/`, nunca duplicar lógica |
| KISS | Solução simples > abstrações desnecessárias |
| YAGNI | Implementar só o necessário para o sprint atual |

---

## 3. Estrutura de Pastas Completa

```
src/
├── app/                              # Next.js App Router
│   ├── (marketing)/                  # Layout público
│   │   ├── layout.tsx
│   │   ├── page.tsx                  # Home (/)
│   │   ├── aulas/
│   │   │   └── page.tsx              # Grade de aulas (/aulas)
│   │   ├── planos/
│   │   │   └── page.tsx              # Planos e preços (/planos)
│   │   ├── blog/
│   │   │   ├── page.tsx              # Listagem (/blog)
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Post (/blog/:slug)
│   │   ├── galeria/
│   │   │   └── page.tsx              # Galeria (/galeria)
│   │   ├── contato/
│   │   │   └── page.tsx              # Contato (/contato)
│   │   ├── checkout/
│   │   │   └── [planId]/
│   │   │       └── page.tsx          # Checkout (/checkout/:planId)
│   │   └── indicacao/
│   │       └── [code]/
│   │           └── page.tsx          # Indicação (/indicacao/:code)
│   │
│   ├── (auth)/                       # Layout de autenticação
│   │   ├── layout.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── cadastro/
│   │   │   └── page.tsx
│   │   └── recuperar-senha/
│   │       ├── page.tsx              # Solicitar reset
│   │       └── [token]/
│   │           └── page.tsx          # Nova senha
│   │
│   ├── (portal)/                     # Layout portal (auth guard)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx              # /portal/dashboard
│   │   ├── aulas/
│   │   │   └── page.tsx              # Agendamento /portal/aulas
│   │   ├── pagamentos/
│   │   │   └── page.tsx              # /portal/pagamentos
│   │   ├── suporte/
│   │   │   ├── page.tsx              # Listagem tickets
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Ticket detalhe
│   │   ├── indicacoes/
│   │   │   └── page.tsx              # /portal/indicacoes
│   │   └── conta/
│   │       └── page.tsx              # /portal/conta
│   │
│   ├── (admin)/                      # Layout admin (role guard)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Métricas /admin/dashboard
│   │   ├── alunos/
│   │   │   ├── page.tsx              # Lista /admin/alunos
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalhe aluno
│   │   ├── aulas/
│   │   │   ├── page.tsx              # Lista /admin/aulas
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Detalhe aula
│   │   ├── planos/
│   │   │   └── page.tsx              # /admin/planos
│   │   ├── leads/
│   │   │   └── page.tsx              # /admin/leads
│   │   ├── financeiro/
│   │   │   └── page.tsx              # /admin/financeiro
│   │   ├── conteudo/
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx          # Lista posts
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Editor post
│   │   │   └── galeria/
│   │   │       └── page.tsx          # Galeria de fotos
│   │   └── suporte/
│   │       └── page.tsx              # Tickets de suporte
│   │
│   └── api/
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts
│       ├── v1/
│       │   ├── profile/
│       │   │   └── route.ts          # GET PATCH /api/v1/profile
│       │   ├── dashboard/
│       │   │   └── route.ts          # GET /api/v1/dashboard
│       │   ├── classes/
│       │   │   └── route.ts          # GET /api/v1/classes
│       │   ├── bookings/
│       │   │   ├── route.ts          # GET POST /api/v1/bookings
│       │   │   └── [id]/
│       │   │       └── route.ts      # DELETE /api/v1/bookings/:id
│       │   ├── payments/
│       │   │   └── route.ts          # GET /api/v1/payments
│       │   ├── subscription/
│       │   │   └── route.ts          # GET /api/v1/subscription
│       │   ├── tickets/
│       │   │   ├── route.ts          # GET POST /api/v1/tickets
│       │   │   └── [id]/
│       │   │       ├── route.ts      # GET /api/v1/tickets/:id
│       │   │       └── messages/
│       │   │           └── route.ts  # POST /api/v1/tickets/:id/messages
│       │   ├── referrals/
│       │   │   └── route.ts          # GET /api/v1/referrals
│       │   ├── admin/
│       │   │   ├── dashboard/
│       │   │   │   └── route.ts      # GET métricas
│       │   │   ├── students/
│       │   │   │   ├── route.ts      # GET POST
│       │   │   │   └── [id]/
│       │   │   │       └── route.ts  # GET PATCH DELETE
│       │   │   ├── classes/
│       │   │   │   ├── route.ts      # GET POST
│       │   │   │   └── [id]/
│       │   │   │       └── route.ts  # GET PATCH DELETE
│       │   │   ├── plans/
│       │   │   │   ├── route.ts
│       │   │   │   └── [id]/
│       │   │   │       └── route.ts
│       │   │   ├── leads/
│       │   │   │   ├── route.ts
│       │   │   │   └── [id]/
│       │   │   │       └── route.ts
│       │   │   ├── payments/
│       │   │   │   └── route.ts
│       │   │   ├── posts/
│       │   │   │   ├── route.ts
│       │   │   │   └── [id]/
│       │   │   │       └── route.ts
│       │   │   └── gallery/
│       │   │       ├── route.ts
│       │   │       └── [id]/
│       │   │           └── route.ts
│       │   └── public/
│       │       ├── classes/
│       │       │   └── route.ts      # Grade pública de aulas
│       │       ├── plans/
│       │       │   └── route.ts      # Planos disponíveis
│       │       ├── posts/
│       │       │   ├── route.ts
│       │       │   └── [slug]/
│       │       │       └── route.ts
│       │       └── leads/
│       │           └── route.ts      # Formulário de contato
│       └── webhooks/
│           └── stripe/
│               └── route.ts          # POST /api/webhooks/stripe
│
├── modules/                          # Domínios de negócio
│   ├── users/
│   │   ├── controllers/
│   │   │   └── users.controller.ts
│   │   ├── services/
│   │   │   └── users.service.ts
│   │   ├── repositories/
│   │   │   └── users.repository.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   └── dtos/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   ├── classes/                      # (mesma estrutura)
│   ├── bookings/
│   ├── payments/
│   ├── plans/
│   ├── leads/
│   ├── content/
│   ├── support/
│   └── referrals/
│
├── components/
│   ├── ui/                           # shadcn/ui (gerado automaticamente)
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   ├── sidebar-admin.tsx
│   │   └── sidebar-portal.tsx
│   ├── marketing/                    # Componentes do site público
│   │   ├── hero-section.tsx
│   │   ├── class-grid.tsx
│   │   ├── plans-section.tsx
│   │   └── testimonials.tsx
│   ├── portal/                       # Componentes do portal
│   │   ├── booking-card.tsx
│   │   ├── payment-history.tsx
│   │   └── plan-status.tsx
│   └── admin/                        # Componentes do painel
│       ├── metric-card.tsx
│       ├── data-table.tsx
│       └── student-form.tsx
│
├── lib/
│   ├── auth.ts                       # NextAuth config
│   ├── db.ts                         # Prisma client singleton
│   ├── stripe.ts                     # Stripe client
│   ├── resend.ts                     # Resend client
│   ├── minio.ts                      # MinIO client
│   └── utils.ts                      # Helpers gerais
│
├── hooks/
│   ├── use-auth.ts
│   ├── use-booking.ts
│   └── use-dashboard.ts
│
├── types/
│   ├── next-auth.d.ts                # Extend NextAuth types
│   └── api.d.ts                      # API response types
│
└── styles/
    └── globals.css                   # Tailwind + CSS variables
```

---

## 4. Padrão de Módulo (Template)

Cada domínio segue exatamente esta estrutura:

```typescript
// modules/[domain]/entities/[domain].entity.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// modules/[domain]/dtos/create-[domain].dto.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;

// modules/[domain]/repositories/[domain].repository.ts
import { db } from '@/lib/db';

export const usersRepository = {
  findById: (id: string) =>
    db.user.findUnique({ where: { id, deletedAt: null } }),

  findByEmail: (email: string) =>
    db.user.findUnique({ where: { email } }),

  create: (data: CreateUserData) =>
    db.user.create({ data }),

  update: (id: string, data: UpdateUserData) =>
    db.user.update({ where: { id }, data }),

  softDelete: (id: string) =>
    db.user.update({ where: { id }, data: { deletedAt: new Date() } }),
};

// modules/[domain]/services/[domain].service.ts
export const usersService = {
  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw new NotFoundError('User not found');
    return user;
  },
};

// app/api/v1/[domain]/route.ts (Controller)
export async function GET(request: Request) {
  const session = await auth();
  if (!session) return unauthorized();
  const users = await usersService.listAll();
  return NextResponse.json({ data: users });
}
```

---

## 5. Rotas da API — Convenções

Todas as respostas seguem o padrão REST profissional:

```
GET    /api/v1/resource          → 200 { data: [...], meta: {...} }
POST   /api/v1/resource          → 201 { data: {...} }
GET    /api/v1/resource/:id      → 200 { data: {...} }
PATCH  /api/v1/resource/:id      → 200 { data: {...} }
DELETE /api/v1/resource/:id      → 204
```

**Erros:**
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [{ "field": "email", "message": "must be a valid email" }]
}
```

---

## 6. Autenticação e Autorização

### Fluxo

```
Login → NextAuth → JWT (15min) → httpOnly Cookie (Refresh 7d)
                                       ↓
                              Middleware verifica role
                              ADMIN → /admin/*
                              CLIENT → /portal/*
                              PUBLIC → /*
```

### Roles

| Role | Acesso |
|------|--------|
| `ADMIN` | Tudo — painel administrativo + portal |
| `CLIENT` | Portal do cliente |
| `PUBLIC` | Site público (sem autenticação) |

### Middleware de proteção

```typescript
// middleware.ts (Next.js)
export const config = {
  matcher: ['/portal/:path*', '/admin/:path*', '/api/v1/admin/:path*'],
};

export default auth((req) => {
  const isPortal = req.nextUrl.pathname.startsWith('/portal');
  const isAdmin = req.nextUrl.pathname.startsWith('/admin');

  if (!req.auth) return redirectToLogin(req);
  if (isAdmin && req.auth.user.role !== 'ADMIN') return forbidden();
});
```

---

## 7. Decisões Técnicas

| Decisão | Escolha | Alternativa descartada | Motivo |
|---------|---------|------------------------|--------|
| Framework | Next.js 14 | Remix, Astro | App Router maduro, SSR/SSG/ISR nativo, ecossistema |
| ORM | Prisma | Drizzle, TypeORM | DX superior, migrations, type-safe queries |
| Auth | NextAuth v5 | Clerk, Supabase Auth | Self-hosted, sem vendor lock-in, custo zero |
| Pagamentos | Stripe | Paddle, MercadoPago | Confiabilidade, webhooks, documentação |
| E-mail | Resend | SendGrid, Nodemailer | API moderna, templates React nativos |
| Storage | MinIO | S3, Cloudinary | Self-hosted, sem custo por GB, controle total |
| UI | shadcn/ui | MUI, Chakra | Componentes copiáveis, sem dependência de runtime |
| Validação | Zod | Joi, class-validator | Native TypeScript inference, leve, composável |

---

> **Innexar LLC** · Confidencial · Arquitetura v1.0.0
