import { translateUi } from '../locales/translateUi';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import type { CropType } from '../types';
import { CropSelector, getCropName } from '../components/common/CropSelector';
import { useCropCatalogue } from '../hooks/useCropCatalogue';
import { useLanguageStore } from '../stores/languageStore';
import { normalizeCropIdentifier } from '../data/cropCatalog';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { generateSmartMatches } from '../utils/matching';
import { MatchCard } from '../components/matches/MatchCard';
import { useToast } from '../components/common/Toast';
import { isBackendAccount } from '../lib/api';

export default function MatchesPage() {
  const user = useAuthStore((s) => s.currentUser);
  const listings = useMarketplaceStore((s) => s.listings);
  const demands = useMarketplaceStore((s) => s.demands);
  const offers = useMarketplaceStore((s) => s.offers);
  const catalogue = useCropCatalogue();
  const language = useLanguageStore((s) => s.language);
  const sendOffer = useMarketplaceStore((s) => s.sendOffer);
  const createBackendOffer = useMarketplaceStore((s) => s.createBackendOffer);
  const refreshBackend = useMarketplaceStore((s) => s.refreshBackend);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [crop, setCrop] = useState<CropType | 'all'>('all');
  const [query, setQuery] = useState('');
  useEffect(() => { if (user && isBackendAccount(user.id)) void refreshBackend().catch((error) => showToast(error.message, 'error')); }, [user?.id]);

  const matches = useMemo(() => {
    if (!user) return [];
    let result = generateSmartMatches(listings, demands);
    if (user.role === 'buyer') result = result.filter((match) => match.demand.buyerId === user.id);
    else result = result.filter((match) => match.listing.farmerId === user.id);
    if (crop !== 'all') result = result.filter((match) => normalizeCropIdentifier(match.listing.crop) === normalizeCropIdentifier(crop));
    if (query.trim()) result = result.filter((match) => `${match.listing.farmerName} ${match.demand.buyerName} ${match.listing.district} ${match.demand.district}`.toLowerCase().includes(query.toLowerCase()));
    return result;
  }, [crop, demands, listings, query, user?.id, user?.role]);
  if (!user) return null;

  const offerMatch = async (match: (typeof matches)[number]) => {
    const existing = offers.find((offer) => offer.listingId === match.listing.id && offer.demandId === match.demand.id && ['pending', 'negotiating', 'confirmed'].includes(offer.status));
    if (existing) { showToast('There is already an active offer for this match.', 'info'); navigate('/dashboard'); return; }
    if (isBackendAccount(user.id)) {
      try {
        const subtotal = match.tradeQuantity * match.suggestedPrice;
        const transport = match.tradeQuantity * 80;
        const fee = subtotal * 0.025;
        await createBackendOffer({ listingId: match.listing.id, demandId: match.demand.id, quantity: match.tradeQuantity, price: match.suggestedPrice, note: `Estimated buyer total ₹${Math.round(subtotal + transport + fee).toLocaleString('en-IN')} (transport at ₹80/q and 2.5% platform fee).` });
        showToast('Offer shared with the other participant.');
        navigate('/dashboard');
      } catch (error) { showToast(error instanceof Error ? error.message : 'Could not send offer.', 'error'); }
      return;
    }
    const result = sendOffer({
      listingId: match.listing.id,
      demandId: match.demand.id,
      farmerId: match.listing.farmerId,
      farmerName: match.listing.farmerName,
      buyerId: match.demand.buyerId,
      buyerName: match.demand.buyerName,
      crop: match.listing.crop,
      quantityQuintals: match.tradeQuantity,
      pricePerQuintal: match.suggestedPrice,
      district: match.listing.district,
      initialSenderId: user.id,
      senderName: user.name,
      note: 'Offer sent from Smart Matches.',
    });
    if (!result.success) { showToast(result.message || 'Could not send offer.', 'error'); return; }
    showToast('Offer sent. It is now visible on your dashboard.');
    navigate('/dashboard');
  };

  return <div className="mx-auto max-w-6xl space-y-6 py-2">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><Sparkles className="h-5 w-5" /><span className="text-sm font-semibold">{translateUi("Smart matching")}</span></div><h1 className="mt-1 text-3xl font-bold">{translateUi("Matches for you")}</h1><p className="mt-2 text-sm text-zinc-500">{translateUi("Matches use crop, available quantity, price, delivery timing, and district proximity.")}</p></div><Link to={user.role === 'buyer' ? '/buy' : '/sell'} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold dark:border-zinc-700">{user.role === 'buyer' ? 'Edit requirements' : 'Edit listings'}</Link></div>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={translateUi("Search people or districts")} className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-3 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label><div className="min-w-64 flex-1"><CropSelector label={translateUi("Crop filter")} value={crop === 'all' ? '' : crop} onChange={setCrop} crops={catalogue.crops} categories={catalogue.categories} language={language} loading={catalogue.loading} error={catalogue.error} required={false} /></div><button type="button" onClick={() => setCrop('all')} className="rounded-xl border border-zinc-300 px-3 py-2.5 text-sm font-semibold dark:border-zinc-700">{translateUi("All crops")}</button></div>
    {matches.length ? <><p className="text-sm text-zinc-500">Showing {matches.length} compatible match{matches.length === 1 ? '' : 'es'}.</p><div className="grid gap-4 xl:grid-cols-2">{matches.map((match) => <MatchCard key={match.id} match={match} cropLabel={getCropName(match.listing.crop, catalogue.crops, language)} onSendOffer={offerMatch} />)}</div></> : <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"><Sparkles className="mx-auto h-8 w-8 text-emerald-600" /><h2 className="mt-3 font-bold">{translateUi("No matches found yet")}</h2><p className="mx-auto mt-1 max-w-md text-sm text-zinc-500">Post a {user.role === 'buyer' ? 'requirement' : 'harvest listing'} that shares a crop with another account, or clear your search filters.</p><Link to={user.role === 'buyer' ? '/buy' : '/sell'} className="mt-4 inline-flex rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Post {user.role === 'buyer' ? 'requirement' : 'harvest'}</Link></div>}
  </div>;
}
