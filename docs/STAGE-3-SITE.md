# Stage 3 — Site Público (Marketing)

> **Innexar LLC** · Confidencial · v1.0.0
> Dias 7–9 do cronograma

---

## Objetivo

Criar o site institucional otimizado para conversão: apresentar a marca, atrair leads, exibir planos e permitir checkout online. É a etapa **3** pois consome dados já gerenciados pelo painel (planos, aulas, posts, galeria) e exige SSR/ISR para SEO.

---

## Escopo da Etapa 3

| # | Página | Prioridade | Renderização |
|---|--------|-----------|--------------|
| 1 | Home (landing page) | Alta | SSR |
| 2 | Grade de Aulas pública | Alta | SSR |
| 3 | Planos e Preços | Alta | SSR |
| 4 | Checkout Online | Alta | SSR (protegido) |
| 5 | Blog — listagem | Média | ISR (60s) |
| 6 | Blog — post individual | Média | ISR (60s) |
| 7 | Galeria de Fotos | Média | ISR (300s) |
| 8 | Formulário de Contato | Média | SSR |
| 9 | Página de Indicação | Baixa | SSR |

---

## Estratégia de Renderização

| Tipo | Uso | Motivo |
|------|-----|--------|
| **SSR** | Home, Planos, Grade, Contato | Dados dinâmicos, personalização, formulários |
| **ISR** | Blog, Galeria | Conteúdo muda raramente, cache com revalidação |
| **Static** | Páginas de erro (404, 500) | Sem dependência de dados |

---

## Rotas Públicas (API)

Todas sem autenticação, somente leitura:

```
GET /api/v1/public/classes           ← grade de aulas disponíveis
GET /api/v1/public/plans             ← planos ativos com preços
GET /api/v1/public/posts             ← posts publicados (paginado)
GET /api/v1/public/posts/:slug       ← post individual
GET /api/v1/public/gallery           ← imagens ativas
POST /api/v1/public/leads            ← formulário de contato
```

---

## 1. Home — Landing Page

### Rota: `/`

### Seções

| Seção | Conteúdo | Objetivo |
|-------|----------|---------|
| **Hero** | Headline forte, subheadline, 2 CTAs, imagem/vídeo de fundo | Converter em 5 segundos |
| **Sobre** | Breve apresentação do studio, filosofia, diferenciais | Conexão emocional |
| **Como funciona** | 3–4 passos simples (escolha plano → agende → comece) | Reduzir fricção |
| **Aulas** | Prévia de 3–4 aulas mais populares com horários | Desejo |
| **Planos** | Cards dos planos com preço e CTA de checkout | Conversão direta |
| **Depoimentos** | 3 depoimentos reais de alunas | Prova social |
| **Galeria** | Grid de 6–8 fotos do studio | Confiança |
| **FAQ** | 5–6 perguntas frequentes (accordion) | Remover objeções |
| **CTA Final** | Headline de urgência + botão de cadastro | Última chance de converter |
| **Footer** | Links, redes sociais, contato, privacidade | Navegação + SEO |

### Headlines (Sugestão)

```
H1: "Transforme seu corpo com o método Brazilian Core Pilates"
H2: "Aulas exclusivas em Reformer · Turmas pequenas · Resultado real"
CTA: "Quero começar agora" / "Ver planos"
```

### Componentes

- `HeroSection` — background escuro com dourado, animação sutil
- `HowItWorks` — 3 steps com ícones minimalistas
- `ClassPreviewGrid` — 4 cards de aula com horário e vagas
- `PricingSection` — reutiliza componente de `/planos`
- `TestimonialsCarousel` — carousel com foto, nome e depoimento
- `PhotoGalleryPreview` — grid masonry com 6 fotos
- `FAQAccordion` — perguntas/respostas com animação
- `FinalCTABanner` — fundo dourado com texto escuro
- `SiteFooter` — logo, links, redes, copyright

---

## 2. Grade de Aulas

### Rota: `/aulas`

### Funcionalidades

