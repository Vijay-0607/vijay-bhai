import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketplaceStore } from '../stores/marketplaceStore';

describe('Offer State Transitions and Negotiation Flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sends an initial offer in pending status with recipient assigned', () => {
    const store = useMarketplaceStore.getState();

    const result = store.sendOffer({
      listingId: 'listing-1',
      farmerId: 'farmer-1',
      farmerName: 'Lakshmi',
      buyerId: 'buyer-1',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 30,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'buyer-1',
      senderName: 'Hotel Naveen',
    });

    expect(result.success).toBe(true);
    expect(result.offerId).toBeDefined();

    const createdOffer = useMarketplaceStore
      .getState()
      .offers.find((o) => o.id === result.offerId);

    expect(createdOffer).toBeDefined();
    expect(createdOffer?.status).toBe('pending');
    // Buyer sent offer -> recipient turn is farmer-1
    expect(createdOffer?.currentTurnUserId).toBe('farmer-1');
  });

  it('rejects attempt by sender to accept their own offer', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-1',
      farmerId: 'farmer-1',
      farmerName: 'Lakshmi',
      buyerId: 'buyer-1',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 30,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'buyer-1',
      senderName: 'Hotel Naveen',
    });

    // buyer-1 tries to accept their own offer
    const acceptRes = store.respondToOffer(offerId!, 'accept', 'buyer-1');
    expect(acceptRes.success).toBe(false);
    expect(acceptRes.message).toContain('Only the party awaiting a response');
  });

  it('allows intended recipient to accept and confirms the deal', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-1',
      farmerId: 'farmer-1',
      farmerName: 'Lakshmi',
      buyerId: 'buyer-1',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 30,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'buyer-1',
      senderName: 'Hotel Naveen',
    });

    // farmer-1 accepts
    const acceptRes = store.respondToOffer(offerId!, 'accept', 'farmer-1');
    expect(acceptRes.success).toBe(true);

    const updated = useMarketplaceStore.getState().offers.find((o) => o.id === offerId);
    expect(updated?.status).toBe('confirmed');
    expect(updated?.currentTurnUserId).toBe('none');
  });

  it('prevents duplicate confirmation of an already confirmed deal', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-1',
      farmerId: 'farmer-1',
      farmerName: 'Lakshmi',
      buyerId: 'buyer-1',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 30,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'buyer-1',
      senderName: 'Hotel Naveen',
    });

    store.respondToOffer(offerId!, 'accept', 'farmer-1');

    // Second accept attempt
    const secondRes = store.respondToOffer(offerId!, 'accept', 'farmer-1');
    expect(secondRes.success).toBe(false);
  });

  it('supports counteroffer negotiation and transitions to negotiating status', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-1',
      farmerId: 'farmer-1',
      farmerName: 'Lakshmi',
      buyerId: 'buyer-1',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 30,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'buyer-1',
      senderName: 'Hotel Naveen',
    });

    // farmer counters with 2100
    const counterRes = store.counterOffer({
      offerId: offerId!,
      senderId: 'farmer-1',
      senderName: 'Lakshmi',
      newPricePerQuintal: 2100,
      newQuantityQuintals: 30,
      note: 'Asking ₹2,100 due to premium sorted quality.',
    });

    expect(counterRes.success).toBe(true);

    const updated = useMarketplaceStore.getState().offers.find((o) => o.id === offerId);
    expect(updated?.status).toBe('negotiating');
    expect(updated?.pricePerQuintal).toBe(2100);
    expect(updated?.currentTurnUserId).toBe('buyer-1'); // Turn flipped back to buyer
    expect(updated?.history.length).toBe(2);
  });
});
