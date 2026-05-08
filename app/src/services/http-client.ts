type ApiMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

type ApiEnvelope<T> = {
  data?: T | { data?: T };
  meta?: ApiMeta;
  statusCode?: number;
  error?: string;
  message?: string;
};

function unwrapData<T>(payload: ApiEnvelope<T>): T {
  const first = payload.data;
  if (first && typeof first === 'object' && 'data' in first) {
    return (first as { data?: T }).data as T;
  }
  return first as T;
}

export async function httpGet<T>(url: string): Promise<{ data: T; meta?: ApiMeta }> {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Request failed (${response.status})`);
  }

  return { data: unwrapData(payload), meta: payload.meta };
}

export async function httpPost<T, B>(url: string, body: B): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Request failed (${response.status})`);
  }

  return unwrapData(payload);
}

export async function httpPostForm<T>(url: string, body: FormData): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
    },
    body,
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Request failed (${response.status})`);
  }

  return unwrapData(payload);
}

export async function httpPatch<T = void, B = unknown>(url: string, body: B): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Request failed (${response.status})`);
  }

  return unwrapData(payload);
}

export async function httpDelete(url: string): Promise<void> {
  const response = await fetch(url, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 204) return;

  const payload = (await response.json()) as ApiEnvelope<unknown>;

  if (!response.ok) {
    throw new Error(payload.message ?? payload.error ?? `Request failed (${response.status})`);
  }
}
