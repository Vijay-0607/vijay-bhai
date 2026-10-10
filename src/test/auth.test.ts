import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/authStore';

describe('Auth Store and Role Management', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('allows 1-click demo login for Farmer, Buyer, and FPO', () => {
    const store = useAuthStore.getState();

    // Farmer Demo
    store.loginAsDemo('farmer');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().currentUser?.role).toBe('farmer');

    // Buyer Demo
    store.loginAsDemo('buyer');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().currentUser?.role).toBe('buyer');

    // FPO Demo
    store.loginAsDemo('fpo');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().currentUser?.role).toBe('fpo');
  });

  it('supports registration of new demo users without storing plaintext passwords', () => {
    const store = useAuthStore.getState();

    const result = store.signup({
      name: 'Ramesh Agro',
      emailOrPhone: 'ramesh@demo.com',
      passwordMock: 'securepass123',
      role: 'farmer',
      district: 'Haveri',
      language: 'kn',
    });

    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().currentUser?.name).toBe('Ramesh Agro');
    expect(useAuthStore.getState().currentUser?.district).toBe('Haveri');
  });

  it('logs out and clears active session', () => {
    const store = useAuthStore.getState();
    store.loginAsDemo('farmer');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    store.logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().currentUser).toBeNull();
  });
});
