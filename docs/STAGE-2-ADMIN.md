# Stage 2 — Painel Administrativo

> **Innexar LLC** · Confidencial · v1.0.0
> Dias 4–6 do cronograma

---

## Objetivo

Centralizar toda a gestão operacional do studio: alunos, aulas, planos, leads, financeiro e conteúdo. Construído sobre o domínio e autenticação criados no Stage 1, adicionando controle de acesso por role `ADMIN`.

---

## Escopo da Etapa 2

| # | Feature | Prioridade |
|---|---------|-----------|
| 1 | Dashboard com métricas | Alta |
| 2 | Gestão de alunos | Alta |
| 3 | Gestão de aulas e sessões | Alta |
| 4 | Gestão de planos | Alta |
| 5 | Gestão de leads | Média |
| 6 | Relatório financeiro | Média |
| 7 | Gestão de conteúdo (blog + galeria) | Média |
| 8 | Gestão de tickets de suporte | Média |

---

## Proteção de Acesso

Todo o painel exige role `ADMIN`. O middleware já protege `/admin/*`:

```typescript
// Verificação em todos os endpoints admin
if (session?.user?.role !== 'ADMIN') {
  return NextResponse.json({ statusCode: 403, error: 'Forbidden' }, { status: 403 });
}
```

---

## 1. Dashboard com Métricas

### Página: `/admin/dashboard`

Visão executiva do studio em tempo real.

### Seções

| Card | Métricas exibidas |
|------|-------------------|
| **Receita** | MRR atual, crescimento vs mês anterior, receita do mês |
| **Alunos** | Total ativos, novos no mês, churn no mês |
| **Ocupação** | % de vagas preenchidas na semana, aulas mais cheias |
| **Inadimplência** | Total de assinaturas `PAST_DUE`/`UNPAID`, valor em risco |
| **Leads** | Total novos, conversão do mês |
| **Próximas aulas** | Lista das próximas 5 sessões com ocupação |

### API Endpoint

```
GET /api/v1/admin/dashboard

Response 200:
{
  "data": {
    "revenue": {
      "mrr": 15420.00,
      "currentMonth": 13890.00,
      "growthPercent": 8.5
    },
    "students": {
      "active": 47,
      "newThisMonth": 6,
      "churnThisMonth": 2
    },
    "occupancy": {
      "weeklyPercent": 72.4,
      "topClass": "Pilates Reformer — Segunda 09h"
    },
    "delinquency": {
      "count": 3,
      "totalAtRisk": 1041.00
    },
    "leads": {
      "newThisMonth": 15,
      "convertedThisMonth": 4
    },
    "upcomingSessions": [...]
  }
}
```

### Service

```typescript
// Usa Promise.all para queries paralelas (performance)
async function getAdminMetrics() {
  const [revenue, students, occupancy, delinquency, leads] = await Promise.all([
    paymentsRepository.getMRR(),
    usersRepository.getStudentStats(),
    bookingsRepository.getOccupancyStats(),
    subscriptionsRepository.getDelinquencyStats(),
    leadsRepository.getMonthlyStats(),
  ]);
  return { revenue, students, occupancy, delinquency, leads };
}
```

### Componentes

- `MetricCard` — card com valor, label, delta percentual e ícone
- `OccupancyBar` — barra de progresso com % de ocupação
- `DelinquencyAlert` — alerta vermelho se inadimplência > threshold
- `UpcomingSessionsList` — tabela com próximas sessões

---

## 2. Gestão de Alunos

### Páginas

- `/admin/alunos` — Lista com busca, filtros e paginação
- `/admin/alunos/[id]` — Perfil completo do aluno

### API Endpoints

```
GET /api/v1/admin/students
    ?page=1&limit=20
    &search=maria
    &status=ACTIVE
    &planId=uuid
    &sortBy=createdAt&order=desc

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "Maria Silva",
      "email": "maria@email.com",
      "phone": "(11) 99999-9999",
      "plan": "Essential",
      "subscriptionStatus": "ACTIVE",
      "classesRemaining": 4,
      "createdAt": "2026-01-15T00:00:00Z"
    }
  ],
  "meta": { "total": 47, "page": 1, "limit": 20, "totalPages": 3 }
}

GET  /api/v1/admin/students/:id
PATCH /api/v1/admin/students/:id
DELETE /api/v1/admin/students/:id   ← soft delete
```

