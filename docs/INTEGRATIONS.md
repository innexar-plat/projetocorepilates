# Integrações — Stripe · Resend · MinIO · Analytics

> **Innexar LLC** · Confidencial · v1.0.0

---

## 1. Stripe

### Configuração

```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});
```

### Produtos e Preços

Os produtos e preços são criados no **Stripe Dashboard** antes do deploy. Os IDs são registrados no seed do banco.

| Plano | Stripe Product | Stripe Price | Interval |
|-------|---------------|-------------|----------|
| Starter | `prod_starter` | `price_starter` | monthly |
| Essential | `prod_essential` | `price_essential` | monthly |
| Premium | `prod_premium` | `price_premium` | monthly |

---

### Fluxos Implementados

#### A. Checkout (nova assinatura)

```typescript
// POST /api/v1/checkout/create-session
async function createCheckoutSession(userId: string, planId: string) {
  const user = await usersRepository.findById(userId);
  const plan = await plansRepository.findById(planId);

  const session = await stripe.checkout.sessions.create({
    customer: user.stripeCustomerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/planos?canceled=true`,
    metadata: { userId: user.id, planId: plan.id },
    locale: 'pt-BR',
  });

  return session.url;
}
```

#### B. Customer Portal (gerenciar assinatura)

```typescript
// POST /api/v1/subscription/portal
async function createPortalSession(userId: string) {
  const user = await usersRepository.findById(userId);

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/portal/conta`,
  });

  return session.url;
}
```

---

### Webhooks

#### Configuração do Endpoint

```
URL de produção: https://braziliancorepilates.com/api/webhooks/stripe
Método: POST
Eventos registrados (no Stripe Dashboard):
  - customer.subscription.created
  - customer.subscription.updated
  - customer.subscription.deleted
  - invoice.payment_succeeded
  - invoice.payment_failed
```

#### Handler do Webhook

```typescript
// app/api/webhooks/stripe/route.ts
import { stripe } from '@/lib/stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;
  }

  return new Response('OK', { status: 200 });
}
```

#### Handlers de Eventos

```typescript
// subscription.created → criar Subscription no banco
async function handleSubscriptionCreated(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  const planId = sub.metadata.planId;

  await subscriptionsRepository.create({
    userId,
    planId,
    stripeSubscriptionId: sub.id,
    status: sub.status.toUpperCase() as SubscriptionStatus,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
  });
}

// invoice.payment_succeeded → registrar Payment + resetar classesUsed
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Registrar pagamento
  await paymentsRepository.create({
    userId: user.id,
    stripeInvoiceId: invoice.id,
    amount: invoice.amount_paid / 100,
    status: 'SUCCEEDED',
    description: invoice.lines.data[0]?.description,
  });

  // Reset de aulas usadas (novo ciclo)
  await subscriptionsRepository.resetClassesUsed(subscription.id);

  // Enviar e-mail de confirmação
  await resend.emails.send(paymentConfirmedEmail(user, invoice.amount_paid / 100));
}

// invoice.payment_failed → marcar PAST_DUE + notificar
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  await subscriptionsRepository.updateStatus(subscription.id, 'PAST_DUE');
  await resend.emails.send(paymentFailedEmail(user));
}
```

---

### Idempotência dos Webhooks

Stripe pode reenviar eventos. Para evitar processamento duplicado:

```typescript
// Verificar se evento já foi processado
const existing = await paymentsRepository.findByInvoiceId(invoice.id);
if (existing) return; // Já processado, ignorar
```

---

## 2. Resend + React Email

### Configuração

```typescript
// lib/resend.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  react,
}: {
  to: string;
  subject: string;
  react: React.ReactElement;
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    react,
  });

  if (error) {
    console.error('Email send failed:', error);
    // Não lançar erro — email failure não deve quebrar o fluxo principal
  }
}
```

### Templates de E-mail

#### Boas-vindas

```typescript
// emails/welcome.tsx
export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#0B0F14', fontFamily: 'Inter, sans-serif' }}>
        <Container>
          <Img src="logo.png" alt="Brazilian Core Pilates" />
          <Heading style={{ color: '#D4AF37' }}>
            Bem-vinda, {name}!
          </Heading>
          <Text style={{ color: '#EAECEF' }}>
            Sua conta foi criada com sucesso. Explore nossos planos e comece
            sua jornada no pilates.
          </Text>
          <Button href={`${APP_URL}/planos`} style={{ background: '#D4AF37' }}>
            Ver planos
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Todos os E-mails do Sistema

| Template | Trigger | Destinatário |
|----------|---------|-------------|
| `welcome.tsx` | Cadastro | Aluno |
| `payment-confirmed.tsx` | Pagamento aprovado | Aluno |
| `payment-failed.tsx` | Pagamento recusado | Aluno |
| `booking-confirmed.tsx` | Agendamento de aula | Aluno |
| `booking-canceled.tsx` | Cancelamento de aula | Aluno |
| `waitlist-promoted.tsx` | Vaga aberta na fila | Aluno |
| `session-canceled.tsx` | Sessão cancelada pelo admin | Aluno |
| `ticket-reply.tsx` | Admin responde ticket | Aluno |
| `new-lead.tsx` | Lead no formulário | Admin |
| `password-reset.tsx` | Solicitar reset de senha | Aluno |

---

## 3. MinIO

### Configuração

```typescript
// lib/minio.ts
import * as Minio from 'minio';

export const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT!,
  port: parseInt(process.env.MINIO_PORT!),
  useSSL: process.env.NODE_ENV === 'production',
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
});

