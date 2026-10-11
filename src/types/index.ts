export type UserRole = 'farmer' | 'buyer' | 'fpo' | 'admin';

export type Language = 'en' | 'hi' | 'kn';

// Crop values are stable catalogue slugs; keep the string type extensible so
// new catalogue records do not require rebuilding every component type.
export type CropType = string;

export interface UserProfile {
  id: string;
  name: string;
  emailOrPhone: string;
  role: UserRole;
  district: string;
  language: Language;
  bio?: string;
  phone?: string;
  upiId?: string;
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
  updatedAt?: string;
  notes?: string;
  grade?: string;
  photoUrls?: string[];
  phoneVerified?: boolean;
  fpoVerified?: boolean;
  farmerRating?: number;
  status?: string;
}

export interface BuyerDemand {
  id: string;
  buyerId: string;
  buyerName: string;
  crop: CropType;
  requiredQuantityQuintals: number;
  totalRequiredQuantityQuintals?: number;
  deliveryDate: string; // ISO date string YYYY-MM-DD
  maxPricePerQuintal: number;
  district: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  status?: string;
}

export type OfferStatus = 'pending' | 'negotiating' | 'confirmed' | 'completed' | 'rejected' | 'withdrawn';

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
  farmerPhone?: string;
  buyerPhone?: string;
  farmerUpiId?: string;
  buyerUpiId?: string;
  dealId?: string;
}

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash';
export interface DealPayment {
  id: string;
  offerId: string;
  buyerId: string;
  farmerId: string;
  buyerName: string;
  farmerName: string;
  method: PaymentMethod;
  buyerUpiId: string;
  farmerUpiId: string;
  platformUpiId: string;
  produceAmount: number;
  platformFee: number;
  totalPaid: number;
  status: 'recorded_demo';
  createdAt: string;
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
  mandiBenchmarkPrice?: number;
  priceComparison: 'fair' | 'low' | 'high' | 'unavailable';
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
