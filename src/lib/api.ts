export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  });
  const result = await response.json().catch(() => ({})) as { success?: boolean; data?: T; error?: { message?: string } };
  if (!response.ok || result.success === false) throw new Error(result.error?.message || `Request failed (${response.status})`);
  return (result.data ?? result) as T;
}

export const isBackendAccount = (id: string) => /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id);
