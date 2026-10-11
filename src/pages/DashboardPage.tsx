import { translateUi } from '../locales/translateUi';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock3, IndianRupee, Leaf, Package, Scale, ShoppingBag } from 'lucide-react';
import type { DealOffer, OfferStatus } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { useToast } from '../components/common/Toast';
import { getCropName } from '../components/common/CropSelector';
import { useCropCatalogue } from '../hooks/useCropCatalogue';
import { useLanguageStore } from '../stores/languageStore';
import { DealTimeline } from '../components/offers/DealTimeline';
import { MetricCard } from '../components/dashboard/MetricCard';
import { CommissionCalculator } from '../components/dashboard/CommissionCalculator';
import { isBackendAccount } from '../lib/api';

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const statusLabel: Record<OfferStatus, string> = { pending: 'Offer sent', negotiating: 'Negotiating', confirmed: 'Confirmed', completed: 'Completed', rejected: 'Declined', withdrawn: 'Withdrawn' };

export default function DashboardPage() {
  const user = useAuthStore((s) => s.currentUser);
  const listings = useMarketplaceStore((s) => s.listings);
  const demands = useMarketplaceStore((s) => s.demands);
  const offers = useMarketplaceStore((s) => s.offers);
  const respond = useMarketplaceStore((s) => s.respondToOffer);
  const counter = useMarketplaceStore((s) => s.counterOffer);
  const complete = useMarketplaceStore((s) => s.completeDeal);
  const respondBackendOffer = useMarketplaceStore((s) => s.respondBackendOffer);
  const completeBackendDeal = useMarketplaceStore((s) => s.completeBackendDeal);
  const refreshBackend = useMarketplaceStore((s) => s.refreshBackend);
  const reviewBackendDeal = useMarketplaceStore((s) => s.reviewBackendDeal);
  const { showToast } = useToast();
  const language = useLanguageStore((s) => s.language);
  const catalogue = useCropCatalogue();
  const [countering, setCountering] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewedDealIds, setReviewedDealIds] = useState<string[]>([]);
  useEffect(() => { if (user && isBackendAccount(user.id)) void refreshBackend().catch((error) => showToast(error.message, 'error')); }, [user?.id]);
  if (!user) return null;

  const mine = (o: DealOffer) => o.farmerId === user.id || o.buyerId === user.id;
  const userOffers = offers.filter(mine).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const myListings = listings.filter((l) => l.farmerId === user.id);
  const myDemands = demands.filter((d) => d.buyerId === user.id);
  const awaitingMe = userOffers.filter((o) => o.currentTurnUserId === user.id && (o.status === 'pending' || o.status === 'negotiating'));
  const activeOffers = userOffers.filter((o) => o.status === 'pending' || o.status === 'negotiating');
  const confirmed = userOffers.filter((o) => o.status === 'confirmed' || o.status === 'completed');
  const totalValue = confirmed.reduce((sum, o) => sum + o.totalDealValue, 0);
  const volume = confirmed.reduce((sum, o) => sum + o.quantityQuintals, 0);
  const ownedCount = user.role === 'buyer' ? myDemands.length : myListings.length;
  const { icon, title } = { icon: user.role === 'buyer' ? <ShoppingBag className="h-5 w-5" /> : <Leaf className="h-5 w-5" />, title: user.role === 'buyer' ? 'Buyer dashboard' : user.role === 'fpo' ? 'FPO dashboard' : 'Farmer dashboard' };

  const respondTo = async (offer: DealOffer, action: 'accept' | 'reject') => {
    if (isBackendAccount(user.id)) {
      try { await respondBackendOffer(offer.id, action); showToast(action === 'accept' ? 'Deal confirmed.' : 'Offer declined.', 'success'); }
      catch (error) { showToast(error instanceof Error ? error.message : 'Could not update offer.', 'error'); }
      return;
    }
    const result = respond(offer.id, action, user.id);
    showToast(result.success ? (action === 'accept' ? 'Deal confirmed.' : 'Offer declined.') : result.message || 'Could not update offer.', result.success ? 'success' : 'error');
  };
  const submitCounter = async (offer: DealOffer) => {
    if (isBackendAccount(user.id)) {
      try { await respondBackendOffer(offer.id, 'counter', { price: Number(price), quantity: Number(quantity) }); showToast('Counteroffer sent.'); setCountering(null); }
      catch (error) { showToast(error instanceof Error ? error.message : 'Could not send counteroffer.', 'error'); }
      return;
    }
    const result = counter({ offerId: offer.id, senderId: user.id, senderName: user.name, newPricePerQuintal: Number(price), newQuantityQuintals: Number(quantity) });
    if (result.success) { showToast('Counteroffer sent.'); setCountering(null); }
    else showToast(result.message || 'Could not send counteroffer.', 'error');
  };

  return <div className="mx-auto max-w-6xl space-y-6 py-2">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{translateUi(`Welcome back, ${user.name.split(' ')[0]}`)}</p><h1 className="mt-1 text-3xl font-bold text-zinc-900 dark:text-white">{translateUi(title)}</h1><p className="mt-2 text-sm text-zinc-500">{translateUi("Your listings, buyer matches, and deal activity in one place.")}</p></div>
      <div className="flex flex-wrap gap-2">{user.role === 'buyer' ? <Link to="/buy" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">{translateUi("Post a requirement")}</Link> : <Link to="/sell" className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white">{translateUi("List a harvest")}</Link>}<Link to="/matches" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold dark:border-zinc-700">{translateUi("View matches")}</Link></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard title={user.role === 'buyer' ? 'Open requirements' : 'Active listings'} value={ownedCount} subtitle={user.role === 'buyer' ? 'your buyer posts' : 'your harvest posts'} icon={icon} to={user.role === 'buyer' ? '/buy#your-requirements' : '/sell#your-listings'} actionLabel={user.role === 'buyer' ? 'View requirements' : 'View listings'} />
      <MetricCard title="Needs your response" value={awaitingMe.length} subtitle="offers waiting on you" icon={<Clock3 className="h-5 w-5" />} accentColor="amber" />
      <MetricCard title="Trade volume" value={`${volume} q`} subtitle="confirmed and completed" icon={<Package className="h-5 w-5" />} />
      <MetricCard title="Agreed value" value={money(totalValue)} subtitle={`${confirmed.length} ${translateUi(confirmed.length === 1 ? 'confirmed deal' : 'confirmed deals')}`} icon={<IndianRupee className="h-5 w-5" />} />
    </div>
    {awaitingMe.length > 0 && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20"><div className="mb-3 flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200"><Scale className="h-5 w-5" /> {translateUi("Offers waiting for your response")} <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs dark:bg-amber-900">{awaitingMe.length}</span></div><p className="text-sm text-amber-800 dark:text-amber-300">{translateUi("Open a deal below to accept, decline, or counter the offer. The other participant must sign in to their own account to respond.")}</p></section>}
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">{translateUi("Offers & deals")}</h2><p className="text-sm text-zinc-500">{translateUi("Every offer stays here as it moves through negotiation.")}</p></div><span className="text-xs text-zinc-500">{activeOffers.length} {translateUi('active')}</span></div>
      {userOffers.length === 0 ? <div className="rounded-xl bg-zinc-50 p-8 text-center dark:bg-zinc-800/50"><p className="font-semibold">{translateUi("No deals yet")}</p><p className="mt-1 text-sm text-zinc-500">{translateUi("Create a listing or requirement, then find a match to start your first conversation.")}</p><Link to={user.role === 'buyer' ? '/buy' : '/sell'} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">{translateUi("Get started")} <ArrowRight className="h-4 w-4" /></Link></div> : <div className="space-y-4">{userOffers.map((offer) => { const waiting = offer.currentTurnUserId === user.id && (offer.status === 'pending' || offer.status === 'negotiating'); const contactPhone = user.id === offer.farmerId ? offer.buyerPhone : offer.farmerPhone; const contactName = user.id === offer.farmerId ? offer.buyerName : offer.farmerName; return <article key={offer.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{getCropName(offer.crop, catalogue.crops, language)} · {offer.quantityQuintals} q</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${offer.status === 'confirmed' || offer.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : offer.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'}`}>{translateUi(statusLabel[offer.status])}</span>{waiting && <span className="text-xs font-semibold text-amber-700">{translateUi("Your turn")}</span>}</div><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{offer.farmerName} ↔ {offer.buyerName} · {offer.district}</p><p className="mt-1 text-sm">{money(offer.pricePerQuintal)}/q · total {money(offer.totalDealValue)} · fee estimate {money(offer.estimatedCommission)}</p>{contactPhone && (offer.status === 'confirmed' || offer.status === 'completed') && <p className="mt-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">Confirmed deal contact · {contactName}: <a href={`tel:${contactPhone}`} className="underline">{contactPhone}</a></p>}</div>{offer.status === 'confirmed' && <button onClick={async () => { try { if (isBackendAccount(user.id)) await completeBackendDeal(offer.id); else { const r = complete(offer.id, user.id); if (!r.success) throw new Error(r.message); } showToast('Deal marked complete.', 'success'); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not complete deal.', 'error'); } }} className="rounded-lg border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:text-emerald-300">{translateUi("Mark completed")}</button>}</div>
        {offer.status === 'completed' && isBackendAccount(user.id) && offer.dealId && !reviewedDealIds.includes(offer.dealId) && <form className="mt-3 grid gap-2 rounded-xl bg-emerald-50 p-3 sm:grid-cols-[130px_1fr_auto] dark:bg-emerald-950/20" onSubmit={async (event) => { event.preventDefault(); try { await reviewBackendDeal(offer.dealId!, reviewRating, reviewComment); setReviewedDealIds((items) => [...items, offer.dealId!]); showToast(`Review sent for ${user.id === offer.farmerId ? offer.buyerName : offer.farmerName}.`); setReviewComment(''); } catch (error) { showToast(error instanceof Error ? error.message : 'Could not submit review.', 'error'); } }}><label className="text-xs font-semibold">{translateUi("Rate the deal")}<select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"><option value={5}>{translateUi("5 · Great")}</option><option value={4}>{translateUi("4 · Good")}</option><option value={3}>{translateUi("3 · Okay")}</option><option value={2}>{translateUi("2 · Poor")}</option><option value={1}>{translateUi("1 · Bad")}</option></select></label><label className="text-xs font-semibold">{translateUi("Review (optional)")}<input maxLength={500} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder={translateUi("Share how the trade went")} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label><button className="self-end rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white">{translateUi("Submit review")}</button></form>}
        {offer.status === 'completed' && reviewedDealIds.includes(offer.dealId ?? '') && <p className="mt-2 text-xs font-semibold text-emerald-700">{translateUi("Thanks for reviewing this completed trade.")}</p>}
        <div className="mt-3"><DealTimeline status={offer.status} history={offer.history} /></div>
        {waiting && <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => respondTo(offer, 'accept')} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">{translateUi("Accept")}</button><button onClick={() => respondTo(offer, 'reject')} className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700">{translateUi("Decline")}</button><button onClick={() => { setCountering(countering === offer.id ? null : offer.id); setPrice(String(offer.pricePerQuintal)); setQuantity(String(offer.quantityQuintals)); }} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold dark:border-zinc-700">{translateUi("Counteroffer")}</button></div>}
        {countering === offer.id && waiting && <div className="mt-3 grid gap-3 rounded-xl bg-zinc-50 p-3 sm:grid-cols-[1fr_1fr_auto] dark:bg-zinc-800/60"><label className="text-xs font-semibold">{translateUi("Your price per quintal")}<input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label><label className="text-xs font-semibold">{translateUi("Quantity (quintals)")}<input type="number" min="1" max={Math.min(listings.find(l => l.id === offer.listingId)?.availableQuantityQuintals ?? offer.quantityQuintals, demands.find(d => d.id === offer.demandId)?.requiredQuantityQuintals ?? offer.quantityQuintals)} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900" /></label><button onClick={() => submitCounter(offer)} disabled={!Number(price) || !Number(quantity)} className="self-end rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{translateUi("Send counter")}</button></div>}
      </article>; })}</div>}
    </section>
    {user.role !== 'buyer' && <CommissionCalculator />}
    <section className="grid gap-4 md:grid-cols-2"><Link to="/sell" className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-emerald-400 dark:border-zinc-800 dark:bg-zinc-900"><p className="font-bold">{translateUi("Your harvest listings")}</p><p className="mt-1 text-sm text-zinc-500">{translateUi(`${myListings.length} ${myListings.length === 1 ? 'listing' : 'listings'} published`)}</p></Link><Link to="/buy" className="rounded-2xl border border-zinc-200 bg-white p-5 hover:border-amber-400 dark:border-zinc-800 dark:bg-zinc-900"><p className="font-bold">{translateUi("Your buyer requirements")}</p><p className="mt-1 text-sm text-zinc-500">{translateUi(`${myDemands.length} ${myDemands.length === 1 ? 'requirement' : 'requirements'} posted`)}</p></Link></section>
  </div>;
}
