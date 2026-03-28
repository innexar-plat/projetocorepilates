/**
 * OpenAPI 3.0 specification for the Brazilian Core Pilates API.
 * Served at GET /api/docs and rendered at GET /api/docs/ui
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://braziliancorepilates.com';

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Brazilian Core Pilates — API',
    description:
      'REST API for the Brazilian Core Pilates platform. Handles user auth, class management, bookings, subscriptions, payments, leads, support tickets, and referrals.',
    version: '1.0.0',
    contact: {
      name: 'Core Pilates Team',
      url: APP_URL,
    },
  },
  servers: [
    { url: `${APP_URL}/api/v1`, description: 'Production' },
    { url: 'http://localhost:3000/api/v1', description: 'Local development' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and password management' },
    { name: 'Users', description: 'User profile and account management' },
    { name: 'Classes', description: 'Pilates class catalog' },
    { name: 'Sessions', description: 'Class sessions (scheduled occurrences)' },
    { name: 'Bookings', description: 'Class booking and waitlist' },
    { name: 'Plans', description: 'Subscription plans' },
    { name: 'Subscriptions', description: 'User subscriptions and Stripe checkout' },
    { name: 'Payments', description: 'Payment history' },
    { name: 'Leads', description: 'Lead capture and management' },
    { name: 'Referrals', description: 'Referral program' },
    { name: 'Support', description: 'Support tickets' },
    { name: 'Client Profiles', description: 'Client fitness profiles and PAR-Q' },
    { name: 'Contracts', description: 'Digital contracts and signatures' },
    { name: 'Admin — Users', description: 'Admin: user management' },
    { name: 'Admin — Classes', description: 'Admin: class and session management' },
    { name: 'Admin — Analytics', description: 'Admin: dashboard analytics' },
    { name: 'Admin — Lists', description: 'Admin: paginated data lists' },
    { name: 'Admin — Leads', description: 'Admin: lead pipeline management' },
    { name: 'System', description: 'Health check and system routes' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'NextAuth session JWT. Pass the access token from the NextAuth session.',
      },
    },
    schemas: {
      Pagination: {
        type: 'object',
        properties: {
          total: { type: 'integer', example: 150 },
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          totalPages: { type: 'integer', example: 8 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          requestId: { type: 'string', format: 'uuid' },
          statusCode: { type: 'integer', example: 400 },
          error: { type: 'string', example: 'Bad Request' },
          message: { type: 'string', example: 'Validation failed' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Maria Souza' },
          email: { type: 'string', format: 'email', example: 'maria@email.com' },
          role: { type: 'string', enum: ['USER', 'ADMIN'], example: 'USER' },
          phone: { type: 'string', example: '+5511999999999', nullable: true },
          locale: { type: 'string', example: 'pt' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Class: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Pilates Reformer' },
          description: { type: 'string', nullable: true },
          instructor: { type: 'string', example: 'João Silva' },
          maxCapacity: { type: 'integer', example: 10 },
          durationMin: { type: 'integer', example: 60 },
          dayOfWeek: {
            type: 'string',
            enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
          },
          startTime: { type: 'string', example: '08:00' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ClassSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          classId: { type: 'string', format: 'uuid' },
          date: { type: 'string', format: 'date', example: '2026-04-07' },
          status: {
            type: 'string',
            enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'],
            example: 'SCHEDULED',
          },
          currentCapacity: { type: 'integer', example: 3 },
          notes: { type: 'string', nullable: true },
          class: { $ref: '#/components/schemas/Class' },
          _count: {
            type: 'object',
            properties: { bookings: { type: 'integer', example: 3 } },
          },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          classSessionId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['CONFIRMED', 'CANCELED', 'WAITLIST'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Plan: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Plano Mensal' },
          description: { type: 'string', nullable: true },
          price: { type: 'number', example: 199.9 },
          currency: { type: 'string', example: 'BRL' },
          intervalCount: { type: 'integer', example: 1 },
          classesPerMonth: { type: 'integer', example: 8, nullable: true },
          isActive: { type: 'boolean', example: true },
        },
      },
      Subscription: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          planId: { type: 'string', format: 'uuid' },
          status: { type: 'string', enum: ['ACTIVE', 'CANCELED', 'PAST_DUE'] },
          currentPeriodStart: { type: 'string', format: 'date-time' },
          currentPeriodEnd: { type: 'string', format: 'date-time' },
          cancelAtPeriodEnd: { type: 'boolean' },
          classesUsedThisMonth: { type: 'integer', example: 2 },
          plan: { $ref: '#/components/schemas/Plan' },
        },
      },
      Lead: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Ana Lima' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string', nullable: true },
          source: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SupportTicket: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          subject: { type: 'string', example: 'Não consigo cancelar minha aula' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Referral: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          referrerId: { type: 'string', format: 'uuid' },
          referredId: { type: 'string', format: 'uuid', nullable: true },
          code: { type: 'string', example: 'ABCDE12345' },
          status: { type: 'string', enum: ['PENDING', 'CONVERTED'] },
          convertedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    // ─── AUTH ──────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Maria Souza' },
                  email: { type: 'string', format: 'email', example: 'maria@email.com' },
                  password: { type: 'string', minLength: 8, example: 'Senha@123' },
                  phone: { type: 'string', example: '+5511999999999' },
                  referralCode: { type: 'string', example: 'ABCDE12345' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created successfully' },
          '409': { description: 'Email already in use' },
        },
      },
    },
    '/auth/forgot-password': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset email',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: { email: { type: 'string', format: 'email' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Reset email sent (anti-enumeration: always 200)' },
        },
      },
    },
    '/auth/reset-password': {
      post: {
        tags: ['Auth'],
        summary: 'Reset password using token from email',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token', 'password'],
                properties: {
                  token: { type: 'string' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password updated successfully' },
          '400': { description: 'Invalid or expired token' },
        },
      },
    },
    // ─── USERS ─────────────────────────────────────────────────────────────────
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get authenticated user profile',
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { properties: { data: { $ref: '#/components/schemas/User' } } },
              },
            },
          },
          '401': { description: 'Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user profile (name, phone, locale)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  locale: { type: 'string', enum: ['en', 'pt', 'es'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Updated user profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/users/me/change-password': {
      post: {
        tags: ['Users'],
        summary: 'Change password for authenticated user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                  currentPassword: { type: 'string' },
                  newPassword: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Password changed' },
          '400': { description: 'Current password incorrect' },
        },
      },
    },
    '/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Upload user avatar (JPEG/PNG/WebP, max 5MB)',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } } },
        },
        responses: {
          '200': { description: 'Avatar uploaded', content: { 'application/json': { schema: { properties: { data: { properties: { avatarUrl: { type: 'string' } } } } } } } },
        },
      },
    },
    // ─── CLASSES ───────────────────────────────────────────────────────────────
    '/classes': {
      get: {
        tags: ['Classes'],
        summary: 'List all active classes',
        security: [],
        responses: {
          '200': {
            description: 'Array of classes',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Class' } } } },
              },
            },
          },
        },
      },
    },
    '/classes/{id}': {
      get: {
        tags: ['Classes'],
        summary: 'Get a single class by ID',
        security: [],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Class detail' },
          '404': { description: 'Not found' },
        },
      },
    },
    // ─── SESSIONS ──────────────────────────────────────────────────────────────
    '/sessions': {
      get: {
        tags: ['Sessions'],
        summary: 'List upcoming class sessions',
        security: [],
        parameters: [
          { name: 'classId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 30, maximum: 100 } },
        ],
        responses: {
          '200': {
            description: 'Upcoming sessions',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/ClassSession' } } } },
              },
            },
          },
        },
      },
    },
    // ─── BOOKINGS ──────────────────────────────────────────────────────────────
    '/bookings': {
      get: {
        tags: ['Bookings'],
        summary: "List authenticated user's bookings",
        responses: {
          '200': { description: 'Booking list' },
          '401': { description: 'Unauthorized' },
        },
      },
      post: {
        tags: ['Bookings'],
        summary: 'Book a class session (or join waitlist)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['classSessionId'],
                properties: { classSessionId: { type: 'string', format: 'uuid' } },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Booking confirmed or waitlisted' },
          '409': { description: 'Already booked' },
        },
      },
    },
    '/bookings/{id}/cancel': {
      post: {
        tags: ['Bookings'],
        summary: 'Cancel a booking',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Booking canceled' },
          '404': { description: 'Booking not found' },
        },
      },
    },
    // ─── PLANS ─────────────────────────────────────────────────────────────────
    '/plans': {
      get: {
        tags: ['Plans'],
        summary: 'List all active subscription plans',
        security: [],
        responses: {
          '200': {
            description: 'Active plans',
            content: {
              'application/json': {
                schema: { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Plan' } } } },
              },
            },
          },
        },
      },
    },
    // ─── SUBSCRIPTIONS ─────────────────────────────────────────────────────────
    '/subscriptions': {
      get: {
        tags: ['Subscriptions'],
        summary: "Get authenticated user's subscription",
        responses: {
          '200': { description: 'Active subscription with plan', content: { 'application/json': { schema: { properties: { data: { $ref: '#/components/schemas/Subscription' } } } } } },
          '404': { description: 'No subscription found' },
        },
      },
    },
    '/subscriptions/checkout': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Create a Stripe Checkout session',
        description: 'Creates a Stripe hosted checkout page for the user to subscribe to a plan.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['planId'],
                properties: {
                  planId: { type: 'string', format: 'uuid' },
                  successUrl: { type: 'string', format: 'uri' },
                  cancelUrl: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Stripe checkout URL',
            content: { 'application/json': { schema: { properties: { data: { properties: { url: { type: 'string' }, sessionId: { type: 'string' } } } } } } },
          },
        },
      },
    },
    '/subscriptions/portal': {
      post: {
        tags: ['Subscriptions'],
        summary: 'Create a Stripe Billing Portal session',
        description: 'Redirects the user to the Stripe self-service portal to manage billing.',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', properties: { returnUrl: { type: 'string', format: 'uri' } } },
            },
          },
        },
        responses: {
          '200': { description: 'Portal URL', content: { 'application/json': { schema: { properties: { data: { properties: { url: { type: 'string' } } } } } } } },
        },
      },
    },
    '/subscriptions/cancel': {
      delete: {
        tags: ['Subscriptions'],
        summary: 'Cancel subscription at period end',
        description: 'Cancels the active subscription gracefully. It remains active until the billing period ends.',
        responses: {
          '204': { description: 'Cancellation scheduled' },
          '404': { description: 'No active subscription' },
        },
      },
    },
    // ─── PAYMENTS ──────────────────────────────────────────────────────────────
    '/payments': {
      get: {
        tags: ['Payments'],
        summary: "List authenticated user's payment history",
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': { description: 'Payment history with pagination' },
        },
      },
    },
    // ─── LEADS ─────────────────────────────────────────────────────────────────
    '/leads': {
      post: {
        tags: ['Leads'],
        summary: 'Capture a lead (contact form)',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email'],
                properties: {
                  name: { type: 'string', example: 'Carlos Silva' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  source: { type: 'string', example: 'instagram' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Lead captured or existing lead returned' },
          '429': { description: 'Rate limit exceeded' },
        },
      },
    },
    // ─── REFERRALS ─────────────────────────────────────────────────────────────
    '/referrals': {
      get: {
        tags: ['Referrals'],
        summary: "Get authenticated user's referral code and history",
        responses: {
          '200': { description: 'Referral code and conversion list' },
        },
      },
    },
    '/referrals/apply': {
      post: {
        tags: ['Referrals'],
        summary: 'Apply a referral code to the current account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: { code: { type: 'string', example: 'ABCDE12345' } },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Referral applied successfully' },
          '404': { description: 'Code not found' },
          '409': { description: 'Code already used or self-referral' },
        },
      },
    },
    // ─── SUPPORT ───────────────────────────────────────────────────────────────
    '/support/tickets': {
      get: {
        tags: ['Support'],
        summary: "List user's support tickets (admin sees all with pagination)",
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Admin only' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Admin only' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] }, description: 'Admin only' },
        ],
        responses: {
          '200': { description: 'Ticket list' },
        },
      },
      post: {
        tags: ['Support'],
        summary: 'Open a new support ticket',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['subject', 'message'],
                properties: {
                  subject: { type: 'string', example: 'Problema com agendamento' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Ticket created' },
        },
      },
    },
    '/support/tickets/{id}': {
      get: {
        tags: ['Support'],
        summary: 'Get ticket details with messages',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Ticket with message thread' },
          '403': { description: 'Forbidden — not your ticket' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/support/tickets/{id}/reply': {
      post: {
        tags: ['Support'],
        summary: 'Reply to a support ticket',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } },
            },
          },
        },
        responses: {
          '200': { description: 'Reply added' },
        },
      },
    },
    // ─── CLIENT PROFILES ───────────────────────────────────────────────────────
    '/client-profiles/me': {
      get: {
        tags: ['Client Profiles'],
        summary: "Get authenticated user's fitness profile",
        responses: {
          '200': { description: 'Client profile with PAR-Q data' },
          '404': { description: 'Profile not found' },
        },
      },
      post: {
        tags: ['Client Profiles'],
        summary: "Create or update authenticated user's fitness profile",
        responses: { '201': { description: 'Profile saved' } },
      },
    },
    // ─── CONTRACTS ─────────────────────────────────────────────────────────────
    '/contracts': {
      get: {
        tags: ['Contracts'],
        summary: "Get authenticated user's contracts",
        responses: { '200': { description: 'Contract list' } },
      },
      post: {
        tags: ['Contracts'],
        summary: 'Create a new contract for the authenticated user',
        responses: { '201': { description: 'Contract created pending signature' } },
      },
    },
    '/contracts/{id}/sign': {
      post: {
        tags: ['Contracts'],
        summary: 'Sign a contract digitally',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Contract signed and archived to MinIO' },
          '409': { description: 'Already signed' },
        },
      },
    },
    // ─── ADMIN — USERS ─────────────────────────────────────────────────────────
    '/admin/users': {
      get: {
        tags: ['Admin — Users'],
        summary: 'List all users (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['USER', 'ADMIN'] } },
        ],
        responses: { '200': { description: 'Paginated user list' }, '403': { description: 'Forbidden' } },
      },
    },
    '/admin/users/{id}': {
      get: {
        tags: ['Admin — Users'],
        summary: 'Get user detail (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'User detail' }, '404': { description: 'Not found' } },
      },
      patch: {
        tags: ['Admin — Users'],
        summary: 'Update user role (admin)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', required: ['role'], properties: { role: { type: 'string', enum: ['USER', 'ADMIN'] } } } } },
        },
        responses: { '200': { description: 'Role updated' } },
      },
      delete: {
        tags: ['Admin — Users'],
        summary: 'Delete user (admin)',
        responses: { '204': { description: 'User deleted' } },
      },
    },
    // ─── ADMIN — CLASSES ───────────────────────────────────────────────────────
    '/admin/classes': {
      post: {
        tags: ['Admin — Classes'],
        summary: 'Create a new class (admin)',
        responses: { '201': { description: 'Class created' } },
      },
    },
    '/admin/classes/{id}': {
      patch: {
        tags: ['Admin — Classes'],
        summary: 'Update a class (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Class updated' } },
      },
      delete: {
        tags: ['Admin — Classes'],
        summary: 'Deactivate a class (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Class deactivated' } },
      },
    },
    '/admin/sessions': {
      post: {
        tags: ['Admin — Classes'],
        summary: 'Create a single class session (admin)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['classId', 'date'],
                properties: {
                  classId: { type: 'string', format: 'uuid' },
                  date: { type: 'string', format: 'date', example: '2026-04-07' },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Session created' } },
      },
    },
    '/admin/sessions/{id}': {
      patch: {
        tags: ['Admin — Classes'],
        summary: 'Update a class session (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['SCHEDULED', 'CANCELED', 'COMPLETED'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Session updated' } },
      },
    },
    '/admin/sessions/generate': {
      post: {
        tags: ['Admin — Classes'],
        summary: 'Bulk generate recurring sessions (admin)',
        description: 'Generates sessions on the class\'s configured dayOfWeek within the given date range.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['classId', 'fromDate', 'toDate'],
                properties: {
                  classId: { type: 'string', format: 'uuid' },
                  fromDate: { type: 'string', format: 'date', example: '2026-04-01' },
                  toDate: { type: 'string', format: 'date', example: '2026-06-30' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Sessions generated',
            content: { 'application/json': { schema: { properties: { data: { properties: { created: { type: 'integer' }, total: { type: 'integer' }, classId: { type: 'string' } } } } } } },
          },
        },
      },
    },
    // ─── ADMIN — ANALYTICS ─────────────────────────────────────────────────────
    '/admin/analytics': {
      get: {
        tags: ['Admin — Analytics'],
        summary: 'Platform dashboard statistics (admin)',
        description: 'Returns users, subscriptions (MRR), bookings, leads, support, and revenue data.',
        responses: {
          '200': {
            description: 'Analytics dashboard data',
            content: {
              'application/json': {
                example: {
                  data: {
                    users: { total: 248, newThisMonth: 18 },
                    subscriptions: { active: 120, pastDue: 4, canceled: 22, trialing: 2, mrr: 23880 },
                    bookings: { totalThisMonth: 340, canceledThisMonth: 12, cancellationRate: '3.53%' },
                    leads: { total: 512, converted: 248, conversionRate: '48.44%', byStatus: {} },
                    support: { openTickets: 7 },
                    revenue: { thisMonth: 23880 },
                    generatedAt: '2026-04-01T00:00:00.000Z',
                  },
                },
              },
            },
          },
          '403': { description: 'Forbidden' },
        },
      },
    },
    // ─── ADMIN — LISTS ─────────────────────────────────────────────────────────
    '/admin/subscriptions': {
      get: {
        tags: ['Admin — Lists'],
        summary: 'Paginated list of all subscriptions (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'CANCELED', 'PAST_DUE'] } },
        ],
        responses: { '200': { description: 'Paginated subscriptions with user + plan data' } },
      },
    },
    '/admin/payments': {
      get: {
        tags: ['Admin — Lists'],
        summary: 'Paginated list of all payments (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['SUCCEEDED', 'FAILED', 'PENDING'] } },
        ],
        responses: { '200': { description: 'Paginated payments with user data' } },
      },
    },
    '/admin/bookings': {
      get: {
        tags: ['Admin — Lists'],
        summary: 'Paginated list of all bookings (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'classSessionId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['CONFIRMED', 'CANCELED', 'WAITLIST'] } },
        ],
        responses: { '200': { description: 'Paginated bookings with user + session data' } },
      },
    },
    '/admin/bookings/{id}': {
      get: {
        tags: ['Admin — Lists'],
        summary: 'Get single booking detail (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Booking with user and session data' }, '404': { description: 'Not found' } },
      },
    },
    // ─── ADMIN — LEADS ─────────────────────────────────────────────────────────
    '/admin/leads': {
      get: {
        tags: ['Admin — Leads'],
        summary: 'Paginated list of all leads (admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or email' },
        ],
        responses: { '200': { description: 'Paginated leads' } },
      },
    },
    '/admin/leads/{id}': {
      get: {
        tags: ['Admin — Leads'],
        summary: 'Get single lead (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Lead detail' }, '404': { description: 'Not found' } },
      },
      patch: {
        tags: ['Admin — Leads'],
        summary: 'Update lead status or notes (admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] },
                  notes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Lead updated' }, '404': { description: 'Not found' } },
      },
    },
    '/admin/client-profiles': {
      get: {
        tags: ['Admin — Lists'],
        summary: 'List incomplete client profiles (admin)',
        responses: { '200': { description: 'List of incomplete profiles' } },
      },
    },
    // ─── SYSTEM ────────────────────────────────────────────────────────────────
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': {
            description: 'System healthy',
            content: { 'application/json': { schema: { properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string', format: 'date-time' } } } } },
          },
        },
      },
    },
  },
} as const;