### Perfil do Aluno (`/admin/alunos/[id]`)

Seções:
1. **Dados pessoais** — nome, e-mail, telefone (editável)
2. **Assinatura** — plano, status, próxima cobrança, histórico
3. **Agendamentos** — próximos e histórico de aulas
4. **Pagamentos** — histórico completo
5. **Tickets** — suporte aberto e resolvido
6. **Ações** — alterar plano, cancelar assinatura, bloquear acesso

### DTOs

```typescript
// UpdateStudentDto
{
  name?:  string (max 100)
  phone?: string
}

// Filtros de listagem (query params validados)
{
  page?:   number (min 1, default 1)
  limit?:  number (min 1, max 100, default 20)
  search?: string (max 100)
  status?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
  planId?: string (uuid)
  sortBy?: 'name' | 'createdAt' | 'subscriptionStatus'
  order?:  'asc' | 'desc'
}
```

### Componentes

- `StudentsDataTable` — tabela com colunas ordenáveis, busca, filtros
- `StudentStatusBadge` — badge colorido por status de assinatura
- `StudentProfileHeader` — avatar, nome, e-mail, plano e ações rápidas
- `StudentBookingHistory` — lista de agendamentos paginada
- `PlanChangeModal` — seletor de plano com confirmação

---

## 3. Gestão de Aulas

### Páginas

- `/admin/aulas` — Lista de classes template + grade de sessões
- `/admin/aulas/[id]` — Detalhe da aula + sessões futuras

### API Endpoints

```
GET  /api/v1/admin/classes
POST /api/v1/admin/classes
GET  /api/v1/admin/classes/:id
PATCH /api/v1/admin/classes/:id
DELETE /api/v1/admin/classes/:id

# Sessões
GET  /api/v1/admin/classes/:id/sessions
     ?startDate=2026-03-30
POST /api/v1/admin/classes/:id/sessions         ← criar sessão avulsa
PATCH /api/v1/admin/classes/:id/sessions/:sid   ← cancelar/editar sessão

# Alunos de uma sessão
GET  /api/v1/admin/sessions/:id/bookings        ← lista presença
PATCH /api/v1/admin/sessions/:id/bookings/:bid  ← marcar presença/falta
```

### DTOs

```typescript
// CreateClassDto
{
  title:       string (min 3, max 100)
  description: string? (max 500)
  instructor:  string (max 100)
  dayOfWeek:   ClassDayOfWeek
  startTime:   string (HH:MM)
  durationMin: number (15–180)
  maxCapacity: number (1–50)
}

// CreateSessionDto (avulsa)
{
  classId: string (uuid)
  date:    string (YYYY-MM-DD, futuro)
}
```

### Funcionalidades

- Criar aulas recorrentes (template semanal)
- Visualizar grade por semana
- Cancelar sessão específica → notifica alunos inscritos
- Marcar presença/falta por sessão
- Gerar sessões automaticamente (cron semanal)

### Regras de Negócio

```
1. Cancelar sessão → todos bookings viram CANCELED
2. Cancelamento ≥ 24h → devolver aula aos alunos no plano
3. Cancelamento < 24h → aula não devolvida (exceto admin override)
4. Capacidade da sessão = capacidade da classe (editável por sessão)
5. Sessões futuras geradas automaticamente toda semana (cron)
```

### Componentes

- `ClassList` — lista de templates com status ativo/inativo
- `ClassForm` — formulário criação/edição
- `WeeklyGrid` — grade visual da semana com sessões e ocupação
- `SessionAttendanceList` — lista de presença com checkbox
- `CancelSessionModal` — confirmação com aviso sobre notificações

---

## 4. Gestão de Planos

### Página: `/admin/planos`

### API Endpoints

```
GET  /api/v1/admin/plans
POST /api/v1/admin/plans
PATCH /api/v1/admin/plans/:id
```

> **Nota:** `DELETE` não é exposto — planos são desativados (`isActive: false`) para preservar histórico.

### DTOs

```typescript
// CreatePlanDto
{
  name:            string (max 100)
  description:     string? (max 500)
  price:           number (> 0, decimal 2 casas)
  classesPerMonth: number (1–999, 999 = ilimitado)
  stripePriceId:   string   ← criado previamente no Stripe Dashboard
  stripeProductId: string
  order:           number (ordenação na página de planos)
}

// UpdatePlanDto (apenas campos de UI)
{
  name?:        string
  description?: string
  isActive?:    boolean
  order?:       number
}
```

