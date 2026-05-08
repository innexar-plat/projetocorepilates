import { httpGet, httpPost, httpPatch } from '@/services/http-client';

export type Me = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
};

export type Booking = {
  id: string;
  status: string;
  classSessionId: string;
  createdAt: string;
  classSession?: {
    id: string;
    date: string;
    class?: {
      id: string;
      title: string;
      instructor: string;
      startTime: string;
      maxCapacity: number;
      durationMin: number;
    };
  };
};

export type PortalClassSession = {
  id: string;
  date: string;
  class: {
    id: string;
    title: string;
    instructor: string;
    startTime: string;
    maxCapacity: number;
    durationMin?: number;
  };
  bookedCount: number;
  availableSlots: number;
  isAvailable: boolean;
};

export type Payment = {
  id: string;
  amount: number;
  currency?: string;
  status: string;
  createdAt: string;
  description: string | null;
  stripeInvoiceId?: string | null;
  stripePaymentIntentId?: string | null;
};

export type Subscription = {
  id: string;
  status: string;
  classesUsedThisMonth: number;
  currentPeriodEnd: string;
  plan?: {
    name?: string;
    price?: number;
  };
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{ id: string; message: string; isAdmin: boolean; createdAt: string }>;
};

export type ClientProfile = {
  id: string;
  userId: string;
  isComplete: boolean;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
};

export type CompleteClientProfileDto = {
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation?: string;
  allergies?: string;
  medications?: string;
  preExistingConditions?: string;
  surgeries?: string;
  goals?: string;
  liabilityWaiverAccepted: boolean;
  photoVideoConsent: boolean;
  dataProcessingConsent: boolean;
};

export type PortalFlowStatus = {
  hasPlan: boolean;
  hasActiveSubscription: boolean;
  hasBooking: boolean;
  hasPayment: boolean;
  canStartOnboarding: boolean;
  profileCompleted: boolean;
  nextStep: string;
};

export const portalService = {
  async getMe(): Promise<Me> {
    const { data } = await httpGet<Me>('/api/v1/users/me');
    return data;
  },

  async getBookings(): Promise<Booking[]> {
    const { data } = await httpGet<Booking[]>('/api/v1/bookings');
    return data;
  },

  async getUpcomingSessions(limit = 80): Promise<PortalClassSession[]> {
    const { data } = await httpGet<PortalClassSession[]>(`/api/v1/sessions?limit=${limit}`);
    return data;
  },

  async bookClass(classSessionId: string): Promise<Booking> {
    return httpPost<Booking, { classSessionId: string }>('/api/v1/bookings', { classSessionId });
  },

  async getPayments(): Promise<{ data: Payment[]; total: number }> {
    const result = await httpGet<Payment[]>('/api/v1/payments?page=1&limit=20');
    return { data: result.data, total: result.meta?.total ?? result.data.length };
  },

  async getSubscription(): Promise<Subscription | null> {
    const { data } = await httpGet<Subscription | null>('/api/v1/subscriptions/me');
    return data;
  },

  // Support Tickets
  async listTickets(): Promise<SupportTicket[]> {
    const { data } = await httpGet<SupportTicket[]>('/api/v1/support/tickets');
    return data;
  },

  async getTicket(id: string): Promise<SupportTicket> {
    const { data } = await httpGet<SupportTicket>(`/api/v1/support/tickets/${id}`);
    return data;
  },

  async createTicket(subject: string, message: string): Promise<SupportTicket> {
    return httpPost<SupportTicket, { subject: string; message: string }>(
      '/api/v1/support/tickets',
      { subject, message },
    );
  },

  async replyTicket(id: string, message: string): Promise<void> {
    await httpPost(`/api/v1/support/tickets/${id}`, { message });
  },

  async getClientProfile(): Promise<ClientProfile | null> {
    try {
      const { data } = await httpGet<ClientProfile>('/api/v1/client-profiles');
      return data;
    } catch (error) {
      if (error instanceof Error && /not found|404/i.test(error.message)) {
        return null;
      }
      throw error;
    }
  },

  async completeClientProfile(payload: CompleteClientProfileDto): Promise<ClientProfile> {
    return httpPost<ClientProfile, CompleteClientProfileDto>('/api/v1/client-profiles/complete', payload);
  },

  async getFlowStatus(): Promise<PortalFlowStatus> {
    const { data } = await httpGet<PortalFlowStatus>('/api/v1/portal/flow');
    return data;
  },
};
