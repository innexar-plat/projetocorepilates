import { httpGet, httpPost, httpPatch, httpDelete, httpPostForm } from '@/services/http-client';

// -- Blog Posts ----------------------------------------------------------------

export type AdminPost = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverUrl?: string;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string; avatarUrl?: string | null };
};

export type CreatePostDto = {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

// -- Gallery ------------------------------------------------------------------

export type AdminGalleryImage = {
  id: string;
  title?: string;
  album?: string;
  url: string;
  altText?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
};

export type CreateGalleryImageDto = {
  url: string;
  title?: string;
  album?: string;
  altText?: string;
  order?: number;
  isActive?: boolean;
};

export type GalleryUploadFailure = {
  name: string;
  reason: string;
};

export type GalleryUploadResult = {
  created: AdminGalleryImage[];
  failed: GalleryUploadFailure[];
};

export type AdminGalleryAlbum = {
  id: string;
  name: string;
  description?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateGalleryAlbumDto = {
  name: string;
  description?: string;
  order?: number;
  isActive?: boolean;
};

// -- Site Settings ------------------------------------------------------------

export type SiteSetting = {
  id?: string;
  key: string;
  value: string;
  group: string;
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export type AdminAnalytics = {
  users: { total: number; newThisMonth: number };
  subscriptions: { active: number; pastDue: number; canceled: number; trialing: number; mrr: number };
  bookings: { totalThisMonth: number; canceledThisMonth: number; cancellationRate: number };
  leads: { total: number; converted: number; conversionRate: number };
  support: { openTickets: number };
  revenue: { thisMonth: number };
};

// ── Users ─────────────────────────────────────────────────────────────────────

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  phone?: string;
};

export type AdminUserDetail = AdminUser & {
  deletedAt?: string | null;
};

// ── Plans ─────────────────────────────────────────────────────────────────────

export type AdminPlan = {
  id: string;
  name: string;
  description?: string;
  price: number;
  isPromotion: boolean;
  originalPrice?: number | null;
  promotionalPrice?: number | null;
  classesPerMonth: number;
  stripePriceId?: string | null;
  stripeProductId?: string | null;
  isActive: boolean;
  order: number;
};

export type CreatePlanDto = {
  name: string;
  description?: string;
  price: number;
  isPromotion?: boolean;
  originalPrice?: number;
  promotionalPrice?: number;
  classesPerMonth: number;
  stripePriceId?: string;
  stripeProductId?: string;
  order?: number;
};

export type UpdatePlanDto = {
  name?: string;
  description?: string;
  price?: number;
  isPromotion?: boolean;
  originalPrice?: number;
  promotionalPrice?: number;
  classesPerMonth?: number;
  stripePriceId?: string;
  stripeProductId?: string;
  isActive?: boolean;
  order?: number;
};

// ── Classes ───────────────────────────────────────────────────────────────────

export type AdminClass = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  instructor: string;
  maxCapacity: number;
  durationMin: number;
  dayOfWeek: string;
  startTime: string;
  isActive: boolean;
  createdAt: string;
};

export type CreateClassDto = {
  title: string;
  description?: string;
  imageUrl?: string;
  instructor: string;
  maxCapacity: number;
  durationMin: number;
  dayOfWeek: string;
  startTime: string;
  isActive?: boolean;
};

export type UpdateClassDto = Partial<CreateClassDto>;

// ── Sessions ──────────────────────────────────────────────────────────────────

export type AdminSession = {
  id: string;
  date: string;
  status: string;
  notes?: string;
  class: {
    id: string;
    title: string;
    instructor: string;
    maxCapacity: number;
    startTime: string;
    dayOfWeek: string;
  };
  _count: { bookings: number };
};

export type CreateSessionDto = {
  classId: string;
  date: string;
  notes?: string;
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export type AdminBooking = {
  id: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  classSession: {
    id: string;
    date: string;
    class: { id: string; title: string };
  };
};

// ── Leads ─────────────────────────────────────────────────────────────────────

export type AdminLead = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source?: string;
  status: string;
  notes?: string;
  createdAt: string;
};

// ── Subscriptions ─────────────────────────────────────────────────────────────

export type AdminSubscription = {
  id: string;
  status: string;
  currentPeriodEnd?: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  plan: { id: string; name: string; price: number };
};

// ── Payments ──────────────────────────────────────────────────────────────────

export type AdminPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
};

