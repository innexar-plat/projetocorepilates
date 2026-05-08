import { httpPost } from '@/services/http-client';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

type RegisterResponse = {
  id: string;
  name: string;
  email: string;
};

export const authService = {
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return httpPost<RegisterResponse, RegisterPayload>('/api/v1/auth/register', payload);
  },
};
