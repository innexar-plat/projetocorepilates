# Segurança — Checklist OWASP

> **Innexar LLC** · Confidencial · v1.0.0

---

## Visão Geral

Todas as camadas da plataforma seguem o **OWASP Top 10 (2021)**. Este documento descreve as medidas implementadas em cada categoria, com exemplos práticos de código.

---

## A01 — Broken Access Control

### Medidas Implementadas

**1. Middleware de proteção de rotas**

```typescript
// middleware.ts
export default auth((req) => {
  const isPortal = req.nextUrl.pathname.startsWith('/portal');
  const isAdmin  = req.nextUrl.pathname.startsWith('/admin');
  const isApiAdmin = req.nextUrl.pathname.startsWith('/api/v1/admin');

  if ((isPortal || isAdmin || isApiAdmin) && !req.auth) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if ((isAdmin || isApiAdmin) && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.json({ statusCode: 403, error: 'Forbidden' }, { status: 403 });
  }
});
```

**2. Verificação de ownership nos recursos**

```typescript
// Aluno só acessa seus próprios dados
const booking = await bookingsRepository.findOne({
  where: { id, userId: session.user.id },  // ← userId sempre filtrado
});
if (!booking) throw new NotFoundError('Booking not found');
```

**3. IDs como UUID**

Nunca IDs sequenciais expostos na API — impossível enumerar recursos.

**4. Verificação em cada endpoint**

```typescript
// Nunca confiar apenas no middleware — verificar role no service também
if (session.user.role !== 'ADMIN') throw new ForbiddenError();
```

---

## A02 — Cryptographic Failures

### Medidas Implementadas

**1. HTTPS obrigatório em produção**

Configurado via Nginx com redirect 301 de HTTP para HTTPS e HSTS:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

**2. Hash de senhas com bcrypt**

```typescript
import { hash, compare } from 'bcryptjs';

// Criação
const passwordHash = await hash(password, 12); // salt rounds: 12

// Verificação
const isValid = await compare(password, user.passwordHash);
```

**3. Segredos em variáveis de ambiente**

```bash
# NUNCA no código fonte
STRIPE_SECRET_KEY=sk_live_...
NEXTAUTH_SECRET=...
```

`.env` incluído no `.gitignore`. Segredos gerenciados via GitHub Secrets em CI/CD.

**4. Dados sensíveis nunca retornados na API**

```typescript
// O passwordHash NUNCA é incluído em responses
const user = await db.user.findUnique({
  where: { id },
  select: {          // select explícito — nunca select *
    id: true,
    name: true,
    email: true,
    role: true,
    // passwordHash: false ← omitido
  },
});
```

**5. Tokens de reset de senha com expiração**

```typescript
// Token: UUID + hash + expiração de 1 hora
// Armazenado hasheado no banco, nunca em plaintext
const token = crypto.randomUUID();
const tokenHash = await hash(token, 10);
// Expiração: Date.now() + 1h
```

---

## A03 — Injection

### SQL Injection — Prevenido via Prisma ORM

```typescript
// ✅ Sempre via Prisma — queries parametrizadas automaticamente
const user = await db.user.findUnique({ where: { email } });

// ❌ PROIBIDO — nunca isso
await db.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
```

### NoSQL Injection

Não aplicável (PostgreSQL).

### XSS — Prevenido

```typescript
// Next.js escapa JSX por padrão
// Para HTML dinâmico (blog content), sanitizar antes de salvar:
import DOMPurify from 'isomorphic-dompurify';
const safeContent = DOMPurify.sanitize(rawContent);

// CSP header via Nginx bloqueia scripts não autorizados
```

### Command Injection

```typescript
// Nenhum shell command executado com input do usuário
// MinIO SDK usado via biblioteca (não via CLI)
// Stripe SDK usado via biblioteca (não via CLI)
```

---

## A04 — Insecure Design

### Rate Limiting

```typescript
// Em rotas públicas sensíveis (contact form, login)
// Usando Upstash Rate Limit ou implementação própria via Redis

// Login: máx 5 tentativas por IP em 15 minutos
// Contact form: máx 3 envios por IP por hora
// API geral: apenas via Nginx (30 req/min por IP)
```

### Honeypot Anti-Spam

```typescript
// Campo oculto no formulário de contato
// Bot preenche → request rejeitada silenciosamente
if (body._trap && body._trap !== '') {
  return NextResponse.json({ data: { message: 'Thank you!' } }); // falso positivo
}
```

### Paginação Obrigatória

```typescript
// Nunca retornar listas ilimitadas
const limit = Math.min(parseInt(params.limit ?? '20'), 100); // máx 100
const page  = Math.max(parseInt(params.page ?? '1'), 1);
```

---

## A05 — Security Misconfiguration

### Headers de Segurança (Nginx)

```nginx
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()";
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://api.stripe.com https://vitals.vercel-insights.com;
  frame-src https://js.stripe.com https://hooks.stripe.com;
";
```

### CORS Configurado

```typescript
// next.config.ts
headers: async () => [
  {
    source: '/api/:path*',
    headers: [
      {
        key: 'Access-Control-Allow-Origin',
        value: process.env.NEXT_PUBLIC_APP_URL!, // nunca '*' em produção
      },
    ],
  },
],
```

