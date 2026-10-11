import { FormEvent, useEffect, useState } from 'react';
import { LifeBuoy, Send } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { isBackendAccount, apiRequest } from '../lib/api';
import { useToast } from '../components/common/Toast';
import { translateUi } from '../locales/translateUi';

type Report = { id: string; category: string; description: string; status: string; dealId?: string | null; createdAt: string };

const categories = [
  ['ACCOUNT', 'Account or login'],
  ['LISTING', 'Listing or crop details'],
  ['OFFER', 'Offer or deal'],
  ['PAYMENT', 'Payment or price'],
  ['SAFETY', 'Safety or inappropriate behaviour'],
  ['OTHER', 'Something else'],
];

export default function SupportPage() {
  const user = useAuthStore((state) => state.currentUser);
  const offers = useMarketplaceStore((state) => state.offers);
  const { showToast } = useToast();
  const [category, setCategory] = useState('OTHER');
  const [dealId, setDealId] = useState('');
  const [description, setDescription] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        if (isBackendAccount(user.id)) {
          const result = await apiRequest<{ reports: Report[] }>('/support/reports');
          setReports(result.reports);
        } else {
          setReports(JSON.parse(localStorage.getItem(`mandimatch_reports:${user.id}`) ?? '[]') as Report[]);
        }
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Could not load your reports.', 'error');
      } finally { setLoading(false); }
    };
    void load();
  }, [user?.id]);

  if (!user) return null;
  const myDeals = offers.filter((offer) => offer.farmerId === user.id || offer.buyerId === user.id);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    const reportData = { category, description: description.trim(), ...(dealId ? { dealId } : {}) };
    try {
      let report: Report;
      if (isBackendAccount(user.id)) {
        const result = await apiRequest<{ report: Report }>('/support/reports', { method: 'POST', body: JSON.stringify(reportData) });
        report = result.report;
      } else {
        report = { id: `report-${Date.now()}`, ...reportData, status: 'OPEN', createdAt: new Date().toISOString() };
        const key = `mandimatch_reports:${user.id}`;
        const saved = JSON.parse(localStorage.getItem(key) ?? '[]') as Report[];
        localStorage.setItem(key, JSON.stringify([report, ...saved]));
      }
      setReports((current) => [report, ...current]);
      setDescription('');
      setDealId('');
      setCategory('OTHER');
      showToast(translateUi('Your report was submitted. We will review it.'), 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not submit your report.', 'error');
    } finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-3xl space-y-6 py-2">
    <header><div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><LifeBuoy className="h-5 w-5" /><span className="text-sm font-semibold">{translateUi('Help and support')}</span></div><h1 className="mt-1 text-3xl font-bold">{translateUi('Report a problem')}</h1><p className="mt-2 text-sm text-zinc-500">{translateUi('Tell us what happened and our team can look into it.')}</p></header>
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <label className="block text-sm font-semibold">{translateUi('What is the problem about?')}<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950">{categories.map(([value, label]) => <option key={value} value={value}>{translateUi(label)}</option>)}</select></label>
      <label className="block text-sm font-semibold">{translateUi('Related deal (optional)')}<select value={dealId} onChange={(event) => setDealId(event.target.value)} className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"><option value="">{translateUi('No specific deal')}</option>{myDeals.map((offer) => <option key={offer.id} value={isBackendAccount(user.id) ? offer.dealId ?? '' : offer.dealId ?? offer.id} disabled={isBackendAccount(user.id) && !offer.dealId}>{offer.crop} · {offer.quantityQuintals} q · {offer.farmerName} / {offer.buyerName}</option>)}</select></label>
      <label className="block text-sm font-semibold">{translateUi('Describe the problem')}<textarea value={description} onChange={(event) => setDescription(event.target.value)} required minLength={10} maxLength={2000} rows={5} placeholder={translateUi('Include what happened and when. Please do not include passwords or OTPs.')} className="mt-1 w-full resize-y rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /><span className="mt-1 block text-right text-xs font-normal text-zinc-500">{description.length}/2000</span></label>
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Send className="h-4 w-4" />{translateUi(saving ? 'Sending…' : 'Submit report')}</button>
    </form>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="text-lg font-bold">{translateUi('Your reports')}</h2>{loading ? <p className="mt-3 text-sm text-zinc-500">{translateUi('Loading reports…')}</p> : reports.length === 0 ? <p className="mt-3 text-sm text-zinc-500">{translateUi('You have not submitted a report yet.')}</p> : <div className="mt-3 space-y-3">{reports.map((report) => <article key={report.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{translateUi(categories.find(([value]) => value === report.category)?.[1] ?? 'Something else')}</span><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-900/30 dark:text-amber-200">{translateUi(report.status === 'OPEN' ? 'Open' : report.status)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">{report.description}</p><time className="mt-2 block text-xs text-zinc-500">{new Date(report.createdAt).toLocaleString()}</time></article>)}</div>}</section>
  </div>;
}
