import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, ShoppingBag, Trash2 } from 'lucide-react';
import type { CropType } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { useToast } from '../components/common/Toast';

const inTenDays = () => { const date = new Date(); date.setDate(date.getDate() + 10); return date.toISOString().slice(0, 10); };
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function BuyPage() {
  const user = useAuthStore((s) => s.currentUser);
  const demands = useMarketplaceStore((s) => s.demands);
  const addDemand = useMarketplaceStore((s) => s.addDemand);
  const deleteDemand = useMarketplaceStore((s) => s.deleteDemand);
  const { showToast } = useToast();
  const [crop, setCrop] = useState<CropType>('Tomato');
  const [quantity, setQuantity] = useState('30');
  const [price, setPrice] = useState('2200');
  const [date, setDate] = useState(inTenDays);
  const [district, setDistrict] = useState(user?.district ?? 'Hubballi');
  const [notes, setNotes] = useState('');
  if (!user) return null;
  const mine = demands.filter((demand) => demand.buyerId === user.id);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!Number(quantity) || Number(quantity) < 1 || !Number(price) || Number(price) < 1 || !date || !district.trim()) { showToast('Enter a valid quantity, maximum price, delivery date, and district.', 'error'); return; }
    addDemand({ buyerId: user.id, buyerName: user.name, crop, requiredQuantityQuintals: Number(quantity), deliveryDate: date, maxPricePerQuintal: Number(price), district: district.trim(), notes: notes.trim() || undefined });
    showToast('Buyer requirement published. Matching harvests are ready to review.');
    setNotes('');
  };

  return <div className="mx-auto max-w-5xl space-y-6 py-2"><div><div className="flex items-center gap-2 text-amber-700 dark:text-amber-400"><ShoppingBag className="h-5 w-5" /><span className="text-sm font-semibold">Buyer marketplace</span></div><h1 className="mt-1 text-3xl font-bold">Buy produce</h1><p className="mt-2 text-sm text-zinc-500">Post your crop and delivery needs to find local harvests before they reach the market.</p></div>
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900"><label className="text-sm font-semibold">Crop<select value={crop} onChange={(e) => setCrop(e.target.value as CropType)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950">{(['Tomato','Maize','Onion','Green chilli'] as CropType[]).map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm font-semibold">Required quantity (quintals)<input type="number" min="1" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">Maximum price per quintal<input type="number" min="1" step="1" required value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">Delivery date<input type="date" min={new Date().toISOString().slice(0,10)} required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">Delivery district<input required value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold sm:col-span-2">Notes for farmers <span className="font-normal text-zinc-400">(optional)</span><textarea rows={3} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quality needs, pickup or delivery preferences..." className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">Maximum planned value: {money((Number(quantity)||0)*(Number(price)||0))}</p><button className="rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-amber-950 hover:bg-amber-400">Publish buyer requirement</button></div></form>
    <section className="space-y-3"><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold">Your requirements</h2><p className="text-sm text-zinc-500">{mine.length} buyer requirement{mine.length === 1 ? '' : 's'}</p></div><Link to="/matches" className="text-sm font-semibold text-emerald-700">See harvest matches →</Link></div>{mine.length === 0 ? <div className="rounded-xl bg-zinc-100 p-6 text-center text-sm text-zinc-500 dark:bg-zinc-900">Your requirements will appear here after publishing.</div> : mine.map((demand) => <article key={demand.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div><h3 className="font-bold">{demand.crop} · {demand.requiredQuantityQuintals} q required</h3><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500"><span>Up to {money(demand.maxPricePerQuintal)}/q</span><span><MapPin className="mr-1 inline h-3.5 w-3.5" />{demand.district}</span><span><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Delivery {demand.deliveryDate}</span></p>{demand.notes && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{demand.notes}</p>}</div><button aria-label={`Delete ${demand.crop} requirement`} onClick={() => { deleteDemand(demand.id); showToast('Requirement removed.', 'info'); }} className="rounded-lg p-2 text-zinc-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></article>)}</section>
  </div>;
}
