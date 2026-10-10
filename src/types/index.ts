export type UserRole = 'farmer' | 'buyer' | 'fpo';

export type Language = 'en' | 'hi' | 'kn';

export type CropType = 'Tomato' | 'Maize' | 'Onion' | 'Green chilli';

export interface UserProfile {
  id: string;
  name: string;
  emailOrPhone: string;
  role: UserRole;
  district: string;
  language: Language;
  bio?: string;
  phone?: string;
  rating?: number;
  completedDealsCount?: number;
  isDemoVerified?: boolean;
  fpoMemberCount?: number;
}

export interface HarvestListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerRole: 'farmer' | 'fpo';
  crop: CropType;
  quantityQuintals: number;
  availableQuantityQuintals: number;
  expectedHarvestDate: string; // ISO date string YYYY-MM-DD
  askingPricePerQuintal: number;
  district: string;
  createdAt: string;
  notes?: string;
}

export interface BuyerDemand {
  id: string;
  buyerId: string;
  buyerName: string;
  crop: CropType;
  requiredQuantityQuintals: number;
  deliveryDate: string; // ISO date string YYYY-MM-DD
  maxPricePerQuintal: number;
  district: string;
  createdAt: string;
  notes?: string;
}

export type OfferStatus = 'pending' | 'negotiating' | 'confirmed' | 'completed' | 'rejected';

export interface OfferHistoryItem {
  id: string;
  senderId: string;
  senderName: string;
  pricePerQuintal: number;
  quantityQuintals: number;
  note?: string;
  timestamp: string;
}

export interface DealOffer {
  id: string;
  listingId: string;
  demandId?: string;
  farmerId: string;
  farmerName: string;
  buyerId: string;
  buyerName: string;
  crop: CropType;
  quantityQuintals: number;
  pricePerQuintal: number;
  totalDealValue: number;
  estimatedCommission: number; // 2.5%
  status: OfferStatus;
  currentTurnUserId: string; // who needs to respond
  history: OfferHistoryItem[];
  district: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartMatch {
  id: string;
  listing: HarvestListing;
  demand: BuyerDemand;
  score: number;
  qtyFit: number;
  priceFit: number;
  dateFit: number;
  distFit: number;
  tradeQuantity: number;
  suggestedPrice: number;
  dealValue: number;
  estimatedCommission: number;
  mandiBenchmarkPrice: number;
  priceComparison: 'fair' | 'low' | 'high';
}

export type NotificationType =
  | 'new_match'
  | 'new_offer'
  | 'counteroffer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'deal_confirmed'
  | 'deal_completed'
  | 'price_alert';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  crop: CropType;
  targetPrice: number;
  condition: 'above' | 'below';
  district: string;
  active: boolean;
  createdAt: string;
}

export interface MonthlyPricePoint {
  month: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  volumeQuintals: number;
}

export interface WaitlistEntry {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  district: string;
  timestamp: string;
}
