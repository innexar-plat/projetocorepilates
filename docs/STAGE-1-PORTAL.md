# Stage 1 — Portal do Cliente

> **Innexar LLC** · Confidencial · v1.0.0
> Dias 1–3 do cronograma

---

## Objetivo

Criar o portal de autoatendimento para alunos ativos: visualizar plano, agendar aulas, acompanhar pagamentos e abrir suporte. É a etapa **1** pois depende de autenticação, domínio e banco de dados — fundação do sistema.

---

## Escopo da Etapa 1

| # | Feature | Prioridade |
|---|---------|-----------|
| 1 | Autenticação (login, registro, recuperação de senha) | Alta |
| 2 | Dashboard do aluno | Alta |
| 3 | Agendamento de aulas (book / cancel / waitlist) | Alta |
| 4 | Histórico de pagamentos | Alta |
| 5 | Gestão de conta (perfil, senha) | Média |
| 6 | Suporte via tickets | Média |
| 7 | Programa de indicação | Baixa |

---

## 1. Autenticação

### Páginas

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/login` | `LoginPage` | E-mail + senha, link "esqueci minha senha" |
| `/cadastro` | `RegisterPage` | Nome, e-mail, telefone, senha — cria conta como CLIENT |
| `/recuperar-senha` | `ForgotPasswordPage` | Envia e-mail com token |
| `/recuperar-senha/[token]` | `ResetPasswordPage` | Nova senha |

### API Endpoints

```
POST /api/auth/[...nextauth]   ← NextAuth handler (login/logout/session)
POST /api/v1/auth/register     ← Criação de conta
POST /api/v1/auth/forgot       ← Envio de e-mail reset
POST /api/v1/auth/reset        ← Confirmação nova senha
```

### Fluxo de Registro

```
1. Usuário preenche formulário
2. Validação via Zod (nome, e-mail, senha forte)
3. Verificar se e-mail já existe → 409 Conflict
4. Hash da senha com bcrypt (rounds: 12)
5. Criar User no banco
6. Criar Customer no Stripe
7. Salvar stripeCustomerId no User
8. Enviar e-mail de boas-vindas via Resend
9. Login automático via NextAuth
```

### DTOs

```typescript
// CreateUserDto
{
  name:     string (min 2, max 100)
  email:    string (email válido)
  password: string (min 8, max 128, 1 maiúscula, 1 número)
  phone:    string? (formato brasileiro)
}

// LoginDto
{
  email:    string
  password: string
}

// ForgotPasswordDto
{
  email: string (email válido)
}

// ResetPasswordDto
{
  token:    string
  password: string (min 8)
}
```

### Componentes de UI

- `LoginForm` — form controlado, loading state, mensagem de erro
- `RegisterForm` — validação em tempo real (força da senha)
- `ForgotPasswordForm` — feedback de sucesso após envio
- `AuthLayout` — layout centralizado com branding

---

## 2. Dashboard do Aluno

### Página: `/portal/dashboard`

Visão geral do aluno após login.

### Seções da Página

| Seção | Conteúdo |
|-------|----------|
| **Plano Ativo** | Nome do plano, status, aulas restantes no mês, data renovação |
| **Próximas Aulas** | Até 3 aulas agendadas com data/hora/status |
| **Último Pagamento** | Valor, data, status |
| **Ações Rápidas** | Botões: Agendar aula, Ver pagamentos, Indicar amigo |

### API Endpoint

```
GET /api/v1/dashboard

Response 200:
{
  "data": {
    "subscription": {
      "planName": "Essential",
      "status": "ACTIVE",
      "classesRemaining": 3,
      "nextBillingDate": "2026-04-28T00:00:00Z"
    },
    "upcomingBookings": [
      {
        "id": "uuid",
        "classTitle": "Pilates Reformer",
        "date": "2026-03-30T09:00:00Z",
        "status": "CONFIRMED"
      }
    ],
    "lastPayment": {
      "amount": 347.00,
      "status": "SUCCEEDED",
      "date": "2026-03-01T00:00:00Z"
    }
  }
}
```

### Service Layer

```typescript
// modules/users/services/dashboard.service.ts
async function getDashboardData(userId: string) {
  const [subscription, upcomingBookings, lastPayment] = await Promise.all([
    subscriptionsRepository.findActiveByUser(userId),
    bookingsRepository.findUpcoming(userId, 3),
    paymentsRepository.findLastByUser(userId),
  ]);

  return { subscription, upcomingBookings, lastPayment };
}
```

---

## 3. Agendamento de Aulas

### Página: `/portal/aulas`

Grade semanal com aulas disponíveis para reserva.

### Funcionalidades

- Visualizar grade semanal de aulas
- Ver vagas disponíveis em tempo real
- Confirmar reserva (desconta 1 aula do plano)
- Cancelar reserva (devolve aula ao plano se > 24h)
- Entrar em lista de espera quando lotado
- Ser notificado automaticamente quando vaga abre

### API Endpoints

```
GET  /api/v1/classes
     ?startDate=2026-03-30&endDate=2026-04-06

