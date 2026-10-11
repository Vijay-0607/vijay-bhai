import { translateUi } from '../locales/translateUi';
import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Leaf, MapPin, Pencil, ShoppingBag, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useToast } from '../components/common/Toast';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { isBackendAccount } from '../lib/api';
import { apiRequest } from '../lib/api';
import { getCropName } from '../components/common/CropSelector';
import { useCropCatalogue } from '../hooks/useCropCatalogue';
import { useLanguageStore } from '../stores/languageStore';
import type { CropType, Language } from '../types';

type EditPost = { kind: 'listing' | 'demand'; id: string };
type PostForm = { crop: string; quantity: string; price: string; date: string; district: string; notes: string; grade: string };
const emptyPost: PostForm = { crop: '', quantity: '', price: '', date: '', district: '', notes: '', grade: 'Grade A' };

export default function ProfilePage() {
  const user = useAuthStore((s) => s.currentUser);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const listings = useMarketplaceStore((s) => s.listings);
  const demands = useMarketplaceStore((s) => s.demands);
  const offers = useMarketplaceStore((s) => s.offers);
  const refreshBackend = useMarketplaceStore((s) => s.refreshBackend);
  const updateListing = useMarketplaceStore((s) => s.updateListing);
  const updateDemand = useMarketplaceStore((s) => s.updateDemand);
  const updateBackendListing = useMarketplaceStore((s) => s.updateBackendListing);
  const updateBackendDemand = useMarketplaceStore((s) => s.updateBackendDemand);
  const languagePreference = useLanguageStore((s) => s.language);
  const catalogue = useCropCatalogue();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [language, setLanguage] = useState<Language>(user?.language ?? 'en');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [upiId, setUpiId] = useState(user?.upiId ?? '');
  const [editingPost, setEditingPost] = useState<EditPost | null>(null);
  const [historyView, setHistoryView] = useState<'buyer' | 'farmer'>(user?.role === 'buyer' ? 'buyer' : 'farmer');
  const [historyStatus, setHistoryStatus] = useState<'active' | 'completed'>('active');
  const [postForm, setPostForm] = useState<PostForm>(emptyPost);
  const [savingPost, setSavingPost] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setDistrict(user.district);
      setLanguage(user.language);
      setBio(user.bio ?? '');
      setUpiId(user.upiId ?? '');
    }
  }, [user]);
  useEffect(() => { if (user) setHistoryView(user.role === 'buyer' ? 'buyer' : 'farmer'); }, [user?.id]);
  useEffect(() => {
    if (user && isBackendAccount(user.id)) {
      void refreshBackend().catch((error) => showToast(error instanceof Error ? error.message : 'Could not load your marketplace history.', 'error'));
    }
  }, [user?.id]);

  if (!user) return null;
  const userOffers = offers.filter((offer) => offer.farmerId === user.id || offer.buyerId === user.id);
  const confirmedListingIds = new Set(userOffers.filter((offer) => offer.status === 'confirmed' || offer.status === 'completed').map((offer) => offer.listingId));
  const confirmedDemandIds = new Set(userOffers.filter((offer) => (offer.status === 'confirmed' || offer.status === 'completed') && offer.demandId).flatMap((offer) => offer.demandId ? [offer.demandId] : []));
  const completedListingIds = new Set(userOffers.filter((offer) => offer.status === 'completed').map((offer) => offer.listingId));
  const completedDemandIds = new Set(userOffers.filter((offer) => offer.status === 'completed' && offer.demandId).flatMap((offer) => offer.demandId ? [offer.demandId] : []));
  const myListings = listings.filter((listing) => listing.farmerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const myDemands = demands.filter((demand) => demand.buyerId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !district.trim()) { showToast('Name and district are required.', 'error'); return; }
    if (upiId.trim() && !/^[\w.-]{2,256}@[\w.-]{2,64}$/.test(upiId.trim())) { showToast('Enter a valid UPI ID, such as name@bank.', 'error'); return; }
    try {
      if (isBackendAccount(user.id)) await apiRequest('/auth/me/upi', { method: 'PATCH', body: JSON.stringify({ upiId: upiId.trim() }) });
      updateProfile({ name: name.trim(), district: district.trim(), language, bio: bio.trim(), upiId: upiId.trim() });
      showToast('Profile updated.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save your UPI ID.', 'error');
    }
  };

  const startListingEdit = (listing: (typeof myListings)[number]) => {
    setPostForm({ crop: listing.crop, quantity: String(listing.quantityQuintals), price: String(listing.askingPricePerQuintal), date: listing.expectedHarvestDate, district: listing.district, notes: listing.notes ?? '', grade: listing.grade ?? 'Grade A' });
    setEditingPost({ kind: 'listing', id: listing.id });
  };
  const startDemandEdit = (demand: (typeof myDemands)[number]) => {
    setPostForm({ crop: demand.crop, quantity: String(demand.requiredQuantityQuintals), price: String(demand.maxPricePerQuintal), date: demand.deliveryDate, district: demand.district, notes: demand.notes ?? '', grade: 'Grade A' });
    setEditingPost({ kind: 'demand', id: demand.id });
  };

  const savePostEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingPost || !postForm.crop || !Number(postForm.quantity) || !Number(postForm.price) || !postForm.date || !postForm.district.trim()) {
      showToast('Complete all required post details.', 'error');
      return;
    }
    setSavingPost(true);
    try {
      if (editingPost.kind === 'listing') {
        if (isBackendAccount(user.id)) {
          await updateBackendListing(editingPost.id, { crop: postForm.crop, quantityQtl: Number(postForm.quantity), harvestDate: postForm.date, askingPricePerQtl: Number(postForm.price), district: postForm.district.trim(), description: postForm.notes.trim(), cropGrade: postForm.grade });
        } else {
          updateListing(editingPost.id, { crop: postForm.crop as CropType, quantityQuintals: Number(postForm.quantity), availableQuantityQuintals: Number(postForm.quantity), expectedHarvestDate: postForm.date, askingPricePerQuintal: Number(postForm.price), district: postForm.district.trim(), notes: postForm.notes.trim() || undefined, grade: postForm.grade });
        }
      } else if (isBackendAccount(user.id)) {
        await updateBackendDemand(editingPost.id, { crop: postForm.crop, quantityQtl: Number(postForm.quantity), deliveryDate: postForm.date, maxPricePerQtl: Number(postForm.price), district: postForm.district.trim(), description: postForm.notes.trim() });
      } else {
        updateDemand(editingPost.id, { crop: postForm.crop as CropType, requiredQuantityQuintals: Number(postForm.quantity), deliveryDate: postForm.date, maxPricePerQuintal: Number(postForm.price), district: postForm.district.trim(), notes: postForm.notes.trim() || undefined });
      }
      showToast('Marketplace post updated.');
      setEditingPost(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not update this post.', 'error');
    } finally {
      setSavingPost(false);
    }
  };

  const statusFor = (status: string | undefined, confirmed: boolean, remaining: number, completed = false) => {
    if (completed) return 'Completed';
    if (confirmed) return 'Order confirmed';
    if (status === 'CANCELLED') return 'Cancelled';
    if (status === 'COMPLETED') return 'Completed';
    if (status === 'FULFILLED' || status === 'RESERVED' || remaining <= 0) return 'Fulfilled';
    if (status === 'PARTIALLY_FILLED' || status === 'PARTIALLY_RESERVED') return 'Partially filled';
    return 'Active';
  };
  const hasOpenOffer = (kind: EditPost['kind'], id: string) => userOffers.some((offer) => (kind === 'listing' ? offer.listingId === id : offer.demandId === id) && ['pending', 'negotiating'].includes(offer.status));
  const totalDemandQuantity = (demand: (typeof myDemands)[number]) => demand.totalRequiredQuantityQuintals ?? demand.requiredQuantityQuintals + userOffers.filter((offer) => offer.demandId === demand.id && ['confirmed', 'completed'].includes(offer.status)).reduce((sum, offer) => sum + offer.quantityQuintals, 0);
  const isDemandActive = (demand: (typeof myDemands)[number]) => !confirmedDemandIds.has(demand.id) && demand.status !== 'CANCELLED' && demand.status !== 'COMPLETED' && demand.status !== 'FULFILLED' && demand.requiredQuantityQuintals > 0;
  const isListingActive = (listing: (typeof myListings)[number]) => !confirmedListingIds.has(listing.id) && listing.status !== 'CANCELLED' && listing.status !== 'COMPLETED' && listing.status !== 'FULFILLED' && listing.availableQuantityQuintals > 0;
  const visibleDemands = myDemands.filter((demand) => isDemandActive(demand) === (historyStatus === 'active'));
  const visibleListings = myListings.filter((listing) => isListingActive(listing) === (historyStatus === 'active'));
  const demandActiveCount = myDemands.filter(isDemandActive).length;
  const listingActiveCount = myListings.filter(isListingActive).length;
  const dateTime = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };
  const demandTimestamp = (demand: (typeof myDemands)[number]) => historyStatus === 'active' ? demand.createdAt : userOffers.filter((offer) => offer.demandId === demand.id && ['confirmed', 'completed'].includes(offer.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt ?? demand.updatedAt ?? demand.createdAt;
  const listingTimestamp = (listing: (typeof myListings)[number]) => historyStatus === 'active' ? listing.createdAt : userOffers.filter((offer) => offer.listingId === listing.id && ['confirmed', 'completed'].includes(offer.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt ?? listing.updatedAt ?? listing.createdAt;
  const editForm = editingPost && <form onSubmit={savePostEdit} className="mt-3 grid gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:grid-cols-2">
    <label className="text-xs font-semibold">{translateUi('Crop')}<select required value={postForm.crop} onChange={(event) => setPostForm({ ...postForm, crop: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">{catalogue.crops.filter((crop) => crop.isActive).map((crop) => <option key={crop.slug} value={crop.slug}>{getCropName(crop.slug, catalogue.crops, languagePreference)}</option>)}</select></label>
    <label className="text-xs font-semibold">{translateUi('Quantity (quintals)')}<input type="number" min="1" required value={postForm.quantity} onChange={(event) => setPostForm({ ...postForm, quantity: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label>
    <label className="text-xs font-semibold">{translateUi(editingPost.kind === 'listing' ? 'Asking price per quintal' : 'Maximum price per quintal')}<input type="number" min="1" required value={postForm.price} onChange={(event) => setPostForm({ ...postForm, price: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label>
    <label className="text-xs font-semibold">{translateUi(editingPost.kind === 'listing' ? 'Harvest date' : 'Delivery date')}<input type="date" required value={postForm.date} onChange={(event) => setPostForm({ ...postForm, date: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label>
    <label className="text-xs font-semibold sm:col-span-2">{translateUi('District')}<input required value={postForm.district} onChange={(event) => setPostForm({ ...postForm, district: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label>
    {editingPost.kind === 'listing' && <label className="text-xs font-semibold sm:col-span-2">{translateUi('Crop grade')}<select value={postForm.grade} onChange={(event) => setPostForm({ ...postForm, grade: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">{['Premium', 'Grade A', 'Grade B', 'Grade C', 'FAQ', 'Not graded'].map((grade) => <option key={grade}>{grade}</option>)}</select></label>}
    <label className="text-xs font-semibold sm:col-span-2">{translateUi('Notes')}<textarea rows={2} maxLength={300} value={postForm.notes} onChange={(event) => setPostForm({ ...postForm, notes: event.target.value })} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label>
    <div className="flex gap-2 sm:col-span-2"><button disabled={savingPost} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{translateUi(savingPost ? 'Saving…' : 'Save changes')}</button><button type="button" onClick={() => setEditingPost(null)} className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"><X className="h-4 w-4" />{translateUi('Cancel')}</button></div>
  </form>;

  return <div className="mx-auto max-w-4xl space-y-6 py-3 sm:py-5">
    <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800"><p className="text-sm font-semibold capitalize text-emerald-700">{user.role} account</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{translateUi('My profile')}</h1><p className="mt-2 text-sm text-zinc-500">{translateUi('Update the details other marketplace users see.')}</p></div>
    <form onSubmit={submit} className="grid gap-x-5 gap-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:grid-cols-2 sm:p-6">
      <label className="block text-sm font-semibold">{translateUi('Name')}<input value={name} onChange={(event) => setName(event.target.value)} required className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 font-normal dark:border-zinc-700" /></label>
      <label className="block text-sm font-semibold">{translateUi('Email or phone')}<input value={user.emailOrPhone} readOnly className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 font-normal text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950" /></label>
      <label className="block text-sm font-semibold sm:col-span-2">{translateUi('Phone for deal contact')}<input type="tel" value={user.phone ?? ''} readOnly required aria-describedby="deal-contact-phone-help" placeholder={translateUi('A verified phone number is required')} className="mt-2 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 font-normal text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950" /><span id="deal-contact-phone-help" className="mt-1 block text-xs font-normal text-zinc-500">{translateUi('Your phone is shared with the other party only after a deal is confirmed.')}</span></label>
      <label className="block text-sm font-semibold sm:col-span-2">UPI ID <input type="text" inputMode="email" autoComplete="off" value={upiId} onChange={(event) => setUpiId(event.target.value)} pattern="[A-Za-z0-9._-]{2,256}@[A-Za-z0-9.-]{2,64}" placeholder="name@bank" required className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 font-normal dark:border-zinc-700" /><span className="mt-1 block text-xs font-normal text-zinc-500">Required before you can confirm a deal. Share only the UPI ID you use to receive or send payments.</span></label>
      <label className="block text-sm font-semibold">{translateUi('District')}<input value={district} onChange={(event) => setDistrict(event.target.value)} required className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 font-normal dark:border-zinc-700" /></label>
      <label className="block text-sm font-semibold">{translateUi('Preferred language')}<select value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-3 py-3 font-normal dark:border-zinc-700 dark:bg-zinc-950"><option value="en">{translateUi('English')}</option><option value="hi">{translateUi('Hindi')}</option><option value="kn">{translateUi('Kannada')}</option></select></label>
      <label className="block text-sm font-semibold sm:col-span-2">{translateUi('About you')}<textarea rows={4} maxLength={300} value={bio} onChange={(event) => setBio(event.target.value)} className="mt-2 w-full rounded-xl border border-zinc-300 bg-transparent px-3 py-3 font-normal dark:border-zinc-700 dark:bg-zinc-950" /></label>
      <div className="flex flex-col-reverse gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm text-zinc-500">{user.completedDealsCount ?? 0} completed deals · {user.rating ?? 'New'} rating</span><button className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-emerald-800">{translateUi('Save profile')}</button></div>
    </form>

    <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{translateUi(historyView === 'buyer' ? 'Buyer requirement history' : 'Harvest listing history')}</h2><p className="text-sm text-zinc-500">{historyView === 'buyer' ? myDemands.length : myListings.length} {translateUi('posts')}</p></div>
        <div className="inline-flex rounded-xl border border-zinc-200 p-1 dark:border-zinc-700" role="group" aria-label={translateUi('Choose profile history')}>
          <button type="button" aria-pressed={historyView === 'farmer'} onClick={() => { setHistoryView('farmer'); setEditingPost(null); }} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${historyView === 'farmer' ? 'bg-emerald-700 text-white' : 'text-zinc-600 dark:text-zinc-300'}`}><Leaf className="h-4 w-4" />{translateUi('Farmer')}</button>
          <button type="button" aria-pressed={historyView === 'buyer'} onClick={() => { setHistoryView('buyer'); setEditingPost(null); }} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${historyView === 'buyer' ? 'bg-amber-500 text-amber-950' : 'text-zinc-600 dark:text-zinc-300'}`}><ShoppingBag className="h-4 w-4" />{translateUi('Buyer')}</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-zinc-200 p-1 dark:border-zinc-700" role="group" aria-label={translateUi('Filter history')}>
          <button type="button" aria-pressed={historyStatus === 'active'} onClick={() => { setHistoryStatus('active'); setEditingPost(null); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${historyStatus === 'active' ? 'bg-emerald-700 text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>{translateUi('Active')} · {historyView === 'buyer' ? demandActiveCount : listingActiveCount}</button>
          <button type="button" aria-pressed={historyStatus === 'completed'} onClick={() => { setHistoryStatus('completed'); setEditingPost(null); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${historyStatus === 'completed' ? 'bg-emerald-700 text-white' : 'text-zinc-600 dark:text-zinc-300'}`}>{translateUi('Completed')} · {historyView === 'buyer' ? myDemands.length - demandActiveCount : myListings.length - listingActiveCount}</button>
        </div>
        {historyStatus === 'active' && <Link to={historyView === 'buyer' ? '/buy' : '/sell'} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700">{translateUi(historyView === 'buyer' ? 'Manage requirements' : 'Manage harvests')}</Link>}
      </div>
      {historyView === 'buyer' ? visibleDemands.length === 0 ? <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800">{translateUi(historyStatus === 'active' ? 'No active requirements in this history.' : 'No completed requirements in this history.')}</p> : <div className="space-y-3">{visibleDemands.map((demand) => { const confirmed = confirmedDemandIds.has(demand.id); const canEdit = historyStatus === 'active' && !confirmed && !hasOpenOffer('demand', demand.id) && (demand.status === undefined || demand.status === 'ACTIVE'); return <article key={demand.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h3 className="font-semibold">{getCropName(demand.crop, catalogue.crops, languagePreference)} · {totalDemandQuantity(demand)} q {translateUi('required')}</h3><span className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">{translateUi(statusFor(demand.status, confirmed, demand.requiredQuantityQuintals, completedDemandIds.has(demand.id)))}</span></div><p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500"><span><MapPin className="mr-1 inline h-4 w-4" />{demand.district}</span><span><CalendarDays className="mr-1 inline h-4 w-4" />{translateUi('Delivery')} {demand.deliveryDate}</span><span>{translateUi('Remaining')}: {demand.requiredQuantityQuintals} q</span><span>Up to ₹{demand.maxPricePerQuintal}/q</span></p><p className="mt-2 text-xs text-zinc-500"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{translateUi(historyStatus === 'active' ? 'Posted' : 'Completed / closed')} · {dateTime(demandTimestamp(demand))}</p>{demand.notes && <p className="mt-2 text-sm text-zinc-500">{demand.notes}</p>}</div>{canEdit && <button onClick={() => startDemandEdit(demand)} className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"><Pencil className="h-4 w-4" />{translateUi('Edit')}</button>}</div>{editingPost?.kind === 'demand' && editingPost.id === demand.id && editForm}</article>; })}</div> : visibleListings.length === 0 ? <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800">{translateUi(historyStatus === 'active' ? 'No active listings in this history.' : 'No completed listings in this history.')}</p> : <div className="space-y-3">{visibleListings.map((listing) => { const confirmed = confirmedListingIds.has(listing.id); const canEdit = historyStatus === 'active' && !confirmed && !hasOpenOffer('listing', listing.id) && (listing.status === undefined || listing.status === 'ACTIVE'); return <article key={listing.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{getCropName(listing.crop, catalogue.crops, languagePreference)} · {listing.quantityQuintals} q</h3><span className="rounded-full bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800">{translateUi(statusFor(listing.status, confirmed, listing.availableQuantityQuintals, completedListingIds.has(listing.id)))}</span></div><p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-500"><span><MapPin className="mr-1 inline h-4 w-4" />{listing.district}</span><span><CalendarDays className="mr-1 inline h-4 w-4" />{translateUi('Harvest')} {listing.expectedHarvestDate}</span><span>{listing.availableQuantityQuintals} q {translateUi('available')}</span><span>₹{listing.askingPricePerQuintal}/q · {listing.grade ?? 'Grade not specified'}</span></p><p className="mt-2 text-xs text-zinc-500"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{translateUi(historyStatus === 'active' ? 'Posted' : 'Completed / closed')} · {dateTime(listingTimestamp(listing))}</p>{listing.notes && <p className="mt-2 text-sm text-zinc-500">{listing.notes}</p>}</div>{canEdit && <button onClick={() => startListingEdit(listing)} className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700"><Pencil className="h-4 w-4" />{translateUi('Edit')}</button>}</div>{editingPost?.kind === 'listing' && editingPost.id === listing.id && editForm}</article>; })}</div>}
    </section>
  </div>;
}
