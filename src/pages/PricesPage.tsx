import { FormEvent, useState } from 'react';
import { BellPlus, TrendingUp, Trash2 } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CropSelector, getCropName } from '../components/common/CropSelector';
import { useCropCatalogue } from '../hooks/useCropCatalogue';
import { CROP_PRICE_DATA } from '../data/mandiPrices';
import type { CropType } from '../types';
import { useLanguageStore } from '../stores/languageStore';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { useToast } from '../components/common/Toast';

export default function PricesPage() {
  const user = useAuthStore((s) => s.currentUser);
  const alerts = useMarketplaceStore((s) => s.priceAlerts);
  const addAlert = useMarketplaceStore((s) => s.addPriceAlert);
  const deleteAlert = useMarketplaceStore((s) => s.deletePriceAlert);
  const catalogue = useCropCatalogue();
  const language = useLanguageStore((s) => s.language);
  const { showToast } = useToast();
  const [crop, setCrop] = useState<CropType>('tomato');
  const [target, setTarget] = useState('2200');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [district, setDistrict] = useState(user?.district ?? 'Dharwad');
  if (!user) return null;
  const data = CROP_PRICE_DATA[crop];
  const mine = alerts.filter((alert) => alert.userId === user.id);
  const cropName = (value: string) => getCropName(value, catalogue.crops, language);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (catalogue.loading || catalogue.error || !catalogue.crops.some((item) => item.slug === crop && item.isActive)) { showToast('Wait for the crop catalogue to load and select an active crop.', 'error'); return; }
    if (!Number(target) || Number(target) < 1) { showToast('Enter a valid target price.', 'error'); return; }
    addAlert({ userId: user.id, crop, targetPrice: Number(target), condition, district: district.trim() || user.district });
    showToast('Price alert saved.');
  };

  return <div className="mx-auto max-w-6xl space-y-6 py-2"><div><div className="flex items-center gap-2 text-amber-600"><TrendingUp className="h-5 w-5" /><span className="text-sm font-semibold">Regional price signals</span></div><h1 className="mt-1 text-3xl font-bold">Crop prices</h1><p className="mt-2 text-sm text-zinc-500">Existing sample benchmarks are simulated for demonstration. Other catalogue crops show no price until a record is available.</p></div>
    <div className="max-w-xl"><CropSelector label="Crop prices and alert crop" value={crop} onChange={setCrop} crops={catalogue.crops} categories={catalogue.categories} language={language} loading={catalogue.loading} error={catalogue.error} /></div>
    {data ? <div className="grid gap-4 md:grid-cols-[1fr_280px]"><section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex flex-wrap justify-between gap-4"><div><p className="text-sm text-zinc-500">Current simulated benchmark</p><p className="mt-1 text-3xl font-extrabold">₹{data.currentSimulatedPrice.toLocaleString('en-IN')}<span className="text-sm font-medium text-zinc-500"> / q</span></p></div><div className="text-right"><p className="text-xs text-zinc-500">Trend</p><p className={`mt-1 font-bold ${data.trend === 'bearish' ? 'text-rose-600' : 'text-emerald-700'}`}>{data.trend} · {data.trendPercentage}%</p><p className="mt-1 text-xs text-zinc-500">Typical range ₹{data.minPrice.toLocaleString('en-IN')}–₹{data.maxPrice.toLocaleString('en-IN')}</p></div></div><div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.monthlyHistory}><defs><linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1E5E3A" stopOpacity={0.28}/><stop offset="95%" stopColor="#1E5E3A" stopOpacity={0.02}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d4d4d8"/><XAxis dataKey="month" tick={{fontSize:12}}/><YAxis width={60} tick={{fontSize:12}} tickFormatter={(value) => `₹${value}`}/><Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}/q`, 'Simulated price']} contentStyle={{borderRadius:12}}/><Area type="monotone" dataKey="price" stroke="#1E5E3A" fill="url(#priceFill)" strokeWidth={3}/></AreaChart></ResponsiveContainer></div><p className="text-xs text-zinc-400">Seasonal high month: {data.bestMonth}. Simulated demo data; not live mandi prices.</p></section><aside className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-bold">Simulated district benchmarks</h2><div className="mt-3 space-y-3">{data.districtBenchmarks.map((item) => <div key={item.district} className="flex justify-between gap-3 text-sm"><span className="text-zinc-500">{item.district}</span><span className="font-semibold">₹{item.price.toLocaleString('en-IN')}/q</span></div>)}</div></aside></div> : <div role="status" className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center dark:border-zinc-700 dark:bg-zinc-900"><h2 className="font-bold">Price data unavailable</h2><p className="mt-1 text-sm text-zinc-500">The catalogue supports {cropName(crop)}, but no price records are available. You can still create listings or price alerts.</p></div>}
    <section className="grid gap-5 lg:grid-cols-2"><form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><BellPlus className="h-5 w-5 text-amber-600"/><h2 className="font-bold">Create price alert</h2></div><p className="mt-1 text-xs text-zinc-500">Alerts can be set even when current price data is unavailable.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold">Target price<input type="number" min="1" required value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"/></label><label className="text-xs font-semibold">Notify me when<select value={condition} onChange={(e) => setCondition(e.target.value as 'above'|'below')} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"><option value="above">Price rises above</option><option value="below">Price falls below</option></select></label><label className="text-xs font-semibold sm:col-span-2">District<input value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"/></label></div><button disabled={catalogue.loading || Boolean(catalogue.error)} className="mt-4 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Save alert</button></form><div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-bold">Your active alerts</h2>{mine.length === 0 ? <p className="mt-3 text-sm text-zinc-500">You have not set any alerts.</p> : <div className="mt-3 space-y-2">{mine.map((alert) => <div key={alert.id} className="flex items-center justify-between gap-2 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800"><span>{cropName(alert.crop)} {alert.condition} ₹{alert.targetPrice}/q · {alert.district}</span><button aria-label={`Delete ${cropName(alert.crop)} alert`} onClick={() => { deleteAlert(alert.id); showToast('Alert removed.', 'info'); }} className="rounded p-1 text-zinc-500 hover:text-rose-600"><Trash2 className="h-4 w-4"/></button></div>)}</div>}</div></section>
  </div>;
}
