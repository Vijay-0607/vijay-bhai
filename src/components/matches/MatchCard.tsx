import { translateUi } from '../../locales/translateUi';
import React from 'react';
import { SmartMatch } from '../../types';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  MapPin,
  Calendar,
  IndianRupee,
  Weight,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface MatchCardProps {
  match: SmartMatch;
  onSendOffer: (match: SmartMatch) => void;
  cropLabel?: string;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, onSendOffer, cropLabel }) => {
  const getScoreBadge = (score: number) => {
    if (score >= 90) return { variant: 'success' as const, label: `${score}% ${translateUi('Excellent Fit')}` };
    if (score >= 80) return { variant: 'primary' as const, label: `${score}% ${translateUi('Great Fit')}` };
    if (score >= 70) return { variant: 'warning' as const, label: `${score}% ${translateUi('Good Fit')}` };
    return { variant: 'neutral' as const, label: `${score}% ${translateUi('Moderate Fit')}` };
  };

  const badgeInfo = getScoreBadge(match.score);
  const cropCost = match.tradeQuantity * match.suggestedPrice;
  const transportEstimate = match.tradeQuantity * 80;
  const feeEstimate = Math.round(cropCost * 0.025);
  const estimatedTotal = cropCost + transportEstimate + feeEstimate;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Header: Crop & Match Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {cropLabel || match.listing.crop}
              </h4>
              <Badge variant={badgeInfo.variant} size="sm" icon={<Sparkles className="w-3 h-3" />}>
                {badgeInfo.label}
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {translateUi('Matched between')} {match.listing.farmerName} {translateUi('and')} {match.demand.buyerName}
            </p>
          </div>
        </div>

        {/* Pairing Summary Table */}
        {match.listing.photoUrls?.[0] && <img src={match.listing.photoUrls[0]} alt={`${cropLabel || match.listing.crop} harvest`} className="mb-3 h-40 w-full rounded-xl object-cover" />}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 mb-4 text-xs">
          <div>
            <p className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-400 uppercase">
              {translateUi('Farmer Listing')} ({match.listing.district})
            </p>
            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {match.listing.availableQuantityQuintals} qtl @ ₹{match.listing.askingPricePerQuintal}/q
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> {translateUi('Harvest:')} {match.listing.expectedHarvestDate}
            </p>
            <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">{translateUi(match.listing.grade ?? 'Grade not specified')} · ★ {(match.listing.farmerRating ?? 5).toFixed(1)}{match.listing.phoneVerified ? ` · ✓ ${translateUi('Verified phone')}` : ''}{match.listing.fpoVerified ? ` · ✓ ${translateUi('Verified FPO')}` : ''}</p>
          </div>

          <div>
            <p className="text-[10px] font-semibold text-amber-800 dark:text-amber-400 uppercase">
              {translateUi('Buyer Demand')} ({match.demand.district})
            </p>
            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
              {match.demand.requiredQuantityQuintals} qtl @ max ₹{match.demand.maxPricePerQuintal}/q
            </p>
            <p className="text-zinc-500 dark:text-zinc-400 text-[11px] flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" /> {translateUi('Delivery:')} {match.demand.deliveryDate}
            </p>
          </div>
        </div>

        {/* Component Fit Progress Bars */}
        <div className="space-y-2 mb-4 text-[11px]">
          <div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400 mb-0.5">
              <span>{translateUi('Quantity Match')} ({Math.round(match.qtyFit * 100)}%)</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{match.tradeQuantity} qtl</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#1E5E3A] h-full rounded-full" style={{ width: `${match.qtyFit * 100}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400 mb-0.5">
              <span>{translateUi('Price Fit')} ({Math.round(match.priceFit * 100)}%)</span>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">₹{match.suggestedPrice}/q {translateUi('suggested')}</span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#E8A317] h-full rounded-full" style={{ width: `${match.priceFit * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Estimated buyer total */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs mb-4">
          <div>
            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-semibold">{translateUi('Estimated total cost for')} {match.tradeQuantity} q</p>
            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
              ₹{estimatedTotal.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">{translateUi('Produce')} ₹{cropCost.toLocaleString('en-IN')} + {translateUi('transport estimate')} ₹{transportEstimate.toLocaleString('en-IN')} (₹80/q) + {translateUi('2.5% fee')} ₹{feeEstimate.toLocaleString('en-IN')}. {translateUi('Final transport cost may vary by route.')}</p>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onSendOffer(match)}
        className="w-full py-2.5 px-4 rounded-xl bg-[#1E5E3A] hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
      >
        <span>{translateUi("Send Pre-Harvest Offer")}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default MatchCard;