> Preço **não é editável** via painel — alterações de preço criam novo `Price` no Stripe. Plano antigo é desativado e novo criado.

### Funcionalidades

- Listar planos com total de assinantes por plano
- Ativar/desativar plano
- Reordenar planos (drag-and-drop opcional)
- Ver quantos alunos estão em cada plano

### Componentes

- `PlanCard` — card com nome, preço, aulas/mês, nº assinantes
- `PlanToggle` — ativar/desativar com confirmação
- `NewPlanForm` — criação vinculando Stripe Price ID

---

## 5. Gestão de Leads

### Página: `/admin/leads`

Funil de vendas com leads capturados pelo formulário do site.

### API Endpoints

```
GET  /api/v1/admin/leads
     ?page=1&limit=20&status=NEW&search=maria

PATCH /api/v1/admin/leads/:id
Body: { status, notes }

DELETE /api/v1/admin/leads/:id
```

### Funil de Status

```
NEW → CONTACTED → NEGOTIATING → CONVERTED | LOST
```

### Funcionalidades

- Visualizar leads em lista ou kanban por status
- Atualizar status e adicionar notas
- Ver origem (site, indicação, instagram via UTM)
- Converter lead → vincular aluno existente ou criar novo usuário
- Exportar leads em CSV

### DTOs

```typescript
// UpdateLeadDto
{
  status?: LeadStatus
  notes?:  string (max 2000)
}
```

### Componentes

- `LeadKanbanBoard` — colunas por status (drag se possível)
- `LeadListTable` — alternativa em tabela
- `LeadDetailSlide` — painel lateral com dados + histórico de notas
- `LeadStatusSelect` — select com as 5 opções de funil

---

## 6. Relatório Financeiro

### Página: `/admin/financeiro`

### API Endpoints

```
GET /api/v1/admin/payments
    ?page=1&limit=20
    &status=SUCCEEDED
    &startDate=2026-03-01
    &endDate=2026-03-31
    &userId=uuid
```

### Seções da Página

| Seção | Conteúdo |
|-------|----------|
| **Resumo** | Receita do período, total de transações, ticket médio |
| **Tabela** | Todos os pagamentos com filtros |
| **Inadimplentes** | Lista de assinaturas `PAST_DUE` com valor e aluno |

### Funcionalidades

- Filtrar por período, status, aluno
- Exportar relatório em CSV
- Ver detalhes de cada pagamento (link para Stripe Dashboard)
- Visualizar inadimplentes com botão de contato

---

## 7. Gestão de Conteúdo

### 7.1 Blog

**Páginas:**
- `/admin/conteudo/blog` — Lista de posts
- `/admin/conteudo/blog/[id]` — Editor de post

**API Endpoints:**

```
GET  /api/v1/admin/posts
POST /api/v1/admin/posts
GET  /api/v1/admin/posts/:id
PATCH /api/v1/admin/posts/:id
DELETE /api/v1/admin/posts/:id   ← hard delete apenas DRAFT
```

**CreatePostDto:**

```typescript
{
  title:      string (max 200)
  slug:       string (max 220, auto-gerado do título)
  excerpt:    string? (max 500)
  content:    string (HTML/markdown)
  coverUrl:   string? (MinIO URL)
  status:     'DRAFT' | 'PUBLISHED'
  metaTitle:  string? (max 60)
  metaDesc:   string? (max 160)
  publishedAt: string? (ISO date)
}
```

**Componentes:**
- `PostList` — tabela com status, data publicação, ações
- `PostEditor` — editor rich text (usando `@tiptap/react` ou `react-quill`)
- `PostSEOPanel` — campos de metaTitle, metaDesc, preview SEO
- `PostPublishControls` — botões rascunho/publicar + data agendada

---

### 7.2 Galeria de Fotos

**Página:** `/admin/conteudo/galeria`

**API Endpoints:**

```
GET    /api/v1/admin/gallery
POST   /api/v1/admin/gallery       ← upload para MinIO
PATCH  /api/v1/admin/gallery/:id   ← editar título/alt/ordem
DELETE /api/v1/admin/gallery/:id   ← remover imagem e arquivo MinIO
```

**Fluxo de Upload:**