Response 200:
{
  "data": [
    {
      "sessionId": "uuid",
      "classTitle": "Pilates Reformer",
      "instructor": "Ana Lima",
      "date": "2026-03-30",
      "startTime": "09:00",
      "duration": 60,
      "availableSpots": 3,
      "maxCapacity": 10,
      "userBookingStatus": null | "CONFIRMED" | "WAITLIST"
    }
  ]
}

POST /api/v1/bookings
Body: { "classSessionId": "uuid" }

Response 201:
{
  "data": {
    "bookingId": "uuid",
    "status": "CONFIRMED" | "WAITLIST",
    "waitlistPosition": null | 2
  }
}

DELETE /api/v1/bookings/:id
Response 204
```

### Regras de Negócio

```
1. Aluno deve ter assinatura ACTIVE para reservar
2. Aluno deve ter classesRemaining > 0 (exceto plano ilimitado)
3. Não pode reservar a mesma sessão duas vezes
4. Lotado → entrar na waitlist automaticamente
5. Cancelamento < 24h antes → aula NÃO é devolvida ao plano
6. Cancelamento ≥ 24h antes → aula devolvida
7. Quando aluno cancela → promover primeiro da waitlist
8. Promoção na waitlist → enviar e-mail de notificação
```

### Componentes

- `ClassScheduleGrid` — grade semanal com slots
- `ClassCard` — info da aula + botão agendar/cancelar
- `BookingConfirmModal` — confirmação antes de agendar
- `WaitlistBadge` — posição na fila de espera

---

## 4. Histórico de Pagamentos

### Página: `/portal/pagamentos`

Lista completa de cobranças com link para fatura do Stripe.

### API Endpoint

```
GET /api/v1/payments
    ?page=1&limit=10

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "description": "Assinatura Essential — Abril 2026",
      "amount": 347.00,
      "currency": "brl",
      "status": "SUCCEEDED",
      "date": "2026-04-01T00:00:00Z",
      "invoiceUrl": "https://invoice.stripe.com/..."
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### Componentes

- `PaymentHistoryTable` — tabela paginada com status colorido
- `PaymentStatusBadge` — badge verde/amarelo/vermelho
- `InvoiceLink` — link externo para fatura Stripe

---

## 5. Gestão de Conta

### Página: `/portal/conta`

### Funcionalidades

- Atualizar nome e telefone
- Alterar senha (requer senha atual)
- Visualizar plano ativo e botão para gerenciar assinatura (Stripe Customer Portal)
- Desativar conta (soft delete)

### API Endpoints

```
GET   /api/v1/profile
PATCH /api/v1/profile
Body: { name?, phone? }

POST  /api/v1/profile/change-password
Body: { currentPassword, newPassword }

POST  /api/v1/subscription/portal
Response 200: { url: "https://billing.stripe.com/..." }
```

### Regras de Negócio

- Alterar senha: validar senha atual antes de atualizar
- E-mail: imutável após cadastro (para evitar conflitos com Stripe)
- Stripe Portal: gerar session URL via `stripe.billingPortal.sessions.create()`

---

## 6. Suporte via Tickets

### Páginas

- `/portal/suporte` — Lista de tickets do aluno
- `/portal/suporte/[id]` — Conversa do ticket

### API Endpoints

```
GET  /api/v1/tickets
     ?page=1&limit=10

POST /api/v1/tickets
Body: { subject: string (max 200) }

GET  /api/v1/tickets/:id

POST /api/v1/tickets/:id/messages
Body: { message: string (max 5000) }
```

