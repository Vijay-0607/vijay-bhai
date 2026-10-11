import { translateUi } from '../locales/translateUi';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ShoppingBag, Trash2 } from 'lucide-react';
import { CalendarDateField } from '../components/common/CalendarDateField';
import { StateDistrictFields } from '../components/common/StateDistrictFields';
import { INDIAN_STATES_AND_UTS } from '../data/indiaLocations';
import type { CropType } from '../types';
import { CropSelector, getCropName } from '../components/common/CropSelector';
import { useCropCatalogue } from '../hooks/useCropCatalogue';
import { useLanguageStore } from '../stores/languageStore';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { useToast } from '../components/common/Toast';
import { isBackendAccount } from '../lib/api';
import { toLocalDateInputValue } from '../utils/date';

const inTenDays = () => { const date = new Date(); date.setDate(date.getDate() + 10); return toLocalDateInputValue(date); };
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function BuyPage() {
  const user = useAuthStore((s) => s.currentUser);
  const demands = useMarketplaceStore((s) => s.demands);
  const addDemand = useMarketplaceStore((s) => s.addDemand);
  const deleteDemand = useMarketplaceStore((s) => s.deleteDemand);
  const publishBackendDemand = useMarketplaceStore((s) => s.publishBackendDemand);
  const cancelBackendDemand = useMarketplaceStore((s) => s.cancelBackendDemand);
  const refreshBackend = useMarketplaceStore((s) => s.refreshBackend);
  const catalogue = useCropCatalogue();
  const language = useLanguageStore((s) => s.language);
  const { showToast } = useToast();
  const [crop, setCrop] = useState<CropType>('tomato');
  const [quantity, setQuantity] = useState('30');
  const [price, setPrice] = useState('2200');
  const [date, setDate] = useState(inTenDays);
  const savedLocation = (user?.district ?? 'Hubballi, Karnataka').split(',').map((part) => part.trim());
  const [state, setState] = useState(INDIAN_STATES_AND_UTS.includes(savedLocation[1] as (typeof INDIAN_STATES_AND_UTS)[number]) ? savedLocation[1] : 'Karnataka');
  const [district, setDistrict] = useState(savedLocation[0] || 'Hubballi');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user && isBackendAccount(user.id)) void refreshBackend().catch((error) => showToast(error.message, 'error')); }, [user?.id]);
  useEffect(() => { if (window.location.hash === '#your-requirements') window.requestAnimationFrame(() => document.getElementById('your-requirements')?.scrollIntoView({ behavior: 'smooth' })); }, []);
  if (!user) return null;
  const mine = demands.filter((demand) => demand.buyerId === user.id);
  const cropName = (value: string) => getCropName(value, catalogue.crops, language);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (catalogue.loading || catalogue.error || !catalogue.crops.some((item) => item.slug === crop && item.isActive)) { showToast('Wait for the active crop catalogue to load, then select a crop.', 'error'); return; }
    if (!Number(quantity) || Number(quantity) < 1 || !Number(price) || Number(price) < 1 || !date || !district.trim()) { showToast('Enter a valid quantity, maximum price, delivery date, and district.', 'error'); return; }
    setBusy(true);
    try {
      const location = `${district.trim()}, ${state}`;
      if (isBackendAccount(user.id)) await publishBackendDemand({ crop, quantityQtl: Number(quantity), deliveryDate: date, maxPricePerQtl: Number(price), district: location, description: notes.trim() || undefined });
      else addDemand({ buyerId: user.id, buyerName: user.name, crop, requiredQuantityQuintals: Number(quantity), deliveryDate: date, maxPricePerQuintal: Number(price), district: location, notes: notes.trim() || undefined });
      showToast(isBackendAccount(user.id) ? 'Requirement shared with the marketplace.' : 'Demo requirement saved in this browser only. Sign in with a verified account to share it across devices.', 'success');
      setNotes('');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not publish requirement.', 'error'); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-6 py-2"><div><div className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><ShoppingBag className="h-5 w-5" /><span className="text-sm font-semibold">{translateUi("Buyer marketplace")}</span></div><h1 className="mt-1 text-3xl font-bold">{translateUi("Buy produce")}</h1><p className="mt-2 text-sm text-zinc-500">{translateUi("Post your crop and delivery needs to find local harvests before they reach the market.")}</p></div>
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900"><div className="sm:col-span-2"><CropSelector label={translateUi("Crop")} value={crop} onChange={setCrop} crops={catalogue.crops} categories={catalogue.categories} language={language} loading={catalogue.loading} error={catalogue.error} /></div><label className="text-sm font-semibold">{translateUi("Required quantity (quintals)")}<input type="number" min="1" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">{translateUi("Maximum price per quintal")}<input type="number" min="1" step="1" required value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><CalendarDateField label={translateUi("Delivery date")} value={date} onChange={setDate} min={toLocalDateInputValue(new Date())} /><div className="sm:col-span-2 grid gap-4 sm:grid-cols-2"><StateDistrictFields state={state} district={district} onStateChange={(value) => { setState(value); setDistrict(''); }} onDistrictChange={setDistrict} /></div><label className="text-sm font-semibold sm:col-span-2">{translateUi("Notes for farmers")} <span className="font-normal text-zinc-400">{translateUi("(optional)")}</span><textarea rows={3} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={translateUi("Quality needs, pickup or delivery preferences...")} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">{translateUi("Maximum planned value:")} {money((Number(quantity)||0)*(Number(price)||0))}</p><button disabled={busy || catalogue.loading || Boolean(catalogue.error)} className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-amber-950 hover:bg-amber-400 disabled:opacity-50">{translateUi(busy ? 'Publishing…' : 'Publish buyer requirement')}</button></div></form>
    <section id="your-requirements" className="space-y-3 scroll-mt-24"><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold">{translateUi("Your requirements")}</h2><p className="text-sm text-zinc-500">{mine.length} buyer requirement{mine.length === 1 ? '' : 's'}</p></div><Link to="/matches" className="text-sm font-semibold text-emerald-700">{translateUi("See harvest matches →")}</Link></div>{mine.length === 0 ? <div className="rounded-xl bg-zinc-100 p-6 text-center text-sm text-zinc-500 dark:bg-zinc-900">{translateUi("Your requirements will appear here after publishing.")}</div> : mine.map((demand) => <article key={demand.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div><h3 className="font-bold">{cropName(demand.crop)} · {demand.requiredQuantityQuintals} q required</h3><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500"><span>Up to {money(demand.maxPricePerQuintal)}/q</span><span><MapPin className="mr-1 inline h-3.5 w-3.5" />{demand.district}</span><span><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Delivery {demand.deliveryDate}</span></p>{demand.notes && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{demand.notes}</p>}</div><button aria-label={`Delete ${cropName(demand.crop)} requirement`} onClick={async () => { try { if (isBackendAccount(user.id)) await cancelBackendDemand(demand.id); else deleteDemand(demand.id); showToast('Requirement removed.', 'info'); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not remove requirement.', 'error'); } }} className="rounded-lg p-2 text-zinc-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></article>)}</section>
  </div>;
}