- Exibir grade semanal de aulas disponíveis
- Filtrar por dia da semana
- Mostrar vagas disponíveis (cores: verde, amarelo, vermelho)
- CTA para agendar → redireciona para login/portal
- Visitante não autenticado → agendar abre modal de cadastro

### API Endpoint

```
GET /api/v1/public/classes
    ?startDate=2026-03-30&endDate=2026-04-05

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
      "maxCapacity": 10
    }
  ]
}
```

### Componentes

- `PublicClassGrid` — grade por dia, estilo agenda
- `PublicClassCard` — card com título, hora, duração, vagas
- `SpotsIndicator` — verde (>50%), amarelo (>20%), vermelho (<20%), cinza (lotado)
- `BookingCTAModal` — modal convidando a fazer login ou cadastro

---

## 3. Planos e Preços

### Rota: `/planos`

### Funcionalidades

- Exibir todos os planos ativos
- Destacar plano mais popular (flag `isPopular` ou por ordem)
- CTA de cada plano → ir para `/checkout/[planId]`
- Comparativo de features entre planos
- FAQ específico de planos/pagamentos

### API Endpoint

```
GET /api/v1/public/plans

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "name": "Starter",
      "description": "4 aulas por mês",
      "price": 197.00,
      "classesPerMonth": 4,
      "isPopular": false,
      "features": [
        "4 aulas por mês",
        "Acesso ao portal do aluno",
        "Cancelamento flexível"
      ]
    },
    {
      "id": "uuid",
      "name": "Essential",
      "price": 347.00,
      "classesPerMonth": 8,
      "isPopular": true,
      ...
    }
  ]
}
```

> `features` são strings definidas no campo `description` do plano, separadas por quebra de linha, ou em campo JSON futuro.

### Componentes

- `PricingCardGrid` — grid responsivo (1 col mobile, 3 col desktop)
- `PricingCard` — nome, preço, features lista, badge "Mais popular", CTA
- `PlanComparisonTable` — tabela de comparação (opcional, mobile hidden)
- `PlanFAQ` — FAQ específico de pagamento

---

## 4. Checkout Online

### Rota: `/checkout/[planId]`

### Fluxo Completo

```
Visitante → /planos → Clica plano → /checkout/[planId]
                                         ↓
                             [ Não autenticado? ]
                                   ↙         ↘
                          Tem conta?      Não tem conta
                          Login Form      Registro Form
                                   ↘         ↙
                             Autenticado ✓
                                   ↓
                        Confirma plano + dados
                                   ↓
                   POST /api/v1/checkout/create-session
                                   ↓
                        Redireciona → Stripe Checkout
                                   ↓
                   Stripe → /api/webhooks/stripe
                          (subscription.created)
                                   ↓
                        Redireciona → /portal/dashboard?success=true
```

### API Endpoints de Checkout

```
GET  /api/v1/checkout/[planId]
     ← valida se plano existe e retorna dados

POST /api/v1/checkout/create-session
Body: { planId: string }
Response 200: { checkoutUrl: string }
```

### Implementação Stripe

```typescript
// Criar sessão de checkout Stripe
const session = await stripe.checkout.sessions.create({
  customer: user.stripeCustomerId,
  mode: 'subscription',
  line_items: [{ price: plan.stripePriceId, quantity: 1 }],
  success_url: `${APP_URL}/portal/dashboard?success=true`,
  cancel_url: `${APP_URL}/planos?canceled=true`,
  metadata: { userId: user.id, planId: plan.id },
});
```

### Segurança

- Usuário deve estar autenticado para criar checkout session
- Validar que `planId` existe e `isActive: true`
- Nunca retornar `stripePriceId` para o cliente

### Componente

- `CheckoutPlanSummary` — card resumo do plano selecionado
- `CheckoutAuthGate` — login/registro inline antes de prosseguir
- `CheckoutCTA` — botão "Assinar agora" → cria sessão Stripe

---

## 5. Blog

### Rotas

- `/blog` — Listagem paginada de posts publicados
- `/blog/[slug]` — Post individual com layout de artigo

