import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SignupPage from '../pages/SignupPage';
import { ToastProvider } from '../components/common/Toast';
import { useAuthStore } from '../stores/authStore';

describe('account signup OTP flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('requires a backend-verified mobile OTP before creating a profile', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: { message: 'Code sent.', expiresInSeconds: 300 } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: { message: 'The verification code is invalid or expired.' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { user: { id: 'verified-user', name: 'Demo Farmer', phone: '9845012345', role: 'FARMER', district: 'Dharwad' } },
        }),
      }));
    render(<MemoryRouter initialEntries={['/signup']}><ToastProvider><Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<div>Dashboard opened</div>} />
    </Routes></ToastProvider></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Demo Farmer' } });
    fireEvent.change(screen.getByPlaceholderText('+91 98450 12345'), { target: { value: '9845012345' } });
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Dharwad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }));

    expect(await screen.findByText('Code sent.')).toBeTruthy();
    expect(useAuthStore.getState().users.some((user) => user.phone === '9845012345')).toBe(false);

    fireEvent.change(screen.getByLabelText('6-digit verification code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and create account' }));
    await waitFor(() => expect(screen.getByText(/invalid|expired/i)).toBeTruthy());
    expect(useAuthStore.getState().currentUser).toBeNull();

    fireEvent.change(screen.getByLabelText('6-digit verification code'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and create account' }));
    expect(await screen.findByText('Dashboard opened')).toBeTruthy();
    expect(useAuthStore.getState().currentUser?.phone).toBe('9845012345');
    vi.unstubAllGlobals();
  });
});
