import { translateUi } from '../locales/translateUi';
import { FormEvent, useEffect, useState } from 'react';
import { PackagePlus } from 'lucide-react';
import { CalendarDateField } from '../components/common/CalendarDateField';
import { StateDistrictFields } from '../components/common/StateDistrictFields';
import { INDIAN_STATES_AND_UTS } from '../data/indiaLocations';
import type { CropType } from '../types';
import { CropSelector } from '../components/common/CropSelector';
import { useCropCatalogue } from '../hooks/useCropCatalogue';
import { useLanguageStore } from '../stores/languageStore';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { useToast } from '../components/common/Toast';
import { isBackendAccount } from '../lib/api';
import { toLocalDateInputValue } from '../utils/date';

const nextWeek = () => { const date = new Date(); date.setDate(date.getDate() + 7); return toLocalDateInputValue(date); };
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export default function SellPage() {
  const user = useAuthStore((s) => s.currentUser);
  const addListing = useMarketplaceStore((s) => s.addListing);
  const publishBackendListing = useMarketplaceStore((s) => s.publishBackendListing);
  const refreshBackend = useMarketplaceStore((s) => s.refreshBackend);
  const catalogue = useCropCatalogue();
  const language = useLanguageStore((s) => s.language);
  const { showToast } = useToast();
  const [crop, setCrop] = useState<CropType>('tomato');
  const [quantity, setQuantity] = useState('25');
  const [price, setPrice] = useState('2000');
  const [date, setDate] = useState(nextWeek);
  const savedLocation = (user?.district ?? 'Dharwad, Karnataka').split(',').map((part) => part.trim());
  const [state, setState] = useState(INDIAN_STATES_AND_UTS.includes(savedLocation[1] as (typeof INDIAN_STATES_AND_UTS)[number]) ? savedLocation[1] : 'Karnataka');
  const [district, setDistrict] = useState(savedLocation[0] || 'Dharwad');
  const [notes, setNotes] = useState('');
  const [grade, setGrade] = useState('Grade A');
  const [photoUrlsText, setPhotoUrlsText] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user && isBackendAccount(user.id)) void refreshBackend().catch((error) => showToast(error.message, 'error')); }, [user?.id]);
  if (!user) return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (catalogue.loading || catalogue.error || !catalogue.crops.some((item) => item.slug === crop && item.isActive)) { showToast('Wait for the active crop catalogue to load, then select a crop.', 'error'); return; }
    if (!Number(quantity) || Number(quantity) < 1 || !Number(price) || Number(price) < 1 || !date || !district.trim()) { showToast('Enter a valid quantity, price, harvest date, and district.', 'error'); return; }
    const photoUrls = photoUrlsText.split(/\r?\n/).map((url) => url.trim()).filter(Boolean);
    if (photoUrls.length > 8 || photoUrls.some((url) => !/^https?:\/\//i.test(url))) { showToast('Use up to 8 valid image links, one per line.', 'error'); return; }
    setBusy(true);
    try {
      const location = `${district.trim()}, ${state}`;
      if (isBackendAccount(user.id)) await publishBackendListing({ crop, quantityQtl: Number(quantity), harvestDate: date, askingPricePerQtl: Number(price), district: location, description: notes.trim() || undefined, cropGrade: grade.trim() || undefined, photoUrls });
      else addListing({ farmerId: user.id, farmerName: user.name, farmerRole: user.role === 'fpo' ? 'fpo' : 'farmer', crop, quantityQuintals: Number(quantity), expectedHarvestDate: date, askingPricePerQuintal: Number(price), district: location, notes: notes.trim() || undefined, grade, photoUrls });
      showToast(isBackendAccount(user.id) ? 'Listing shared with the marketplace.' : 'Demo listing saved in this browser only. Sign in with a verified account to share it across devices.', 'success');
      setNotes(''); setPhotoUrlsText('');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not publish listing.', 'error'); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-6 py-2"><div><div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><PackagePlus className="h-5 w-5" /><span className="text-sm font-semibold">{translateUi("Farmer marketplace")}</span></div><h1 className="mt-1 text-3xl font-bold">{translateUi("Sell your harvest")}</h1><p className="mt-2 text-sm text-zinc-500">{translateUi("Publish expected produce so buyers can find and make offers before harvest.")}</p></div>
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900"><div className="sm:col-span-2"><CropSelector label={translateUi("Crop")} value={crop} onChange={setCrop} crops={catalogue.crops} categories={catalogue.categories} language={language} loading={catalogue.loading} error={catalogue.error} /></div><label className="text-sm font-semibold">{translateUi("Available quantity (quintals)")}<input type="number" min="1" step="1" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold">{translateUi("Crop grade")}<select required value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"><option value="Premium">{translateUi("Premium")}</option><option value="Grade A">{translateUi("Grade A")}</option><option value="Grade B">{translateUi("Grade B")}</option><option value="Grade C">{translateUi("Grade C")}</option><option value="FAQ">{translateUi("Fair Average Quality (FAQ)")}</option><option value="Not graded">{translateUi("Not graded")}</option></select></label><label className="text-sm font-semibold">{translateUi("Asking price per quintal")}<input type="number" min="1" step="1" required value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><CalendarDateField label={translateUi("Harvest date")} value={date} onChange={setDate} /><div className="sm:col-span-2 grid gap-4 sm:grid-cols-2"><StateDistrictFields state={state} district={district} onStateChange={(value) => { setState(value); setDistrict(''); }} onDistrictChange={setDistrict} /></div><label className="text-sm font-semibold sm:col-span-2">{translateUi("Photo links")} <span className="font-normal text-zinc-400">{translateUi("(up to 8, one per line)")}</span><textarea rows={2} value={photoUrlsText} onChange={(e) => setPhotoUrlsText(e.target.value)} placeholder={translateUi("https://example.com/harvest-photo.jpg")} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="text-sm font-semibold sm:col-span-2">{translateUi("Notes for buyers")} <span className="font-normal text-zinc-400">{translateUi("(optional)")}</span><textarea rows={3} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={translateUi("Quality, packaging, delivery details...")} className="mt-1 block w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label><div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-zinc-500">{translateUi("Estimated listing value:")} {money((Number(quantity)||0)*(Number(price)||0))}</p><button disabled={busy || catalogue.loading || Boolean(catalogue.error)} className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50">{translateUi(busy ? 'Publishing…' : 'Publish harvest listing')}</button></div></form>
  </div>;
}
