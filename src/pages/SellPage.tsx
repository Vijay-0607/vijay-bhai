import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, PackagePlus, Trash2 } from 'lucide-react';
import type { CropType } from '../types';
import { CropSelector, getCropName } from '../components/common/CropSelector';
import { useCropCatalogue } from '../hooks/useCropCatalogue';
import { useLanguageStore } from '../stores/languageStore';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { useToast } from '../components/common/Toast';

const nextWeek = () => { const date = new Date(); date.setDate(date.getDate() + 7); return date.toISOString().slice(0, 10); };
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function SellPage() {
  const user = useAuthStore((s) => s.currentUser);
  const listings = useMarketplaceStore((s) => s.listings);
  const addListing = useMarketplaceStore((s) => s.addListing);
  const deleteListing = useMarketplaceStore((s) => s.deleteListing);
  const catalogue = useCropCatalogue();
  const language = useLanguageStore((s) => s.language);
  const { showToast } = useToast();
  const [crop, setCrop] = useState<CropType>('tomato');
  const [quantity, setQuantity] = useState('25');
  const [price, setPrice] = useState('2000');
  const [date, setDate] = useState(nextWeek);
  const [district, setDistrict] = useState(user?.district ?? 'Dharwad');
  const [notes, setNotes] = useState('');
  if (!user) return null;
  const mine = listings.filter((listing) => listing.farmerId === user.id);
  const cropName = (value: string) => getCropName(value, catalogue.crops, language);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (catalogue.loading || catalogue.error || !catalogue.crops.some((item) => item.slug === crop && item.isActive)) { showToast('Wait for the active crop catalogue to load, then select a crop.', 'error'); return; }
    if (!Number(quantity) || Number(quantity) < 1 || !Number(price) || Number(price) < 1 || !date || !district.trim()) { showToast('Enter a valid quantity, price, harvest date, and district.', 'error'); return; }
    addListing({ farmerId: user.id, farmerName: user.name, farmerRole: user.role === 'fpo' ? 'fpo' : 'farmer', crop, quantityQuintals: Number(quantity), expectedHarvestDate: date, askingPricePerQuintal: Number(price), district: district.trim(), notes: notes.trim() || undefined });
    showToast('Harvest listing published. New matches are ready to review.');
    setNotes('');
  };

  return <div className="mx-auto max-w-5xl space-y-6 py-2"><div><div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><PackagePlus className="h-5 w-5" /><span className="text-sm font-semibold">Farmer marketplace</span></div><h1 className="mt-1 text-3xl font-bold">Sell your harvest</h1><p className="mt-2 text-sm text-zinc-500">Publish expected produce so buyers can find and make offers before harvest.</p></div>
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900"><div className="sm:col-span-2"><CropSelector label="Crop" value={crop} onChange={setCrop} crops={catalogue.crops} categories={catalogue.categories} language={language} loading={catalogue.loading} error={catalogue.error} /></div><label className="text-sm font-semibold">Available quantity (quintals)<input type="number" min="1" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">Asking price per quintal<input type="number" min="1" step="1" required value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">Expected harvest date<input type="date" min={new Date().toISOString().slice(0,10)} required value={date} onChange={(e) => setDate(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">District<input required value={district} onChange={(e) => setDistrict(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold sm:col-span-2">Notes for buyers <span className="font-normal text-zinc-400">(optional)</span><textarea rows={3} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Grade, quality, packaging, delivery details..." className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">Estimated listing value: {money((Number(quantity)||0)*(Number(price)||0))}</p><button disabled={catalogue.loading || Boolean(catalogue.error)} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">Publish harvest listing</button></div></form>
    <section className="space-y-3"><div className="flex items-end justify-between"><div><h2 className="text-xl font-bold">Your listings</h2><p className="text-sm text-zinc-500">{mine.length} harvest listing{mine.length === 1 ? '' : 's'}</p></div><Link to="/matches" className="text-sm font-semibold text-emerald-700">Check matches →</Link></div>{mine.length === 0 ? <div className="rounded-xl bg-zinc-100 p-6 text-center text-sm text-zinc-500 dark:bg-zinc-900">Your published harvests will appear here.</div> : mine.map((listing) => <article key={listing.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><div><h3 className="font-bold">{cropName(listing.crop)} · {listing.availableQuantityQuintals} of {listing.quantityQuintals} q available</h3><p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500"><span>{money(listing.askingPricePerQuintal)}/q</span><span><MapPin className="mr-1 inline h-3.5 w-3.5" />{listing.district}</span><span><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Harvest {listing.expectedHarvestDate}</span></p>{listing.notes && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{listing.notes}</p>}</div><button aria-label={`Delete ${cropName(listing.crop)} listing`} onClick={() => { deleteListing(listing.id); showToast('Listing removed.', 'info'); }} className="rounded-lg p-2 text-zinc-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></article>)}</section>
  </div>;
}
