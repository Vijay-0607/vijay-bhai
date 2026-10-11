import { translateUi } from '../locales/translateUi';
import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MailCheck, ShieldCheck } from 'lucide-react';
import type { Language, UserProfile, UserRole } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/common/Toast';

type SignupOtpResponse = {
  success?: boolean;
  data?: { message?: string; expiresInSeconds?: number; user?: Record<string, unknown> };
  error?: { code?: string; message?: string };
};

type OtpMode = 'backend' | 'demo';

function toVerifiedProfile(user: Record<string, unknown>, identifier: string): UserProfile {
  const role = String(user.role ?? 'FARMER').toLowerCase() as UserRole;
  const language = String(user.preferredLanguage ?? 'EN').toLowerCase() as Language;
  const email = typeof user.email === 'string' ? user.email : '';
  const phone = typeof user.phone === 'string' ? user.phone : '';
  return {
    id: String(user.id),
    name: String(user.name ?? 'MandiMatch user'),
    emailOrPhone: email || phone || identifier,
    phone: phone || undefined,
    upiId: typeof user.upiId === 'string' ? user.upiId : undefined,
    role,
    district: String(user.district ?? ''),
    language,
    bio: typeof user.profileDescription === 'string' ? user.profileDescription : '',
    rating: Number(user.rating ?? 5),
    completedDealsCount: Number(user.completedDealsCount ?? 0),
    isDemoVerified: false,
  };
}

function makeDemoCode(): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1_000_000).padStart(6, '0');
}

