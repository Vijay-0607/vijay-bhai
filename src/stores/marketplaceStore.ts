import { create } from 'zustand';
import {
  HarvestListing,
  BuyerDemand,
  DealOffer,
  PriceAlert,
  WaitlistEntry,
  CropType,
  OfferStatus,
} from '../types';
import { SEED_LISTINGS, SEED_DEMANDS, SEED_OFFERS } from '../data/seedData';
import { calculateDealValue, calculateCommission } from '../utils/commission';
import { useNotificationStore } from './notificationStore';
import { normalizeCropIdentifier } from '../data/cropCatalog';
import { apiRequest, isBackendAccount } from '../lib/api';
import { useAuthStore } from './authStore';

interface MarketplaceState {
  listings: HarvestListing[];
  demands: BuyerDemand[];
  offers: DealOffer[];
  priceAlerts: PriceAlert[];
  waitlist: WaitlistEntry[];
  refreshBackend: () => Promise<void>;
  publishBackendListing: (data: Record<string, unknown>) => Promise<void>;
  publishBackendDemand: (data: Record<string, unknown>) => Promise<void>;
  cancelBackendListing: (id: string) => Promise<void>;
  cancelBackendDemand: (id: string) => Promise<void>;
  createBackendOffer: (data: { listingId: string; demandId: string; quantity: number; price: number; note?: string }) => Promise<void>;
  respondBackendOffer: (offerId: string, action: 'accept' | 'reject' | 'counter', values?: { price: number; quantity: number }) => Promise<void>;
  completeBackendDeal: (offerId: string) => Promise<void>;
  reviewBackendDeal: (dealId: string, rating: number, comment: string) => Promise<void>;

  // Listings Actions
  addListing: (listing: Omit<HarvestListing, 'id' | 'createdAt' | 'availableQuantityQuintals'>) => HarvestListing;
  updateListing: (id: string, updates: Partial<HarvestListing>) => void;
  deleteListing: (id: string) => void;

  // Demands Actions
  addDemand: (demand: Omit<BuyerDemand, 'id' | 'createdAt'>) => BuyerDemand;
  updateDemand: (id: string, updates: Partial<BuyerDemand>) => void;
  deleteDemand: (id: string) => void;

  // Offers & Deals Actions
  sendOffer: (params: {
    listingId: string;
    demandId?: string;
    farmerId: string;
    farmerName: string;
    buyerId: string;
    buyerName: string;
    crop: CropType;
    quantityQuintals: number;
    pricePerQuintal: number;
    district: string;
    initialSenderId: string;
    senderName: string;
    note?: string;
  }) => { success: boolean; message?: string; offerId?: string };

  respondToOffer: (
    offerId: string,
    action: 'accept' | 'reject',
    currentUserId: string,
    note?: string
  ) => { success: boolean; message?: string };

  counterOffer: (params: {
    offerId: string;
    senderId: string;
    senderName: string;
    newPricePerQuintal: number;
    newQuantityQuintals: number;
    note?: string;
  }) => { success: boolean; message?: string };

  completeDeal: (offerId: string, userId: string) => { success: boolean; message?: string };

  // Price Alerts
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'active'>) => PriceAlert;
  deletePriceAlert: (id: string) => void;

  // Waitlist
  submitWaitlist: (entry: Omit<WaitlistEntry, 'id' | 'timestamp'>) => { success: boolean; message?: string };

  // FPO bulk aggregation
  aggregateFpoListing: (params: {
    fpoId: string;
    fpoName: string;
    crop: CropType;
    district: string;
    askingPricePerQuintal: number;
    expectedHarvestDate: string;
    farmerContributions: { farmerName: string; quantity: number }[];
  }) => HarvestListing;
}

const STORAGE_KEY_LISTINGS = 'mandimatch_listings';
const STORAGE_KEY_DEMANDS = 'mandimatch_demands';
const STORAGE_KEY_OFFERS = 'mandimatch_offers';
const STORAGE_KEY_ALERTS = 'mandimatch_price_alerts';
const STORAGE_KEY_WAITLIST = 'mandimatch_waitlist';