// ── Paginated result ──────────────────────────────────────────────────────────

export type PaginatedResult<T> = { data: T[]; total: number; totalPages?: number };

// -- Support Tickets ----------------------------------------------------------

export type TicketMessage = {
  id: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  userId: string;
};

export type AdminTicket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  messages: TicketMessage[];
};

// -- Client Profile -----------------------------------------------------------

export type AdminClientProfile = {
  id: string;
  userId: string;
  isComplete: boolean;
  completedAt?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  street?: string | null;
  complement?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country: string;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  emergencyRelation?: string | null;
  allergies?: string | null;
  medications?: string | null;
  preExistingConditions?: string | null;
  surgeries?: string | null;
  parqHeartCondition: boolean;
  parqChestPainActivity: boolean;
  parqChestPainRest: boolean;
  parqDizziness: boolean;
  parqBoneJoint: boolean;
  parqBloodPressureMeds: boolean;
  parqOtherReason: boolean;
  parqNotes?: string | null;
  physicianClearance: boolean;
  physicianName?: string | null;
  physicianPhone?: string | null;
  fitnessLevel?: string | null;
  goals?: string | null;
  physicalAssessmentNotes?: string | null;
  assessedAt?: string | null;
  liabilityWaiverAccepted: boolean;
  photoVideoConsent: boolean;
  dataProcessingConsent: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
};

// ── Service ───────────────────────────────────────────────────────────────────