### ISR — Revalidação a cada 60 segundos

```typescript
// app/(marketing)/blog/page.tsx
export const revalidate = 60;

// app/(marketing)/blog/[slug]/page.tsx
export const revalidate = 60;
export async function generateStaticParams() {
  const posts = await getAllPublishedPostSlugs();
  return posts.map(({ slug }) => ({ slug }));
}
```

### API Endpoints

```
GET /api/v1/public/posts
    ?page=1&limit=9

Response 200:
{
  "data": [
    {
      "slug": "beneficios-pilates-para-coluna",
      "title": "7 Benefícios do Pilates para a Coluna",
      "excerpt": "Descubra como o pilates pode transformar...",
      "coverUrl": "https://minio.xxx/posts/cover.jpg",
      "publishedAt": "2026-03-15T00:00:00Z",
      "author": { "name": "Ana Lima" }
    }
  ],
  "meta": { "total": 24, "page": 1, "limit": 9, "totalPages": 3 }
}

GET /api/v1/public/posts/:slug
Response 200: { "data": { ...fullPost } }
```

### SEO por Post

```typescript
// generateMetadata por post
export async function generateMetadata({ params }) {
  const post = await getPostBySlug(params.slug);
  return {
    title: post.metaTitle || post.title,
    description: post.metaDesc || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverUrl],
    },
  };
}
```

### Componentes

- `PostGrid` — grid 3 colunas (1 mobile, 2 tablet, 3 desktop)
- `PostCard` — capa, título, excerpt, data, autor
- `PostArticle` — layout de artigo com tipografia otimizada
- `PostCTA` — CTA ao final do artigo ("Quer experimentar? Ver planos")

---

## 6. Galeria de Fotos

### Rota: `/galeria`

### ISR — Revalidação a cada 300 segundos

### API Endpoint

```
GET /api/v1/public/gallery

Response 200:
{
  "data": [
    {
      "id": "uuid",
      "url": "https://minio.xxx/gallery/foto1.jpg",
      "altText": "Aula de Pilates Reformer",
      "title": "Studio Principal"
    }
  ]
}
```

### Componentes

- `GalleryMasonry` — grid masonry responsivo com lazy loading
- `ImageLightbox` — visualizador full-screen ao clicar
- Imagens servidas via MinIO com otimização Next.js Image

---

## 7. Formulário de Contato

### Rota: `/contato`

### Funcionalidades

- Nome, e-mail, telefone, mensagem
- Rate limiting: máximo 3 submissões por IP por hora
- Cria `Lead` no banco com status `NEW`
- Envia e-mail de notificação para admin
- Envia e-mail de confirmação para lead

### API Endpoint

```
POST /api/v1/public/leads
Body:
{
  name:    string (min 2, max 100)
  email:   string (email)
  phone:   string? (max 20)
  message: string (min 10, max 2000)
  source:  "site"
  utm:     object? (capturado automático da URL)
}

Response 201:
{
  "data": { "message": "Thank you! We will contact you soon." }
}
```

### Proteção Anti-Spam

```typescript
// Rate limiting por IP (usando upstash/ratelimit ou header X-Forwarded-For)
const { success } = await rateLimit.limit(ip);
if (!success) return tooManyRequests();

// Honeypot field (campo oculto)
if (body.website) return tooManyRequests(); // bot preencheu campo oculto
```

### Componentes

- `ContactForm` — formulário com loading state e feedback
- `ContactInfo` — endereço, telefone, Instagram, horários
- `SuccessMessage` — confirmação após envio

---

## 8. Página de Indicação

### Rota: `/indicacao/[code]`

### Funcionalidades

- Validar se código de indicação existe
- Exibir nome da pessoa que indicou ("Maria convidou você!")
- Pré-preencher formulário de cadastro
- Ao cadastrar → vincular `Referral` no banco

### Fluxo