export default function SignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const loginVerified = useAuthStore((s) => s.loginVerified);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [role, setRole] = useState<UserRole>('farmer');
  const [district, setDistrict] = useState('Dharwad');
  const [language, setLanguage] = useState<Language>('en');
  const [otp, setOtp] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [otpMode, setOtpMode] = useState<OtpMode | null>(null);
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

  const normalizedIdentifier = () => {
    const value = contact.trim();
    let phone = value.replace(/[^\d]/g, '');
    if (phone.length === 12 && phone.startsWith('91')) phone = phone.slice(2);
    return /^[6-9]\d{9}$/.test(phone) ? phone : null;
  };

  const requestOtp = async (event: FormEvent) => {
    event.preventDefault();
    const identifier = normalizedIdentifier();
    if (!identifier) { showToast('Enter a valid Indian mobile number. A phone number is required for every account.', 'error'); return; }
    if (name.trim().length < 2 || !district.trim()) { showToast('Enter your name and district first.', 'error'); return; }
    setBusy(true);
    try {
      const response = await fetch('/api/v1/auth/signup/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(), identifier, role: role.toUpperCase(), district: district.trim(),
          preferredLanguage: language.toUpperCase(),
        }),
      });
      const result = await response.json() as SignupOtpResponse;
      if (!response.ok || !result.success) {
        if (response.status === 409) throw new Error(result.error?.message || 'An account with this email or phone already exists.');
        const canUseLocalDemo = false;
        if (!canUseLocalDemo) throw new Error(identifier.includes('@')
          ? (result.error?.message || 'Could not send the verification code. Please try again.')
          : (result.error?.message || 'SMS was not sent. Configure an SMS provider in server/.env and restart the backend.'));
        if (response.status !== 503 && response.status < 500) throw new Error(result.error?.message || 'Could not send the verification code.');
        const code = makeDemoCode();
        setDemoCode(code);
        setOtpMode('demo');
        setStatusMessage('The email/SMS service is not configured in this local demo. Use the demo code shown below; it was not sent to your device.');
        setExpiresAt(Date.now() + 5 * 60 * 1000);
        setOtp('');
        return;
      }
      setDemoCode('');
      setOtpMode('backend');
      setStatusMessage(result.data?.message || `A verification code was sent to ${identifier}.`);
      setExpiresAt(Date.now() + (result.data?.expiresInSeconds ?? 300) * 1000);
      setOtp('');
    } catch (error) {
      if (import.meta.env.DEV && identifier.includes('@') && error instanceof TypeError) {
        const code = makeDemoCode();
        setDemoCode(code);
        setOtpMode('demo');
        setStatusMessage('The backend email/SMS service is unavailable in this local demo. Use this demo code; it was not sent to your device.');
        setExpiresAt(Date.now() + 5 * 60 * 1000);
        setOtp('');
      } else if (identifier && error instanceof TypeError) {
        showToast('SMS was not sent because the backend is unavailable. Start PostgreSQL and the backend, then configure Twilio in server/.env.', 'error');
      } else {
        showToast(error instanceof Error ? error.message : 'Could not send the verification code.', 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    if (secondsLeft <= 0) { showToast('That code has expired. Request a new OTP.', 'error'); return; }
    const identifier = normalizedIdentifier();
    if (!identifier) { showToast('Enter the same mobile number used for the code.', 'error'); return; }
    setBusy(true);
    try {
      if (otpMode === 'demo') {
        if (otp !== demoCode) throw new Error('That demo code is incorrect. Check the code shown above.');
        const result = signup({ name, emailOrPhone: identifier, passwordMock: '', role, district: district.trim(), language });
        if (!result.success) throw new Error(result.message || 'Could not create account.');
      } else {
        const response = await fetch('/api/v1/auth/signup/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ identifier, code: otp }),
        });
        const result = await response.json() as SignupOtpResponse;
        if (!response.ok || !result.success) throw new Error(result.error?.message || 'The verification code is invalid or expired.');
        if (!result.data?.user) throw new Error('The server did not return the verified account.');
        loginVerified(toVerifiedProfile(result.data.user, identifier));
      }
      navigate('/dashboard');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not verify the code.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const resetOtp = () => { setOtpMode(null); setOtp(''); setDemoCode(''); setStatusMessage(''); setExpiresAt(null); };

  return <div className="mx-auto max-w-xl px-5 py-12">
    <h1 className="text-3xl font-bold">{translateUi("Create your account")}</h1>
    <p className="mt-2 text-sm text-zinc-500">{translateUi("Verify your mobile number before your account is created.")}</p>
    <form onSubmit={otpMode ? verifyOtp : requestOtp} className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <label className="text-sm font-semibold">{translateUi("Name")}<input required minLength={2} value={name} disabled={Boolean(otpMode)} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 font-normal disabled:opacity-70 dark:border-zinc-700" /></label>
      <label className="text-sm font-semibold">{translateUi("Mobile number")} <span className="text-rose-600">*</span><input required autoComplete="tel" type="tel" value={contact} disabled={Boolean(otpMode)} onChange={(e) => setContact(e.target.value)} placeholder="+91 98450 12345" className="mt-1 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 font-normal disabled:opacity-70 dark:border-zinc-700" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">{translateUi("Role")}<select value={role} disabled={Boolean(otpMode)} onChange={(e) => setRole(e.target.value as UserRole)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-950"><option value="farmer">{translateUi("Farmer")}</option><option value="buyer">{translateUi("Buyer")}</option><option value="fpo">{translateUi("FPO")}</option></select></label>
        <label className="text-sm font-semibold">{translateUi("Language")}<select value={language} disabled={Boolean(otpMode)} onChange={(e) => setLanguage(e.target.value as Language)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-950"><option value="en">{translateUi("English")}</option><option value="hi">{translateUi("Hindi")}</option><option value="kn">{translateUi("Kannada")}</option></select></label>
      </div>
      <label className="text-sm font-semibold">{translateUi("District")}<input required value={district} disabled={Boolean(otpMode)} onChange={(e) => setDistrict(e.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-2.5 font-normal disabled:opacity-70 dark:border-zinc-700" /></label>
      {otpMode && <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200"><ShieldCheck className="h-4 w-4" /> {translateUi("Verify your contact")} <span className="ml-auto font-medium">{Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}</span></p>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-300">{statusMessage}</p>
        {otpMode === 'demo' && <div className="mt-3 rounded-lg bg-white p-3 text-center dark:bg-zinc-900"><p className="text-xs font-semibold text-zinc-500">{translateUi("LOCAL DEMO OTP · NOT SENT")}</p><p className="font-mono text-2xl font-bold tracking-[0.35em]" aria-label={translateUi("Local demo verification code")}>{demoCode}</p></div>}
        <label className="mt-4 block text-sm font-semibold">{translateUi("6-digit verification code")}<input aria-label={translateUi("6-digit verification code")} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={translateUi("Enter 6-digit OTP")} className="mt-1 w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.2em] dark:border-emerald-800 dark:bg-zinc-900" /></label>
      </section>}
      <div className="flex gap-2">
        {otpMode && <button type="button" onClick={resetOtp} disabled={busy} className="flex items-center gap-1 rounded-xl border border-zinc-300 px-3 py-3 text-sm font-semibold dark:border-zinc-700"><ArrowLeft className="h-4 w-4"/> {translateUi("Edit details")}</button>}
        <button disabled={busy || (Boolean(otpMode) && (otp.length !== 6 || secondsLeft === 0))} className="flex-1 rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-60">{translateUi(busy ? (otpMode ? 'Verifying…' : 'Sending code…') : otpMode ? 'Verify and create account' : 'Send verification code')}</button>
      </div>
      <p className="text-center text-sm text-zinc-500">{translateUi("Already have a profile?")} <Link to="/login" className="font-semibold text-emerald-700">{translateUi("Sign in")}</Link></p>
      {otpMode && <p className="flex items-center justify-center gap-1 text-xs text-zinc-500"><MailCheck className="h-3.5 w-3.5"/>{translateUi("Request a new code by editing your details and sending it again.")}</p>}
    </form>
  </div>;
}
