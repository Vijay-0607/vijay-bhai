import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, ShieldCheck, Sprout } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/common/Toast';

function normalizePhone(value: string) { return value.replace(/[\s()-]/g, '').replace(/^\+91/, ''); }

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const users = useAuthStore((s) => s.users);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const findAccount = (value: string) => {
    const query = value.trim().toLowerCase();
    const phone = normalizePhone(query);
    return users.find((user) => user.emailOrPhone.toLowerCase() === query || Boolean(user.phone && normalizePhone(user.phone) === phone));
  };

  const requestOtp = () => {
    if (!identifier.trim()) { showToast('Enter your email address or mobile number.', 'error'); return; }
    if (!findAccount(identifier)) { showToast('No demo account matches that email or mobile number. Try one of the accounts shown here.', 'error'); return; }
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    const code = String(random[0] % 1_000_000).padStart(6, '0');
    setDemoOtp(code);
    setOtp('');
    setExpiresAt(Date.now() + 5 * 60 * 1000);
    showToast('Demo OTP generated. Use the code shown on screen.');
  };

  const sendOtp = (event: FormEvent) => {
    event.preventDefault();
    requestOtp();
  };

  const verifyOtp = (event: FormEvent) => {
    event.preventDefault();
    if (!demoOtp || secondsLeft <= 0) { showToast('That code has expired. Request a new OTP.', 'error'); return; }
    if (otp !== demoOtp) { showToast('The OTP does not match. Check the code and try again.', 'error'); return; }
    const account = findAccount(identifier);
    if (!account) { showToast('Account not found. Request a new OTP with a registered email or mobile number.', 'error'); return; }
    const result = login(account.emailOrPhone, 'otp-verified');
    if (result.success) { setDemoOtp(''); navigate('/dashboard'); }
    else showToast(result.message || 'Could not sign in.', 'error');
  };

  return <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-10 px-5 py-12 md:grid-cols-2"><div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white"><Sprout /></div><h1 className="mt-5 text-3xl font-bold">Sign in with a one-time code</h1><p className="mt-2 text-zinc-600 dark:text-zinc-400">Enter the email or mobile number on your account. We’ll verify it with a 6-digit OTP.</p>
    <form onSubmit={sendOtp} className="mt-6 space-y-4"><label className="block text-sm font-semibold">Email address or mobile number<input autoComplete="username" inputMode="email" required value={identifier} onChange={(e) => { setIdentifier(e.target.value); setDemoOtp(''); setOtp(''); setExpiresAt(null); }} placeholder="farmer@mandimatch.demo or +91 98450 12345" className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 font-normal dark:border-zinc-700 dark:bg-zinc-900" /></label><button className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white">Send OTP</button></form>
    {demoOtp && <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20"><p className="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200"><ShieldCheck className="h-4 w-4"/> Demo OTP <span className="ml-auto font-medium">Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2,'0')}</span></p><p className="mt-2 text-2xl font-extrabold tracking-[0.3em] text-amber-950 dark:text-amber-100">{demoOtp}</p><p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Delivery is simulated in this demo; no SMS or email is sent.</p><form onSubmit={verifyOtp} className="mt-4 flex gap-2"><input aria-label="6-digit one-time password" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(e)=>setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} placeholder="Enter 6-digit OTP" className="min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 py-2 text-center font-mono text-lg tracking-[0.2em] dark:border-amber-800 dark:bg-zinc-900"/><button disabled={otp.length!==6||secondsLeft===0} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-amber-950 disabled:opacity-50">Verify</button></form><button type="button" onClick={requestOtp} className="mt-3 text-xs font-semibold text-amber-900 underline dark:text-amber-200">Resend OTP</button></div>}
    <p className="mt-5 text-sm text-zinc-500">New to MandiMatch? <Link className="font-semibold text-emerald-700" to="/signup">Create an account</Link></p></div>
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/20"><h2 className="text-lg font-bold">Demo accounts</h2><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Request an OTP using any of these email addresses or phone numbers.</p><div className="mt-5 space-y-3">{([{name:'Lakshmi Devi',role:'Farmer',district:'Dharwad',email:'farmer@mandimatch.demo',phone:'+91 98450 12345'},{name:'Hotel Naveen Procurement',role:'Buyer',district:'Hubballi',email:'buyer@mandimatch.demo',phone:'+91 94480 67890'},{name:'Basavaraj Raitha Utpadaka FPO',role:'FPO',district:'Hubballi',email:'fpo@mandimatch.demo',phone:'+91 93420 54321'}]).map((item)=><button key={item.email} type="button" onClick={()=>{setIdentifier(item.email);setDemoOtp('');setOtp('');setExpiresAt(null);}} className="w-full rounded-xl border border-white bg-white p-4 text-left shadow-sm hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"><span className="block font-semibold">{item.name}</span><span className="mt-0.5 block text-xs text-zinc-500">{item.role} · {item.district}</span><span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400"><span><Mail className="mr-1 inline h-3 w-3"/>{item.email}</span><span><Phone className="mr-1 inline h-3 w-3"/>{item.phone}</span></span></button>)}</div></div></div>;
}