### Regras de Negócio

- Aluno só vê seus próprios tickets
- Ticket aberto → pode adicionar mensagens
- Ticket RESOLVED/CLOSED → somente leitura para o aluno
- Quando admin responde → notificação por e-mail ao aluno

### Componentes

- `TicketList` — lista com status e data
- `TicketThread` — conversa estilo chat
- `NewTicketForm` — criação com subject + primeira mensagem
- `TicketStatusBadge` — OPEN / IN_PROGRESS / RESOLVED

---

## 7. Programa de Indicação

### Página: `/portal/indicacoes`

### Funcionalidades

- Visualizar código de indicação único
- Copiar link de indicação
- Ver histórico: quem foi indicado + status da conversão
- Créditos ganhos por conversões

### API Endpoint

```
GET /api/v1/referrals

Response 200:
{
  "data": {
    "code": "MARIA2026",
    "link": "https://braziliancorepilates.com/indicacao/MARIA2026",
    "totalReferrals": 3,
    "converted": 1,
    "pending": 2,
    "creditsEarned": 1
  }
}
```

### Regras de Negócio

- Código gerado automaticamente no cadastro do aluno
- Link público: `/indicacao/[code]` → pré-preenche formulário de lead
- Conversão = lead que assina plano via código de indicação
- Recompensa: 1 aula grátis por conversão (manual por enquanto)

---

## Direção Visual — Portal

### Design System

```
Background:    #0B0F14 (fundo escuro principal)
Surface:       #121821 (cards, sidebar)
Border:        rgba(255,255,255,0.06)
Text primary:  #EAECEF
Text secondary:#9CA3AF
Gold accent:   #D4AF37
Gold light:    #F2D27A
Teal accent:   #A8DADC
```

### Layout do Portal

```
┌─────────────────────────────────────────────────┐
│  Sidebar (240px)          Main Content           │
│  ┌─────────────┐  ┌─────────────────────────┐   │
│  │ Logo        │  │ Header (breadcrumb)      │   │
│  │             │  │                          │   │
│  │ > Dashboard │  │  ┌──────┐  ┌──────┐     │   │
│  │   Aulas     │  │  │Card  │  │Card  │     │   │
│  │   Pagamentos│  │  └──────┘  └──────┘     │   │
│  │   Suporte   │  │                          │   │
│  │   Indicações│  │  [Content area]          │   │
│  │   Conta     │  │                          │   │
│  │             │  └─────────────────────────┘   │
│  │ Sair        │                                 │
│  └─────────────┘                                 │
└─────────────────────────────────────────────────┘
```

### Componentes shadcn/ui utilizados

- `Card`, `CardHeader`, `CardContent` — containers
- `Badge` — status de booking, pagamento
- `Table` — histórico de pagamentos
- `Dialog` — confirmação de agendamento
- `Button` — ações
- `Input`, `Label`, `Form` — formulários
- `Separator` — divisores

---

## Testes — Stage 1

| Tipo | Cobertura | Ferramentas |
|------|-----------|-------------|
| Unit | Services e repositories | Jest |
| Integration | API routes | Jest + Supertest |
| E2E | Fluxo de login e agendamento | Playwright |

### Casos de Teste Críticos

```
✅ Registro com e-mail duplicado → 409
✅ Login com senha errada → 401
✅ Agendamento sem assinatura ativa → 403
✅ Agendamento em aula lotada → entra na waitlist
✅ Cancelamento < 24h → aula não devolvida
✅ Cancelamento com sucesso → promove waitlist
✅ Dashboard com assinatura vencida → exibe alerta
✅ Acesso ao /portal sem login → redirect /login
```

---

## Checklist de Entrega — Stage 1

- [ ] NextAuth configurado (credentials + session strategy)
- [ ] Middleware de proteção de rotas `/portal/*`
- [ ] CRUD completo de usuários
- [ ] Sistema de agendamento com controle de vagas
- [ ] Integração Stripe (customer create + billing portal)
- [ ] E-mails transacionais (boas-vindas, confirmação, cancelamento)
- [ ] Tickets de suporte (criar + responder)
- [ ] Programa de indicação (código + link)
- [ ] Testes unitários ≥ 90%
- [ ] Testes E2E dos fluxos críticos

---

> **Innexar LLC** · Confidencial · Stage 1 v1.0.0
