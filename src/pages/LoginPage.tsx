import { translateUi } from '../locales/translateUi';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Sprout } from 'lucide-react';
import type { Language, UserProfile, UserRole } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/common/Toast';

type OtpApiResponse = {
  success?: boolean;
  data?: { message?: string; user?: Record<string, unknown> };
  error?: { message?: string };
};

const demoAccounts: Array<{ role: UserRole; roleLabel: string }> = [
  { role: 'farmer', roleLabel: 'Farmer' },
  { role: 'buyer', roleLabel: 'Buyer' },
  { role: 'fpo', roleLabel: 'FPO' },
];

function toProfile(raw: Record<string, unknown>, emailAddress: string): UserProfile {
  const role = String(raw.role ?? 'FARMER').toLowerCase() as UserRole;
  const language = String(raw.preferredLanguage ?? 'EN').toLowerCase() as Language;
  const email = typeof raw.email === 'string' ? raw.email : '';
  const phone = typeof raw.phone === 'string' ? raw.phone : '';
  return {
    id: String(raw.id),
    name: String(raw.name ?? 'MandiMatch user'),
    emailOrPhone: email || phone || emailAddress,
    phone: phone || undefined,
    upiId: typeof raw.upiId === 'string' ? raw.upiId : undefined,
    role,
    district: String(raw.district ?? ''),
    language,
    bio: typeof raw.profileDescription === 'string' ? raw.profileDescription : '',
    rating: Number(raw.rating ?? 5),
    completedDealsCount: Number(raw.completedDealsCount ?? 0),
    isDemoVerified: false,
  };
}

export default function LoginPage() {
  const loginVerified = useAuthStore((s) => s.loginVerified);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const callOtpApi = async (path: string, payload: Record<string, string>) => {
    const response = await fetch(`/api/v1/auth/otp/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const result = await response.json() as OtpApiResponse;
    if (!response.ok || !result.success) {
      throw new Error(result.error?.message || 'Could not verify your account. Please try again.');
    }
    return result;
  };

  const requestOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) { showToast('Enter a valid email address.', 'error'); return; }
    setBusy(true);
    try {
      const result = await callOtpApi('request', { email: normalizedEmail });
      setOtpRequested(true);
      setOtp('');
      setExpiresAt(Date.now() + 5 * 60 * 1000);
      setStatusMessage(result.data?.message || 'If this account is registered, a verification code has been sent.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send the code. Check that the backend is running.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const sendOtp = (event: FormEvent) => {
    event.preventDefault();
    void requestOtp();
  };

  const enterDemo = (role: UserRole) => {
    loginAsDemo(role);
    navigate('/dashboard');
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (secondsLeft <= 0) { showToast('That code has expired. Request a new OTP.', 'error'); return; }
    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await callOtpApi('verify', { email: normalizedEmail, code: otp });
      if (!result.data?.user) throw new Error('The server did not return a verified account.');
      loginVerified(toProfile(result.data.user, normalizedEmail));
      navigate('/dashboard');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'The code could not be verified.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const changeEmail = (value: string) => {
    setEmail(value);
    setOtpRequested(false);
    setStatusMessage('');
    setOtp('');
    setExpiresAt(null);
  };

  return <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-10 px-5 py-12 md:grid-cols-2">
    <div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white"><Sprout /></div>
      <h1 className="mt-5 text-3xl font-bold">{translateUi("Sign in with a one-time code")}</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">{translateUi("Enter your registered email address. We’ll send a 6-digit OTP to your inbox.")}</p>
      <form onSubmit={sendOtp} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold">{translateUi("Email address")}<input type="email" autoComplete="email" inputMode="email" maxLength={254} required value={email} onChange={(e) => changeEmail(e.target.value)} placeholder={translateUi("you@gmail.com")} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 font-normal dark:border-zinc-700 dark:bg-zinc-900" /></label>
        <button disabled={busy} className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{translateUi(busy && !otpRequested ? 'Sending…' : otpRequested ? 'Resend OTP' : 'Send OTP')}</button>
      </form>
      {otpRequested && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200"><ShieldCheck className="h-4 w-4" /> {translateUi("Verify your contact")} <span className="ml-auto font-medium">{translateUi('Expires in')} {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span></p>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">{statusMessage}</p>
        <form onSubmit={verifyOtp} className="mt-4 flex gap-2">
          <input aria-label={translateUi("6-digit one-time password")} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={translateUi("Enter 6-digit OTP")} className="min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.2em] dark:border-emerald-800 dark:bg-zinc-900" />
          <button disabled={busy || otp.length !== 6 || secondsLeft === 0} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{translateUi(busy ? 'Checking…' : 'Verify')}</button>
        </form>
      </div>}
      <p className="mt-5 text-sm text-zinc-500">{translateUi("New to MandiMatch?")} <Link className="font-semibold text-emerald-700" to="/signup">{translateUi("Create an account")}</Link></p>
    </div>
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20">
      <h2 className="text-lg font-bold">{translateUi("Explore the demo")}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{translateUi("Demo access uses sample data and skips OTP. Email sign-in requires an active email OTP provider.")}</p>
      <div className="mt-5 space-y-3">{demoAccounts.map((item) => <div key={item.role} className="rounded-xl border border-white bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"><span className="block font-semibold">{item.roleLabel} demo</span><span className="mt-0.5 block text-xs text-zinc-500">{translateUi("Sample data · no real account")}</span><button type="button" onClick={() => enterDemo(item.role)} className="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Continue as demo {item.roleLabel}</button></div>)}</div>
    </div>
  </div>;
}