export const adminService = {
  // Analytics
  async getAnalytics(): Promise<AdminAnalytics> {
    const { data } = await httpGet<AdminAnalytics>('/api/v1/admin/analytics');
    return data;
  },

  // Users
  async listUsers(page = 1, limit = 20, search?: string): Promise<PaginatedResult<AdminUser>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) qs.set('search', search);
    const result = await httpGet<AdminUser[]>(`/api/v1/admin/users?${qs}`);
    return { data: result.data, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages };
  },

  async getUser(id: string): Promise<AdminUserDetail> {
    const { data } = await httpGet<AdminUserDetail>(`/api/v1/admin/users/${id}`);
    return data;
  },

  async updateUserRole(id: string, role: 'ADMIN' | 'CLIENT'): Promise<void> {
    await httpPatch(`/api/v1/admin/users/${id}`, { role });
  },

  async createUser(dto: { name: string; email: string; password: string; phone?: string }): Promise<AdminUser> {
    return httpPost<AdminUser, typeof dto>('/api/v1/auth/register', dto);
  },

  async deleteUser(id: string): Promise<void> {
    await httpDelete(`/api/v1/admin/users/${id}`);
  },

  // Plans
  async listPlans(): Promise<AdminPlan[]> {
    const result = await httpGet<AdminPlan[]>('/api/v1/plans?all=true');
    return result.data;
  },

  async createPlan(dto: CreatePlanDto): Promise<AdminPlan> {
    return httpPost<AdminPlan, CreatePlanDto>('/api/v1/plans', dto);
  },

  async updatePlan(id: string, dto: UpdatePlanDto): Promise<AdminPlan> {
    return httpPatch<AdminPlan, UpdatePlanDto>(`/api/v1/plans/${id}`, dto);
  },

  // Classes
  async listClasses(): Promise<AdminClass[]> {
    const result = await httpGet<AdminClass[]>('/api/v1/classes?all=true');
    return result.data;
  },

  async createClass(dto: CreateClassDto): Promise<AdminClass> {
    return httpPost<AdminClass, CreateClassDto>('/api/v1/classes', dto);
  },

  async updateClass(id: string, dto: UpdateClassDto): Promise<AdminClass> {
    return httpPatch<AdminClass, UpdateClassDto>(`/api/v1/classes/${id}`, dto);
  },

  async deactivateClass(id: string): Promise<void> {
    await httpDelete(`/api/v1/classes/${id}`);
  },

  // Sessions
  async listSessions(page = 1, limit = 20, classId?: string, status?: string): Promise<PaginatedResult<AdminSession>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (classId) qs.set('classId', classId);
    if (status) qs.set('status', status);
    const result = await httpGet<AdminSession[]>(`/api/v1/admin/sessions?${qs}`);
    return { data: result.data, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages };
  },

  async createSession(dto: CreateSessionDto): Promise<AdminSession> {
    return httpPost<AdminSession, CreateSessionDto>('/api/v1/admin/sessions', dto);
  },

  async cancelSession(id: string): Promise<void> {
    await httpDelete(`/api/v1/admin/sessions/${id}`);
  },

  async generateSchedule(classId: string, fromDate: string, toDate: string) {
    return httpPost('/api/v1/admin/sessions/generate', { classId, fromDate, toDate });
  },

  // Bookings
  async listBookings(page = 1, limit = 20, status?: string): Promise<PaginatedResult<AdminBooking>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    const result = await httpGet<AdminBooking[]>(`/api/v1/admin/bookings?${qs}`);
    return { data: result.data, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages };
  },

  async updateBookingStatus(id: string, status: string): Promise<void> {
    await httpPatch(`/api/v1/admin/bookings/${id}`, { status });
  },

  async cancelBooking(id: string): Promise<void> {
    await httpDelete(`/api/v1/admin/bookings/${id}`);
  },

  // Leads
  async listLeads(page = 1, limit = 20, status?: string, search?: string): Promise<PaginatedResult<AdminLead>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    if (search) qs.set('search', search);
    const result = await httpGet<AdminLead[]>(`/api/v1/admin/leads?${qs}`);
    return { data: result.data, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages };
  },

  async updateLeadStatus(id: string, status: string, notes?: string): Promise<void> {
    await httpPatch(`/api/v1/admin/leads/${id}`, { status, notes });
  },

  // Subscriptions
  async listSubscriptions(page = 1, limit = 20, status?: string): Promise<PaginatedResult<AdminSubscription>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    const result = await httpGet<AdminSubscription[]>(`/api/v1/admin/subscriptions?${qs}`);
    return { data: result.data, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages };
  },

  async createManualSubscription(userId: string, planId: string, notes?: string): Promise<AdminSubscription> {
    return httpPost('/api/v1/admin/subscriptions/manual', { userId, planId, notes });
  },

  async createCheckoutLink(userId: string, planId: string): Promise<{ url: string; expiresAt: string }> {
    return httpPost('/api/v1/admin/subscriptions/checkout-link', { userId, planId });
  },

  // Payments
  async listPayments(page = 1, limit = 20, status?: string): Promise<PaginatedResult<AdminPayment>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    const result = await httpGet<AdminPayment[]>(`/api/v1/admin/payments?${qs}`);
    return { data: result.data, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages };
  },

  // Client Profiles
  async listClientProfiles(
    page = 1,
    limit = 20,
    status: 'all' | 'incomplete' | 'complete' = 'all',
  ): Promise<PaginatedResult<AdminClientProfile>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    qs.set('status', status);
    const result = await httpGet<AdminClientProfile[]>(`/api/v1/admin/client-profiles?${qs}`);
    return {
      data: result.data,
      total: result.meta?.total ?? result.data.length,
      totalPages: result.meta?.totalPages,
    };
  },

  async getClientProfile(userId: string): Promise<AdminClientProfile> {
    const { data } = await httpGet<AdminClientProfile>(`/api/v1/admin/client-profiles/${userId}`);
    return data;
  },

  async updateClientProfile(userId: string, dto: Partial<AdminClientProfile>): Promise<AdminClientProfile> {
    return httpPatch<AdminClientProfile, Partial<AdminClientProfile>>(
      `/api/v1/admin/client-profiles/${userId}`,
      dto,
    );
  },

  async deleteClientProfile(userId: string): Promise<void> {
    await httpDelete(`/api/v1/admin/client-profiles/${userId}`);
  },

  // Support Tickets
  async listTickets(page = 1, limit = 20, status?: string): Promise<PaginatedResult<AdminTicket>> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    const result = await httpGet<AdminTicket[]>(`/api/v1/support/tickets?${qs}`);
    return { data: result.data, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages };
  },

  async getTicket(id: string): Promise<AdminTicket> {
    const { data } = await httpGet<AdminTicket>(`/api/v1/support/tickets/${id}`);
    return data;
  },

  async replyTicket(id: string, message: string): Promise<TicketMessage> {
    return httpPost<TicketMessage, { message: string }>(`/api/v1/support/tickets/${id}`, { message });
  },

  async updateTicketStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'): Promise<void> {
    await httpPatch(`/api/v1/support/tickets/${id}`, { status });
  },

  // Blog Posts
  async listPosts(page = 1, limit = 50, status?: string): Promise<AdminPost[]> {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) qs.set('status', status);
    const result = await httpGet<AdminPost[]>(`/api/v1/admin/blog?${qs}`);
    return result.data;
  },

  async createPost(dto: CreatePostDto): Promise<AdminPost> {
    return httpPost<AdminPost, CreatePostDto>('/api/v1/admin/blog', dto);
  },

  async updatePost(id: string, dto: Partial<CreatePostDto>): Promise<AdminPost> {
    return httpPatch<AdminPost, Partial<CreatePostDto>>(`/api/v1/admin/blog/${id}`, dto);
  },

  async deletePost(id: string): Promise<void> {
    await httpDelete(`/api/v1/admin/blog/${id}`);
  },

  // Gallery
  async listGalleryImages(album?: string): Promise<AdminGalleryImage[]> {
    const qs = new URLSearchParams();
    if (album) qs.set('album', album);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const result = await httpGet<AdminGalleryImage[]>(`/api/v1/admin/gallery${suffix}`);
    return result.data;
  },

  async createGalleryImage(dto: CreateGalleryImageDto): Promise<AdminGalleryImage> {
    return httpPost<AdminGalleryImage, CreateGalleryImageDto>('/api/v1/admin/gallery', dto);
  },

  async uploadGalleryImages(
    files: File[],
    options?: { title?: string; album?: string; altText?: string; order?: number; isActive?: boolean },
  ): Promise<GalleryUploadResult> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    if (options?.title) formData.append('title', options.title);
    if (options?.album) formData.append('album', options.album);
    if (options?.altText) formData.append('altText', options.altText);
    if (typeof options?.order === 'number') formData.append('order', String(options.order));
    if (typeof options?.isActive === 'boolean') formData.append('isActive', String(options.isActive));

    return httpPostForm<GalleryUploadResult>('/api/v1/admin/gallery/upload', formData);
  },

  async updateGalleryImage(id: string, dto: Partial<CreateGalleryImageDto>): Promise<AdminGalleryImage> {
    return httpPatch<AdminGalleryImage, Partial<CreateGalleryImageDto>>(`/api/v1/admin/gallery/${id}`, dto);
  },

  async deleteGalleryImage(id: string): Promise<void> {
    await httpDelete(`/api/v1/admin/gallery/${id}`);
  },

  async listGalleryAlbums(): Promise<AdminGalleryAlbum[]> {
    const result = await httpGet<AdminGalleryAlbum[]>('/api/v1/admin/gallery/albums');
    return result.data;
  },

  async createGalleryAlbum(dto: CreateGalleryAlbumDto): Promise<AdminGalleryAlbum> {
    return httpPost<AdminGalleryAlbum, CreateGalleryAlbumDto>('/api/v1/admin/gallery/albums', dto);
  },

  async updateGalleryAlbum(id: string, dto: Partial<CreateGalleryAlbumDto>): Promise<AdminGalleryAlbum> {
    return httpPatch<AdminGalleryAlbum, Partial<CreateGalleryAlbumDto>>(`/api/v1/admin/gallery/albums/${id}`, dto);
  },

  async deleteGalleryAlbum(id: string): Promise<void> {
    await httpDelete(`/api/v1/admin/gallery/albums/${id}`);
  },

  // Site Settings
  async getSettings(group?: string): Promise<SiteSetting[]> {
    const qs = group ? `?group=${group}` : '';
    const result = await httpGet<SiteSetting[]>(`/api/v1/admin/settings${qs}`);
    return result.data;
  },

  async saveSettings(settings: Array<{ key: string; value: string; group: string }>): Promise<void> {
    await httpPatch(`/api/v1/admin/settings`, { settings });
  },
};


