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

  it('requires the generated local demo OTP before creating a profile', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Backend is unavailable')));
    render(<MemoryRouter initialEntries={['/signup']}><ToastProvider><Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/dashboard" element={<div>Dashboard opened</div>} />
    </Routes></ToastProvider></MemoryRouter>);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Demo Farmer' } });
    fireEvent.change(screen.getByLabelText('Email address or mobile number'), { target: { value: 'new-farmer@example.com' } });
    fireEvent.change(screen.getByLabelText('District'), { target: { value: 'Dharwad' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send verification code' }));

    const demoCodeElement = await screen.findByLabelText('Local demo verification code');
    const code = demoCodeElement.textContent ?? '';
    expect(code).toMatch(/^\d{6}$/);
    expect(useAuthStore.getState().users.some((user) => user.emailOrPhone === 'new-farmer@example.com')).toBe(false);

    const wrongCode = code === '000000' ? '000001' : '000000';
    fireEvent.change(screen.getByLabelText('6-digit verification code'), { target: { value: wrongCode } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and create account' }));
    await waitFor(() => expect(screen.getByText(/incorrect/i)).toBeTruthy());
    expect(useAuthStore.getState().users.some((user) => user.emailOrPhone === 'new-farmer@example.com')).toBe(false);

    fireEvent.change(screen.getByLabelText('6-digit verification code'), { target: { value: code } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and create account' }));
    expect(await screen.findByText('Dashboard opened')).toBeTruthy();
    expect(useAuthStore.getState().currentUser?.emailOrPhone).toBe('new-farmer@example.com');
    vi.unstubAllGlobals();
  });
});
