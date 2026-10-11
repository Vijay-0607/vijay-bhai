import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { DealOffer, DealPayment } from '../../types';
import { apiRequest, isBackendAccount } from '../../lib/api';

const PAYMENT_HISTORY_KEY = 'mandimatch_payment_history';
const money = (amount: number) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const upiPattern = /^[\w.-]{2,256}@[\w.-]{2,64}$/;

function makeUpiLink(upiId: string, payeeName: string, amount: number, note: string): string {
  if (!upiPattern.test(upiId.trim()) || !Number.isFinite(amount) || amount <= 0) return '';
  const params = new URLSearchParams({ pa: upiId.trim(), pn: payeeName, am: amount.toFixed(2), cu: 'INR', tn: note });
  return `upi://pay?${params.toString()}`;
}

function readPaymentHistory(): DealPayment[] {
  try { return JSON.parse(localStorage.getItem(PAYMENT_HISTORY_KEY) ?? '[]') as DealPayment[]; } catch { return []; }
}

export function DealPaymentPanel({ offer, userId, onRecorded }: { offer: DealOffer; userId: string; onRecorded: () => Promise<void> }) {
  const users = useAuthStore((state) => state.users);
  const [history, setHistory] = useState<DealPayment[]>(readPaymentHistory);
  const [platformUpiId, setPlatformUpiId] = useState<string>(import.meta.env.VITE_PLATFORM_UPI_ID ?? '');
  const [busy, setBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [farmerPaymentOpened, setFarmerPaymentOpened] = useState(false);
  const [platformPaymentOpened, setPlatformPaymentOpened] = useState(false);
  const payment = history.find((item) => item.offerId === offer.id);
  const isBuyer = userId === offer.buyerId;
  const buyer = users.find((user) => user.id === offer.buyerId);
  const farmer = users.find((user) => user.id === offer.farmerId);
  const allHistory = useMemo(() => history.filter((item) => item.buyerId === userId || item.farmerId === userId), [history, userId]);
  const farmerPayLink = useMemo(() => makeUpiLink(farmer?.upiId ?? offer.farmerUpiId ?? '', offer.farmerName, offer.totalDealValue, `MandiMatch ${offer.crop} produce`), [farmer?.upiId, offer.farmerUpiId, offer.farmerName, offer.totalDealValue, offer.crop]);
  const platformPayLink = useMemo(() => makeUpiLink(platformUpiId, 'MandiMatch Platform', offer.estimatedCommission, 'MandiMatch platform fee'), [platformUpiId, offer.estimatedCommission]);

  useEffect(() => {
    if (!isBackendAccount(userId)) return;
    void apiRequest<{ payments: DealPayment[] }>('/deals/payments/history').then(({ payments }) => setHistory(payments)).catch(() => {});
    void apiRequest<{ platformUpiId: string | null }>('/deals/payment-settings').then(({ platformUpiId: configuredId }) => setPlatformUpiId(configuredId ?? '')).catch(() => {});
  }, [userId]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const buyerUpiId = (buyer?.upiId ?? offer.buyerUpiId ?? '').trim();
    const farmerUpiId = (farmer?.upiId ?? offer.farmerUpiId ?? '').trim();
    const feeUpiId = platformUpiId.trim();
    if (!isBuyer || !upiPattern.test(buyerUpiId) || !upiPattern.test(farmerUpiId) || !upiPattern.test(feeUpiId)) return;
    setBusy(true);
    setPaymentError('');
    try {
      let record: DealPayment;
      if (isBackendAccount(userId)) {
        if (!offer.dealId) throw new Error('Deal details are still loading. Refresh and try again.');
        const result = await apiRequest<{ payment: DealPayment }>(`/deals/${offer.dealId}/payment`, { method: 'POST', body: JSON.stringify({}) });
        record = result.payment;
      } else {
        record = {
        id: `payment-${Date.now()}`, offerId: offer.id, buyerId: offer.buyerId, farmerId: offer.farmerId,
        buyerName: offer.buyerName, farmerName: offer.farmerName, method: 'upi', buyerUpiId, farmerUpiId, platformUpiId: feeUpiId,
        produceAmount: offer.totalDealValue, platformFee: offer.estimatedCommission,
        totalPaid: offer.totalDealValue + offer.estimatedCommission, status: 'recorded_demo', createdAt: new Date().toISOString(),
        };
      }
      await onRecorded();
      const next = [record, ...history];
      if (!isBackendAccount(userId)) localStorage.setItem(PAYMENT_HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Could not record this payment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
    <h4 className="font-semibold">{payment ? 'Payment history' : 'Payment & settlement'}</h4>
    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">The buyer pays {money(offer.totalDealValue)} to the farmer and an estimated {money(offer.estimatedCommission)} platform fee. Total: <strong>{money(offer.totalDealValue + offer.estimatedCommission)}</strong>.</p>
    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3"><p className="rounded-lg bg-white p-3 dark:bg-zinc-900"><span className="block text-xs text-zinc-500">Farmer receives</span><strong>{money(offer.totalDealValue)}</strong></p><p className="rounded-lg bg-white p-3 dark:bg-zinc-900"><span className="block text-xs text-zinc-500">Estimated platform fee</span><strong>{money(offer.estimatedCommission)}</strong></p><p className="rounded-lg bg-white p-3 dark:bg-zinc-900"><span className="block text-xs text-zinc-500">Buyer pays in total</span><strong>{money(offer.totalDealValue + offer.estimatedCommission)}</strong></p></div>
    {payment && <div className="mt-3 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"><p className="font-semibold">Payment recorded · UPI · {new Date(payment.createdAt).toLocaleString()}</p><p className="mt-1 text-zinc-600 dark:text-zinc-300">Farmer amount: {money(payment.produceAmount)} · Platform fee: {money(payment.platformFee)} · Total: {money(payment.totalPaid)}</p><p className="mt-1 text-xs text-zinc-500">Buyer UPI: {payment.buyerUpiId} · Farmer UPI: {payment.farmerUpiId} · Fee destination: {payment.platformUpiId}</p><p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">Demo record only. This app does not transfer or verify money.</p></div>}
    {!payment && isBuyer && <form onSubmit={(event) => void submit(event)} className="mt-4 space-y-3">
      <div className="rounded-lg bg-white p-3 text-sm dark:bg-zinc-900"><p>Buyer UPI: <strong>{buyer?.upiId ?? offer.buyerUpiId ?? 'Add in Profile'}</strong></p><p className="mt-1">Farmer UPI: <strong>{farmer?.upiId ?? offer.farmerUpiId ?? 'Farmer must add in Profile'}</strong></p><p className="mt-2 text-xs text-zinc-500">Both users must save a valid UPI ID in their profile before the offer can be confirmed.</p></div>
      <p className="rounded-lg bg-white p-3 text-sm dark:bg-zinc-900">Platform UPI (automatically configured): <strong>{platformUpiId || 'Not configured by developer'}</strong></p>
      <div className="grid gap-2 sm:grid-cols-2"><a href={farmerPayLink || undefined} onClick={() => setFarmerPaymentOpened(true)} aria-disabled={!farmerPayLink} className={`rounded-lg px-4 py-3 text-center text-sm font-semibold text-white ${farmerPayLink ? 'bg-emerald-700 hover:bg-emerald-800' : 'pointer-events-none bg-zinc-400'}`}>Pay farmer {money(offer.totalDealValue)} via UPI</a><a href={platformPayLink || undefined} onClick={() => setPlatformPaymentOpened(true)} aria-disabled={!platformPayLink} className={`rounded-lg px-4 py-3 text-center text-sm font-semibold text-white ${platformPayLink ? 'bg-emerald-700 hover:bg-emerald-800' : 'pointer-events-none bg-zinc-400'}`}>Pay platform fee {money(offer.estimatedCommission)} via UPI</a></div>
      <p className="text-xs text-zinc-500">The total is calculated for you. These links open your UPI app with the correct amount and recipient. Complete both payments, then record settlement below. This demo cannot verify payment with your bank.</p>
      {paymentError && <p role="alert" className="text-sm font-medium text-rose-700">{paymentError}</p>}
      <button disabled={busy || !upiPattern.test((buyer?.upiId ?? offer.buyerUpiId ?? '').trim()) || !upiPattern.test((farmer?.upiId ?? offer.farmerUpiId ?? '').trim()) || !upiPattern.test(platformUpiId.trim()) || !farmerPaymentOpened || !platformPaymentOpened} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving payment record…' : `I paid ${money(offer.totalDealValue + offer.estimatedCommission)} — record & complete deal`}</button>
    </form>}
    {!payment && !isBuyer && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">Waiting for the buyer to record settlement. Make sure your UPI ID is saved in your profile.</p>}
    {allHistory.length > 0 && <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-700"><h5 className="text-sm font-semibold">Your payment history</h5><ul className="mt-2 space-y-2">{allHistory.map((item) => <li key={item.id} className="rounded-lg bg-white p-3 text-xs dark:bg-zinc-900"><span className="font-semibold">{item.farmerName} · {money(item.totalPaid)} · {item.status === 'recorded_demo' ? 'Recorded (demo)' : item.status}</span><span className="mt-1 block text-zinc-500">Farmer {money(item.produceAmount)} + estimated fee {money(item.platformFee)} · {new Date(item.createdAt).toLocaleString()}</span></li>)}</ul></div>}
  </section>;
}
