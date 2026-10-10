import { describe, it, expect, beforeEach } from 'vitest';
import { useMarketplaceStore } from '../stores/marketplaceStore';
import { SEED_DEMANDS, SEED_LISTINGS, SEED_OFFERS } from '../data/seedData';

describe('Offer State Transitions and Negotiation Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useMarketplaceStore.setState({
      listings: SEED_LISTINGS.map((listing) => ({ ...listing })),
      demands: SEED_DEMANDS.map((demand) => ({ ...demand })),
      offers: SEED_OFFERS.map((offer) => ({ ...offer, history: [...offer.history] })),
      priceAlerts: [],
      waitlist: [],
    });
  });

  it('sends an initial offer in pending status with recipient assigned', () => {
    const store = useMarketplaceStore.getState();

    const result = store.sendOffer({
      listingId: 'listing-tomato-lakshmi',
      farmerId: 'user-farmer-lakshmi',
      farmerName: 'Lakshmi',
      buyerId: 'user-buyer-hotel-naveen',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 20,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'user-buyer-hotel-naveen',
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
    expect(createdOffer?.currentTurnUserId).toBe('user-farmer-lakshmi');
  });

  it('rejects attempt by sender to accept their own offer', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-tomato-lakshmi',
      farmerId: 'user-farmer-lakshmi',
      farmerName: 'Lakshmi',
      buyerId: 'user-buyer-hotel-naveen',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 20,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'user-buyer-hotel-naveen',
      senderName: 'Hotel Naveen',
    });

    // buyer-1 tries to accept their own offer
    const acceptRes = store.respondToOffer(offerId!, 'accept', 'user-buyer-hotel-naveen');
    expect(acceptRes.success).toBe(false);
    expect(acceptRes.message).toContain('Only the party awaiting a response');
  });

  it('allows intended recipient to accept and confirms the deal', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-tomato-lakshmi',
      farmerId: 'user-farmer-lakshmi',
      farmerName: 'Lakshmi',
      buyerId: 'user-buyer-hotel-naveen',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 20,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'user-buyer-hotel-naveen',
      senderName: 'Hotel Naveen',
    });

    // farmer-1 accepts
    const acceptRes = store.respondToOffer(offerId!, 'accept', 'user-farmer-lakshmi');
    expect(acceptRes.success).toBe(true);

    const updated = useMarketplaceStore.getState().offers.find((o) => o.id === offerId);
    expect(updated?.status).toBe('confirmed');
    expect(updated?.currentTurnUserId).toBe('none');
  });

  it('prevents duplicate confirmation of an already confirmed deal', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-tomato-lakshmi',
      farmerId: 'user-farmer-lakshmi',
      farmerName: 'Lakshmi',
      buyerId: 'user-buyer-hotel-naveen',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 20,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'user-buyer-hotel-naveen',
      senderName: 'Hotel Naveen',
    });

    store.respondToOffer(offerId!, 'accept', 'user-farmer-lakshmi');

    // Second accept attempt
    const secondRes = store.respondToOffer(offerId!, 'accept', 'user-farmer-lakshmi');
    expect(secondRes.success).toBe(false);
  });

  it('supports counteroffer negotiation and transitions to negotiating status', () => {
    const store = useMarketplaceStore.getState();

    const { offerId } = store.sendOffer({
      listingId: 'listing-tomato-lakshmi',
      farmerId: 'user-farmer-lakshmi',
      farmerName: 'Lakshmi',
      buyerId: 'user-buyer-hotel-naveen',
      buyerName: 'Hotel Naveen',
      crop: 'Tomato',
      quantityQuintals: 20,
      pricePerQuintal: 2000,
      district: 'Hubballi',
      initialSenderId: 'user-buyer-hotel-naveen',
      senderName: 'Hotel Naveen',
    });

    // farmer counters with 2100
    const counterRes = store.counterOffer({
      offerId: offerId!,
      senderId: 'user-farmer-lakshmi',
      senderName: 'Lakshmi',
      newPricePerQuintal: 2100,
      newQuantityQuintals: 20,
      note: 'Asking ₹2,100 due to premium sorted quality.',
    });

    expect(counterRes.success).toBe(true);

    const updated = useMarketplaceStore.getState().offers.find((o) => o.id === offerId);
    expect(updated?.status).toBe('negotiating');
    expect(updated?.pricePerQuintal).toBe(2100);
    expect(updated?.currentTurnUserId).toBe('user-buyer-hotel-naveen'); // Turn flipped back to buyer
    expect(updated?.history.length).toBe(2);
  });
});