```
1. Admin seleciona imagem (máx 5MB, jpg/png/webp)
2. Validar tipo e tamanho no servidor
3. Upload para MinIO via stream
4. Salvar URL no banco (gallery_images)
5. Retornar URL pública
```

**Componentes:**
- `GalleryGrid` — grid responsivo com imagens
- `ImageUploadZone` — drag-and-drop com preview
- `ImageEditModal` — editar alt text e título
- `ReorderGallery` — reordenar por drag (atualiza campo `order`)

---

## 8. Gestão de Suporte (Tickets)

### Página: `/admin/suporte`

Visão de todos os tickets abertos, com capacidade de resposta.

### API Endpoints

```
GET  /api/v1/admin/tickets
     ?page=1&limit=20&status=OPEN

GET  /api/v1/admin/tickets/:id

PATCH /api/v1/admin/tickets/:id
Body: { status: 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' }

POST /api/v1/admin/tickets/:id/messages
Body: { message: string }       ← resposta admin
```

### Funcionalidades

- Listar tickets por status com busca por aluno
- Responder tickets (marcar como `isAdmin: true`)
- Alterar status do ticket
- Notificar aluno por e-mail quando admin responde

### Componentes

- `TicketInbox` — lista estilo inbox com prioridade por status
- `TicketDetail` — thread de mensagens + ações de status
- `AdminReplyForm` — textarea com botão enviar + fechar ticket

---

## Layout do Painel Administrativo

```
┌──────────────────────────────────────────────────────────┐
│  Topbar: Logo · Ambiente (PROD/DEV) · Admin User · Sair  │
├────────────────┬─────────────────────────────────────────┤
│  Sidebar       │  Content Area                           │
│                │                                         │
│  Dashboard     │  ┌────────────────────────────────┐    │
│  Alunos        │  │  Page Header + Breadcrumb       │    │
│  Aulas         │  └────────────────────────────────┘    │
│  Planos        │                                         │
│  Leads         │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  Financeiro    │  │Metric│ │Metric│ │Metric│ │Metric│  │
│  ─────────     │  └──────┘ └──────┘ └──────┘ └──────┘  │
│  Conteúdo      │                                         │
│   └ Blog       │  ┌──────────────────────────────────┐  │
│   └ Galeria    │  │  Data Table / Content Area        │  │
│  Suporte       │  │                                   │  │
│                │  └──────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────┘
```

### Componentes shadcn/ui no Admin

- `DataTable` (TanStack Table) — tabelas com sort, filter, pagination
- `Sheet` — detalhes em painel lateral
- `Dialog` — confirmações e formulários modais
- `Select`, `DateRangePicker` — filtros
- `DropdownMenu` — ações por linha de tabela
- `Tabs` — perfil de aluno com abas
- `AlertDialog` — confirmações destrutivas

---

## Testes — Stage 2

| Caso de teste | Resultado esperado |
|--------------|-------------------|
| Acesso `/admin` como CLIENT | 403 Forbidden |
| Dashboard sem dados | Métricas zeradas, sem erro 500 |
| Busca de aluno por nome parcial | Retorna resultados filtrados |
| Cancelar sessão com alunos | Todos bookings → CANCELED, e-mail enviado |
| Desativar plano com assinantes | Plano some do site, assinantes mantidos |
| Upload imagem > 5MB | 400 Bad Request |
| Upload tipo inválido (PDF) | 400 Bad Request |
| Resposta de ticket → e-mail | E-mail enviado para aluno |

---

## Checklist de Entrega — Stage 2

- [ ] Role guard `ADMIN` em todas as rotas `/admin/*`
- [ ] Dashboard com métricas reais (sem dados mock)
- [ ] Listagem de alunos paginada com busca e filtros
- [ ] Perfil completo do aluno (dados + assinatura + histórico)
- [ ] CRUD completo de aulas e gestão de sessões
- [ ] Marcar presença/falta por sessão
- [ ] Gestão de planos (ativar/desativar)
- [ ] Funil de leads com kanban
- [ ] Relatório financeiro com filtros
- [ ] Editor de posts do blog
- [ ] Upload de imagens para galeria (MinIO)
- [ ] Gestão e resposta de tickets de suporte
- [ ] Testes unitários ≥ 90%

---

> **Innexar LLC** · Confidencial · Stage 2 v1.0.0