### Remover X-Powered-By

```typescript
// next.config.ts
const nextConfig = {
  poweredByHeader: false,
};
```

---

## A06 — Vulnerable and Outdated Components

### Automação

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule: { interval: "weekly" }
    open-pull-requests-limit: 5
```

### Auditoria Manual

```bash
# Rodar a cada sprint
npm audit
npm audit fix
```

### Política

- Vulnerabilidades **CRITICAL** → corrigir antes do próximo deploy
- Vulnerabilidades **HIGH** → corrigir na sprint atual
- Dependências atualizadas mensalmente

---

## A07 — Identification and Authentication Failures

### Senha Forte Obrigatória

```typescript
// Zod schema
const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 characters')
  .max(128, 'Maximum 128 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Must contain at least one number');
```

### Sessão Segura (NextAuth v5)

```typescript
// lib/auth.ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 15 * 60 }, // 15 minutos
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id   = token.id as string;
      session.user.role = token.role as UserRole;
      return session;
    },
  },
});
```

### Proteção Contra Brute Force

```typescript
// Máximo 5 tentativas de login por IP em 15 minutos
// Após limite: retornar 429 com Retry-After header
// Implementado via middleware de rate limiting
```

### Token de Reset de Senha

```typescript
// Expiração de 1 hora
// Token de uso único (deletado após uso)
// Enviado apenas por e-mail — nunca exibido na URL de forma útil sem hash
```

---

## A08 — Software and Data Integrity Failures

### Validação de Webhook Stripe

```typescript
// SEMPRE verificar assinatura do webhook
try {
  event = stripe.webhooks.constructEvent(
    rawBody,    // raw string, não parseado
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!,
  );
} catch {
  return new Response('Invalid signature', { status: 400 });
}
```

### Validação de Input em Toda API

```typescript
// Zod em todos os endpoints
const body = createUserSchema.safeParse(await request.json());
if (!body.success) {
  return NextResponse.json({
    statusCode: 400,
    error: 'Bad Request',
    details: body.error.issues.map(i => ({
      field: i.path.join('.'),
      message: i.message,
    })),
  }, { status: 400 });
}
```

---

## A09 — Security Logging and Monitoring Failures

### O Que Logar

```typescript
// ✅ Logar eventos de segurança
console.error('[AUTH] Login failed:', { ip, email: maskedEmail, reason });
console.warn('[AUTH] Too many login attempts:', { ip });
console.info('[ADMIN] Plan deactivated:', { adminId, planId });
console.info('[PAYMENT] Subscription canceled:', { userId, subscriptionId });

// ❌ NUNCA logar dados sensíveis
// console.log(password)        ← proibido
// console.log(stripeSecretKey) ← proibido
// console.log(user.passwordHash) ← proibido
```

### Mascaramento de Dados

```typescript
// E-mail mascarado em logs
const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1***$2');
// "maria@email.com" → "ma***@email.com"
```

---

## A10 — Server-Side Request Forgery (SSRF)

### Mídia de Usuários via MinIO

```typescript
// URLs de imagem NUNCA são abertas pelo servidor via fetch()
// O servidor apenas:
//   1. Recebe o FILE binário do cliente
//   2. Faz upload direto para MinIO via SDK
//   3. Retorna a URL pública
// O servidor nunca faz fetch() de URLs enviadas pelo usuário
```

### Validação de URLs

```typescript
// Se necessário aceitar URL de imagem de capa:
const allowedHosts = ['minio.braziliancorepilates.com'];
const url = new URL(inputUrl);
if (!allowedHosts.includes(url.hostname)) {
  throw new ValidationError('Invalid image URL host');
}
```

---

## Checklist de Segurança por PR

Antes de cada merge, verificar:

### Autenticação e Autorização
- [ ] Endpoint protegido com verificação de sessão
- [ ] Role verificada explicitamente (não apenas no middleware)
- [ ] Dados filtrados por `userId` (ownership check)

### Input e Output
- [ ] Input validado com Zod
- [ ] Resposta não inclui campos sensíveis (`passwordHash`, tokens)
- [ ] Paginação implementada em listagens

### Dados Sensíveis
- [ ] Nenhum segredo no código (apenas `process.env`)
- [ ] Dados sensíveis não aparecem em logs
- [ ] Senha hasheada com bcrypt ≥ 12 rounds

### Banco de Dados
- [ ] Queries via Prisma (sem interpolação direta)
- [ ] `select` explícito (nunca buscar todos os campos desnecessariamente)
- [ ] Migrations versionadas e revisadas

### Arquivos
- [ ] Tipo MIME validado no servidor (não apenas extensão)
- [ ] Tamanho máximo verificado
- [ ] Nome do arquivo gerado pelo servidor (UUID), nunca pelo cliente

---

## Política de Incidentes

| Severidade | Exemplo | SLA de Resposta |
|-----------|---------|----------------|
| **Crítico** | Vazamento de dados, acesso não autorizado | 1 hora |
| **Alto** | Vulnerabilidade de injeção, bypass de auth | 4 horas |
| **Médio** | XSS persistente, IDOR | 24 horas |
| **Baixo** | Headers ausentes, dependência vulnerável | 1 semana |

---

> **Innexar LLC** · Confidencial · Security v1.0.0