export const BUCKET = process.env.MINIO_BUCKET!;
```

### Upload de Imagem (Galeria)

```typescript
// modules/content/services/gallery.service.ts
async function uploadImage(file: File): Promise<string> {
  // Validações de segurança
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('Invalid file type. Only JPG, PNG, WEBP allowed.');
  }
  if (file.size > 5 * 1024 * 1024) { // 5MB
    throw new ValidationError('File too large. Maximum 5MB.');
  }

  // Gerar nome único
  const ext = file.type.split('/')[1];
  const filename = `gallery/${crypto.randomUUID()}.${ext}`;

  // Upload via stream
  const buffer = Buffer.from(await file.arrayBuffer());
  await minio.putObject(BUCKET, filename, buffer, file.size, {
    'Content-Type': file.type,
  });

  // Construir URL pública
  return `https://${process.env.MINIO_ENDPOINT}/${BUCKET}/${filename}`;
}

async function deleteImage(url: string): Promise<void> {
  const filename = url.split(`/${BUCKET}/`)[1];
  await minio.removeObject(BUCKET, filename);
}
```

### Estrutura de Buckets e Pastas

```
core-pilates-media/
├── gallery/         ← fotos da galeria do site
├── posts/           ← capas de posts do blog
└── avatars/         ← (futuro) fotos de perfil de alunos
```

### Next.js Image com MinIO

```typescript
// next.config.ts — permitir domínio MinIO
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: process.env.MINIO_ENDPOINT,
        pathname: `/${process.env.MINIO_BUCKET}/**`,
      },
    ],
  },
};
```

---

## 4. Analytics & Tracking

### Google Tag Manager

```typescript
// Instalação via Script (app/(marketing)/layout.tsx)
// GTM carregado apenas no site público, não no portal/admin
<Script
  id="gtm-script"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
    `,
  }}
/>
```

### Google Analytics 4

Configurado via GTM. Eventos customizados enviados via `dataLayer`:

```typescript
// lib/analytics.ts
export function trackEvent(
  event: string,
  params?: Record<string, string | number>,
) {
  if (typeof window === 'undefined') return;
  window.dataLayer?.push({ event, ...params });
}

// Uso nos componentes
trackEvent('plan_viewed', { plan_name: 'Essential', plan_price: 347 });
trackEvent('checkout_started', { plan_id: planId });
trackEvent('lead_generated', { source: 'contact_form' });
```

### Meta Pixel

```typescript
// Também via GTM tag
// Eventos Meta: Lead, InitiateCheckout, Purchase
```

### UTM Tracking nos Leads

```typescript
// Captura UTM params do URL e salva no Lead
function captureUTM(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  return {
    source: params.get('utm_source') || '',
    medium: params.get('utm_medium') || '',
    campaign: params.get('utm_campaign') || '',
  };
}

// No formulário de contato:
const utm = captureUTM();
await fetch('/api/v1/public/leads', {
  method: 'POST',
  body: JSON.stringify({ ...formData, utm }),
});
```

---

## 5. Internacionalização (next-intl)

### Idiomas suportados: PT (padrão) · EN · ES

```typescript
// i18n/routing.ts
export const routing = defineRouting({
  locales: ['pt', 'en', 'es'],
  defaultLocale: 'pt',
});
```

### Estrutura de Mensagens

```
messages/
├── pt.json   ← Português (default)
├── en.json   ← English
└── es.json   ← Español
```

### Uso nos Componentes

```typescript
import { useTranslations } from 'next-intl';

export function HeroSection() {
  const t = useTranslations('Hero');
  return (
    <h1>{t('headline')}</h1>  // "Transforme seu corpo..." / "Transform your body..."
  );
}
```

> **Fase 1:** Implementar apenas PT. EN e ES adicionados na versão 1.1 após validação do produto.

---

## 6. Nginx — Configuração de Produção

```nginx
# /etc/nginx/sites-available/core-pilates
server {
    listen 443 ssl http2;
    server_name braziliancorepilates.com www.braziliancorepilates.com;

    ssl_certificate /etc/letsencrypt/live/braziliancorepilates.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/braziliancorepilates.com/privkey.pem;

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' *.googletagmanager.com *.facebook.net; ..." always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Rate limit em rotas públicas sensíveis
    location /api/v1/public/leads {
        limit_req zone=api burst=5 nodelay;
        proxy_pass http://localhost:3000;
    }
}

server {
    listen 80;
    server_name braziliancorepilates.com www.braziliancorepilates.com;
    return 301 https://$host$request_uri;
}
```

---

## 7. CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run test -- --coverage
      - name: Coverage check
        run: npx jest --coverage --coverageThreshold='{"global":{"lines":90}}'

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: |
            cd /var/www/core-pilates
            git pull origin main
            npm ci --production
            npx prisma migrate deploy
            npm run build
            pm2 restart core-pilates
```

### Secrets necessários no GitHub

| Secret | Descrição |
|--------|-----------|
| `SERVER_HOST` | IP do servidor Innexar |
| `SERVER_USER` | Usuário SSH |
| `SERVER_SSH_KEY` | Chave SSH privada |

---

> **Innexar LLC** · Confidencial · Integrations v1.0.0