```
1. /indicacao/MARIA2026
2. GET /api/v1/public/referrals/MARIA2026 → valida código
3. Exibe landing personalizada com nome da indicante
4. Lead clica "Quero me cadastrar" → /cadastro?ref=MARIA2026
5. Ao criar conta → buscar Referral com code MARIA2026
6. Vincular referredId ao Referral criado
7. Status do Referral → PENDING (vira CONVERTED quando assinar)
```

### API Endpoint

```
GET /api/v1/public/referrals/[code]

Response 200: { "data": { "referrerName": "Maria" } }
Response 404: { "error": "Not Found" }
```

---

## SEO — Configuração Global

### Metadata padrão (layout.tsx)

```typescript
export const metadata: Metadata = {
  title: {
    default: 'Brazilian Core Pilates — Studio Premium em [Cidade]',
    template: '%s | Brazilian Core Pilates',
  },
  description: 'Studio de pilates boutique com método exclusivo...',
  keywords: ['pilates', 'studio pilates', 'pilates reformer', ...],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://braziliancorepilates.com',
    siteName: 'Brazilian Core Pilates',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};
```

### Sitemap Automático

```typescript
// app/sitemap.ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPublishedPosts();
  return [
    { url: '/', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: '/aulas', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: '/planos', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: '/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...posts.map(post => ({
      url: `/blog/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
```

---

## Marketing & Tracking

### Scripts (via GTM)

```typescript
// app/(marketing)/layout.tsx
// Google Tag Manager via next/script
<Script id="gtm" strategy="afterInteractive">
  {`(function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXX');`}
</Script>
```

### Eventos Rastreados

| Evento | Trigger |
|--------|---------|
| `lead_generated` | Submit formulário de contato |
| `plan_viewed` | Visita à página de planos |
| `checkout_started` | Clique em "Assinar agora" |
| `signup_completed` | Registro concluído |
| `class_booked` | Agendamento de aula |

---

## Design Visual — Site Público

### Hero Section

```
Background: linear-gradient(135deg, #0B0F14 0%, #121821 100%)
Overlay de imagem com opacity 40%
Headline: Poppins SemiBold 56px (mobile: 36px)
Cor: #EAECEF
Destaque da headline: #D4AF37 (dourado)
CTA primário: bg #D4AF37, text #0B0F14, hover #F2D27A
CTA secundário: border #D4AF37, text #D4AF37, transparent bg
```

### Navbar

```
Background: rgba(11,15,20,0.95) com backdrop-blur
Logo à esquerda
Links: Aulas · Planos · Blog · Contato
CTA: "Entrar" (ghost) + "Começar agora" (gold)
Mobile: hamburger menu com slide-in drawer
```

### Footer

```
Background: #0B0F14
Divisor: 1px solid rgba(255,255,255,0.06)
Colunas: Logo+tagline · Navegação · Contato · Redes sociais
Copyright: text #9CA3AF
```

---

## Performance

| Meta | Target |
|------|--------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |
| PageSpeed Mobile | ≥ 90 |
| PageSpeed Desktop | ≥ 95 |

### Otimizações

- `next/image` com lazy loading e blur placeholder
- Fontes com `display: swap` e preload
- Critical CSS inline via Tailwind
- ISR para conteúdo estático do blog/galeria
- Compressão gzip/brotli via Nginx
- CDN para assets MinIO (configurar header `Cache-Control`)

---

## Checklist de Entrega — Stage 3

- [ ] Landing page completa com todas as seções
- [ ] Grade pública de aulas com vagas em tempo real
- [ ] Página de planos com cards e comparativo
- [ ] Checkout integrado ao Stripe (session redirect)
- [ ] Blog listagem e post individual com SEO
- [ ] Galeria com lightbox
- [ ] Formulário de contato com rate limiting
- [ ] Página de indicação vinculada ao referral
- [ ] Sitemap.xml automático
- [ ] Metadata/OpenGraph por página
- [ ] GTM + GA4 + Meta Pixel configurados
- [ ] Navbar responsiva (mobile hamburger)
- [ ] Footer com todos os links
- [ ] PageSpeed ≥ 90 mobile

---

> **Innexar LLC** · Confidencial · Stage 3 v1.0.0