function loadOrSeed<T>(key: string, seed: T, normalize?: (value: T) => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const loaded = parsed as T;
        const normalized = normalize ? normalize(loaded) : loaded;
        try { localStorage.setItem(key, JSON.stringify(normalized)); } catch {}
        return normalized;
      }
    }
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
  }
  try {
    localStorage.setItem(key, JSON.stringify(seed));
  } catch {}
  return seed;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  listings: loadOrSeed<HarvestListing[]>(STORAGE_KEY_LISTINGS, SEED_LISTINGS, (items) => items.map((item) => ({ ...item, crop: normalizeCropIdentifier(item.crop) }))),
  demands: loadOrSeed<BuyerDemand[]>(STORAGE_KEY_DEMANDS, SEED_DEMANDS, (items) => items.map((item) => ({ ...item, crop: normalizeCropIdentifier(item.crop) }))),
  offers: loadOrSeed<DealOffer[]>(STORAGE_KEY_OFFERS, SEED_OFFERS, (items) => items.map((item) => ({ ...item, crop: normalizeCropIdentifier(item.crop) }))),
  priceAlerts: loadOrSeed<PriceAlert[]>(STORAGE_KEY_ALERTS, [], (items) => items.map((item) => ({ ...item, crop: normalizeCropIdentifier(item.crop) }))),
  waitlist: loadOrSeed<WaitlistEntry[]>(STORAGE_KEY_WAITLIST, []),

  refreshBackend: async () => {
    const user = useAuthStore.getState().currentUser;
    if (!user || !isBackendAccount(user.id)) return;
    const [listingResult, demandResult, offerResult] = await Promise.all([
      apiRequest<{ listings: any[] }>('/listings?pageSize=100'),
      apiRequest<{ demands: any[] }>('/demands?pageSize=100'),
      apiRequest<{ offers: any[] }>('/offers?pageSize=100'),
    ]);
    const listings: HarvestListing[] = listingResult.listings.map((item) => ({
      id: item.id, farmerId: item.farmerId, farmerName: item.farmer?.name ?? 'Farmer', farmerRole: item.farmer?.role === 'FPO' ? 'fpo' : 'farmer',
      crop: normalizeCropIdentifier(item.crop), quantityQuintals: Number(item.quantityQtl), availableQuantityQuintals: Number(item.remainingQuantityQtl),
      expectedHarvestDate: String(item.harvestDate).slice(0, 10), askingPricePerQuintal: Number(item.askingPricePerQtl), district: item.district,
      createdAt: item.createdAt, notes: item.description ?? undefined, grade: item.cropGrade ?? undefined, photoUrls: item.photoUrls ?? [], phoneVerified: Boolean(item.farmer?.phoneVerifiedAt), fpoVerified: Boolean(item.fpo?.isVerified), farmerRating: Number(item.farmer?.rating ?? 5),
    }));
    const demands: BuyerDemand[] = demandResult.demands.map((item) => ({
      id: item.id, buyerId: item.buyerId, buyerName: item.buyer?.name ?? 'Buyer', crop: normalizeCropIdentifier(item.crop),
      requiredQuantityQuintals: Number(item.remainingQuantityQtl), deliveryDate: String(item.deliveryDate).slice(0, 10), maxPricePerQuintal: Number(item.maxPricePerQtl),
      district: item.district, createdAt: item.createdAt, notes: item.description ?? undefined,
    }));
    const offers: DealOffer[] = offerResult.offers.map((item) => ({
      id: item.id, listingId: item.listingId, demandId: item.demandId ?? undefined, farmerId: item.farmerId, farmerName: item.farmer?.name ?? 'Farmer',
      buyerId: item.buyerId, buyerName: item.buyer?.name ?? 'Buyer', crop: normalizeCropIdentifier(item.listing?.crop ?? item.demand?.crop),
      quantityQuintals: Number(item.quantityQtl), pricePerQuintal: Number(item.pricePerQtl), totalDealValue: Number(item.totalValue), estimatedCommission: Number(item.commission),
      status: item.deal?.status === 'COMPLETED' ? 'completed' : item.status === 'ACCEPTED' ? 'confirmed' : String(item.status).toLowerCase() as DealOffer['status'], currentTurnUserId: item.currentTurnId,
      district: item.listing?.district ?? '', createdAt: item.createdAt, updatedAt: item.updatedAt,
      history: (item.history ?? []).map((entry: any) => ({ id: entry.id, senderId: entry.senderId, senderName: entry.senderId === item.farmerId ? item.farmer?.name : item.buyer?.name,
        pricePerQuintal: Number(entry.pricePerQtl), quantityQuintals: Number(entry.quantityQtl), note: entry.note ?? undefined, timestamp: entry.createdAt })),
      farmerPhone: item.contacts?.farmerPhone, buyerPhone: item.contacts?.buyerPhone,
      dealId: item.deal?.id,
    }));
    set({ listings, demands, offers });
  },
  publishBackendListing: async (data) => { await apiRequest('/listings', { method: 'POST', body: JSON.stringify(data) }); await get().refreshBackend(); },
  publishBackendDemand: async (data) => { await apiRequest('/demands', { method: 'POST', body: JSON.stringify(data) }); await get().refreshBackend(); },
  cancelBackendListing: async (id) => { await apiRequest(`/listings/${id}`, { method: 'DELETE' }); await get().refreshBackend(); },
  cancelBackendDemand: async (id) => { await apiRequest(`/demands/${id}`, { method: 'DELETE' }); await get().refreshBackend(); },
  createBackendOffer: async ({ listingId, demandId, quantity, price, note }) => {
    await apiRequest('/offers', { method: 'POST', body: JSON.stringify({ listingId, demandId, quantityQtl: quantity, pricePerQtl: price, message: note }) });
    await get().refreshBackend();
  },
  respondBackendOffer: async (offerId, action, values) => {
    const endpoint = action === 'counter' ? 'counter' : action;
    const body = action === 'counter' ? { quantityQtl: values?.quantity, pricePerQtl: values?.price } : undefined;
    await apiRequest(`/offers/${offerId}/${endpoint}`, { method: 'POST', ...(body ? { body: JSON.stringify(body) } : {}) });
    await get().refreshBackend();
  },
  completeBackendDeal: async (offerId) => {
    const result = await apiRequest<{ offer: any }>(`/offers/${offerId}`);
    const deal = result.offer?.deal;
    if (!deal) throw new Error('The confirmed deal could not be found.');
    await apiRequest(`/deals/${deal.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'COMPLETED' }) });
    await get().refreshBackend();
  },
  reviewBackendDeal: async (dealId, rating, comment) => {
    await apiRequest(`/deals/${dealId}/reviews`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
  },

  addListing: (listingData) => {
    const newListing: HarvestListing = {
      ...listingData,
      id: `listing-${Date.now()}`,
      availableQuantityQuintals: listingData.quantityQuintals,
      createdAt: new Date().toISOString(),
    };
    const updated = [newListing, ...get().listings];
    try {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(updated));
    } catch {}
    set({ listings: updated });

    // Send demo notification to matching buyers
    const matchingDemands = get().demands.filter((d) => d.crop === newListing.crop);
    matchingDemands.forEach((demand) => {
      useNotificationStore.getState().addNotification({
        userId: demand.buyerId,
        title: `New Harvest Matched: ${newListing.crop}`,
        message: `${newListing.farmerName} listed ${newListing.quantityQuintals}q of ${newListing.crop} in ${newListing.district}.`,
        type: 'new_match',
        link: '/app/matches',
      });
    });

    return newListing;
  },

  updateListing: (id, updates) => {
    const updated = get().listings.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    try {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(updated));
    } catch {}
    set({ listings: updated });
  },

  deleteListing: (id) => {
    const updated = get().listings.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(updated));
    } catch {}
    set({ listings: updated });
  },

  addDemand: (demandData) => {
    const newDemand: BuyerDemand = {
      ...demandData,
      id: `demand-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newDemand, ...get().demands];
    try {
      localStorage.setItem(STORAGE_KEY_DEMANDS, JSON.stringify(updated));
    } catch {}
    set({ demands: updated });

    // Send demo notification to matching farmers
    const matchingListings = get().listings.filter((l) => l.crop === newDemand.crop);
    matchingListings.forEach((listing) => {
      useNotificationStore.getState().addNotification({
        userId: listing.farmerId,
        title: `New Buyer Demand for ${newDemand.crop}`,
        message: `${newDemand.buyerName} requires ${newDemand.requiredQuantityQuintals}q of ${newDemand.crop} in ${newDemand.district}.`,
        type: 'new_match',
        link: '/app/matches',
      });
    });

    return newDemand;
  },

  updateDemand: (id, updates) => {
    const updated = get().demands.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    );
    try {
      localStorage.setItem(STORAGE_KEY_DEMANDS, JSON.stringify(updated));
    } catch {}
    set({ demands: updated });
  },

  deleteDemand: (id) => {
    const updated = get().demands.filter((item) => item.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_DEMANDS, JSON.stringify(updated));
    } catch {}
    set({ demands: updated });
  },

  sendOffer: (params) => {
    if (params.quantityQuintals <= 0 || params.pricePerQuintal <= 0) {
      return { success: false, message: 'Price and quantity must be positive numbers.' };
    }

    const listing = get().listings.find((item) => item.id === params.listingId);
    const demand = params.demandId ? get().demands.find((item) => item.id === params.demandId) : undefined;
    if (!listing) return { success: false, message: 'The harvest listing is no longer available.' };
    if (params.demandId && !demand) return { success: false, message: 'The buyer requirement is no longer available.' };
    const crop = normalizeCropIdentifier(params.crop);
    if (normalizeCropIdentifier(listing.crop) !== crop || (demand && normalizeCropIdentifier(demand.crop) !== crop)) {
      return { success: false, message: 'The crop in this offer does not match the listing and requirement.' };
    }
    if (params.quantityQuintals > listing.availableQuantityQuintals || (demand && params.quantityQuintals > demand.requiredQuantityQuintals)) {
      return { success: false, message: 'Offer quantity exceeds the available listing or buyer requirement.' };
    }

    const recipientId =
      params.initialSenderId === params.buyerId ? params.farmerId : params.buyerId;

    const dealValue = calculateDealValue(params.pricePerQuintal, params.quantityQuintals);
    const commission = calculateCommission(dealValue, 2.5);

    const newOffer: DealOffer = {
      id: `offer-${Date.now()}`,
      listingId: params.listingId,
      demandId: params.demandId,
      farmerId: params.farmerId,
      farmerName: params.farmerName,
      buyerId: params.buyerId,
      buyerName: params.buyerName,
      crop,
      quantityQuintals: params.quantityQuintals,
      pricePerQuintal: params.pricePerQuintal,
      totalDealValue: dealValue,
      estimatedCommission: commission,
      status: 'pending',
      currentTurnUserId: recipientId,
      district: params.district,
      history: [
        {
          id: `hist-${Date.now()}`,
          senderId: params.initialSenderId,
          senderName: params.senderName,
          pricePerQuintal: params.pricePerQuintal,
          quantityQuintals: params.quantityQuintals,
          note: params.note || 'Initial offer proposed.',
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newOffer, ...get().offers];
    try {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
    } catch {}
    set({ offers: updated });

    // Notify recipient
    useNotificationStore.getState().addNotification({
      userId: recipientId,
      title: `New Offer for ${crop}`,
      message: `${params.senderName} offered ₹${params.pricePerQuintal}/q for ${params.quantityQuintals} quintals.`,
      type: 'new_offer',
      link: '/app/dashboard',
    });

    return { success: true, offerId: newOffer.id };
  },

  respondToOffer: (offerId, action, currentUserId, note) => {
    const offer = get().offers.find((o) => o.id === offerId);
    if (!offer) {
      return { success: false, message: 'Offer not found.' };
    }

    // Rules: Only intended recipient can accept or reject
    if (offer.currentTurnUserId !== currentUserId) {
      return {
        success: false,
        message: 'Only the party awaiting a response can accept or reject this offer.',
      };
    }

    // Prevent duplicate confirmation
    if (offer.status === 'confirmed' || offer.status === 'completed') {
      return { success: false, message: 'This deal has already been confirmed.' };
    }

    const listing = get().listings.find((item) => item.id === offer.listingId);
    const demand = offer.demandId ? get().demands.find((item) => item.id === offer.demandId) : undefined;
    if (action === 'accept' && (!listing || listing.availableQuantityQuintals < offer.quantityQuintals || (demand && demand.requiredQuantityQuintals < offer.quantityQuintals))) {
      return { success: false, message: 'The requested quantity is no longer available. Please counter with a lower quantity.' };
    }

    const nextStatus: OfferStatus = action === 'accept' ? 'confirmed' : 'rejected';
    const otherUserId = currentUserId === offer.farmerId ? offer.buyerId : offer.farmerId;
    const actorName = currentUserId === offer.farmerId ? offer.farmerName : offer.buyerName;

    const updatedOffer: DealOffer = {
      ...offer,
      status: nextStatus,
      currentTurnUserId: 'none',
      updatedAt: new Date().toISOString(),
      history: [
        ...offer.history,
        {
          id: `hist-${Date.now()}`,
          senderId: currentUserId,
          senderName: actorName,
          pricePerQuintal: offer.pricePerQuintal,
          quantityQuintals: offer.quantityQuintals,
          note: note || (action === 'accept' ? 'Offer accepted.' : 'Offer declined.'),
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const updated = get().offers.map((o) => (o.id === offerId ? updatedOffer : o));
    if (action === 'accept' && listing) {
      const updatedListings = get().listings.map((item) => item.id === listing.id
        ? { ...item, availableQuantityQuintals: item.availableQuantityQuintals - offer.quantityQuintals }
        : item);
      try { localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(updatedListings)); } catch {}
      set({ listings: updatedListings });
      if (demand) {
        const updatedDemands = get().demands.map((item) => item.id === demand.id
          ? { ...item, requiredQuantityQuintals: item.requiredQuantityQuintals - offer.quantityQuintals }
          : item);
        try { localStorage.setItem(STORAGE_KEY_DEMANDS, JSON.stringify(updatedDemands)); } catch {}
        set({ demands: updatedDemands });
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
    } catch {}
    set({ offers: updated });

    // Notify the other party
    useNotificationStore.getState().addNotification({
      userId: otherUserId,
      title: action === 'accept' ? 'Offer Accepted! Deal Confirmed' : 'Offer Declined',
      message: `${actorName} has ${action === 'accept' ? 'accepted' : 'declined'} the offer of ₹${offer.pricePerQuintal}/q for ${offer.quantityQuintals}q of ${offer.crop}.`,
      type: action === 'accept' ? 'deal_confirmed' : 'offer_rejected',
      link: '/app/dashboard',
    });

    return { success: true };
  },

  counterOffer: (params) => {
    const offer = get().offers.find((o) => o.id === params.offerId);
    if (!offer) {
      return { success: false, message: 'Offer not found.' };
    }

    if (offer.status === 'confirmed' || offer.status === 'completed' || offer.status === 'rejected') {
      return { success: false, message: `Cannot counteroffer on a ${offer.status} deal.` };
    }

    if (offer.currentTurnUserId !== params.senderId) {
      return { success: false, message: 'It is not your turn to respond to this offer.' };
    }

    if (params.newPricePerQuintal <= 0 || params.newQuantityQuintals <= 0) {
      return { success: false, message: 'Price and quantity must be positive numbers.' };
    }

    const listing = get().listings.find((item) => item.id === offer.listingId);
    const demand = offer.demandId ? get().demands.find((item) => item.id === offer.demandId) : undefined;
    if (!listing || params.newQuantityQuintals > listing.availableQuantityQuintals || (demand && params.newQuantityQuintals > demand.requiredQuantityQuintals)) {
      return { success: false, message: 'Counter quantity exceeds the available listing or buyer requirement.' };
    }

    // Recipient of the counteroffer is the other party
    const nextRecipientId =
      params.senderId === offer.farmerId ? offer.buyerId : offer.farmerId;

    const newDealValue = calculateDealValue(params.newPricePerQuintal, params.newQuantityQuintals);
    const newCommission = calculateCommission(newDealValue, 2.5);

    const updatedOffer: DealOffer = {
      ...offer,
      pricePerQuintal: params.newPricePerQuintal,
      quantityQuintals: params.newQuantityQuintals,
      totalDealValue: newDealValue,
      estimatedCommission: newCommission,
      status: 'negotiating',
      currentTurnUserId: nextRecipientId,
      updatedAt: new Date().toISOString(),
      history: [
        ...offer.history,
        {
          id: `hist-${Date.now()}`,
          senderId: params.senderId,
          senderName: params.senderName,
          pricePerQuintal: params.newPricePerQuintal,
          quantityQuintals: params.newQuantityQuintals,
          note: params.note || 'Counteroffer proposed.',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const updated = get().offers.map((o) => (o.id === params.offerId ? updatedOffer : o));
    try {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
    } catch {}
    set({ offers: updated });

    // Notify the other party
    useNotificationStore.getState().addNotification({
      userId: nextRecipientId,
      title: `Counteroffer Received for ${offer.crop}`,
      message: `${params.senderName} proposed ₹${params.newPricePerQuintal}/q for ${params.newQuantityQuintals} quintals.`,
      type: 'counteroffer_received',
      link: '/app/dashboard',
    });

    return { success: true };
  },

  completeDeal: (offerId, userId) => {
    const offer = get().offers.find((o) => o.id === offerId);
    if (!offer) {
      return { success: false, message: 'Offer not found.' };
    }

    if (offer.status !== 'confirmed') {
      return { success: false, message: 'Only confirmed deals can be marked as completed.' };
    }
    if (userId !== offer.farmerId && userId !== offer.buyerId) {
      return { success: false, message: 'Only the farmer or buyer on this deal can complete it.' };
    }

    const updatedOffer: DealOffer = {
      ...offer,
      status: 'completed',
      updatedAt: new Date().toISOString(),
      history: [
        ...offer.history,
        {
          id: `hist-${Date.now()}`,
          senderId: userId,
          senderName: userId === offer.farmerId ? offer.farmerName : offer.buyerName,
          pricePerQuintal: offer.pricePerQuintal,
          quantityQuintals: offer.quantityQuintals,
          note: 'Deal marked as fulfilled & completed in demonstration.',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const updated = get().offers.map((o) => (o.id === offerId ? updatedOffer : o));
    try {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updated));
    } catch {}
    set({ offers: updated });

    const otherUserId = userId === offer.farmerId ? offer.buyerId : offer.farmerId;
    useNotificationStore.getState().addNotification({
      userId: otherUserId,
      title: 'Demo Deal Completed!',
      message: `The deal for ${offer.quantityQuintals}q of ${offer.crop} has been fulfilled and marked completed.`,
      type: 'deal_completed',
      link: '/app/dashboard',
    });

    return { success: true };
  },

  addPriceAlert: (alertData) => {
    const newAlert: PriceAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newAlert, ...get().priceAlerts];
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(updated));
    } catch {}
    set({ priceAlerts: updated });

    // Create confirmation notification
    useNotificationStore.getState().addNotification({
      userId: alertData.userId,
      title: `Price Watch Configured: ${alertData.crop}`,
      message: `Alert set when ${alertData.crop} goes ${alertData.condition} ₹${alertData.targetPrice}/q in ${alertData.district}.`,
      type: 'price_alert',
      link: '/app/prices',
    });

    return newAlert;
  },

  deletePriceAlert: (id) => {
    const updated = get().priceAlerts.filter((a) => a.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(updated));
    } catch {}
    set({ priceAlerts: updated });
  },

  submitWaitlist: (entryData) => {
    const newEntry: WaitlistEntry = {
      ...entryData,
      id: `waitlist-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...get().waitlist];
    try {
      localStorage.setItem(STORAGE_KEY_WAITLIST, JSON.stringify(updated));
    } catch {}
    set({ waitlist: updated });

    return {
      success: true,
      message: `Thank you ${entryData.name}! You have been added to the MandiMatch priority pilot list for ${entryData.district}.`,
    };
  },

  aggregateFpoListing: (params) => {
    const totalPooledQuantity = params.farmerContributions.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    const notes = `Aggregated FPO Bulk Lot: Pooled from ${
      params.farmerContributions.length
    } member farmers (${params.farmerContributions
      .map((c) => `${c.farmerName}: ${c.quantity}q`)
      .join(', ')}).`;

    const newListing: HarvestListing = {
      id: `listing-fpo-${Date.now()}`,
      farmerId: params.fpoId,
      farmerName: params.fpoName,
      farmerRole: 'fpo',
      crop: params.crop,
      quantityQuintals: totalPooledQuantity,
      availableQuantityQuintals: totalPooledQuantity,
      expectedHarvestDate: params.expectedHarvestDate,
      askingPricePerQuintal: params.askingPricePerQuintal,
      district: params.district,
      notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newListing, ...get().listings];
    try {
      localStorage.setItem(STORAGE_KEY_LISTINGS, JSON.stringify(updated));
    } catch {}
    set({ listings: updated });

    return newListing;
  },
}));
