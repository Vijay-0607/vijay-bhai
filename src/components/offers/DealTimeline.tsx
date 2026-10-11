import { translateUi } from '../../locales/translateUi';
import React from 'react';
import { OfferHistoryItem, OfferStatus } from '../../types';
import { CheckCircle2, Clock, XCircle, ArrowRightLeft, ShieldCheck } from 'lucide-react';

interface DealTimelineProps {
  status: OfferStatus;
  history: OfferHistoryItem[];
}

export const DealTimeline: React.FC<DealTimelineProps> = ({ status, history }) => {
  const steps = [
    { key: 'created', label: 'Offer Proposed' },
    { key: 'negotiation', label: 'Negotiation' },
    { key: 'confirmed', label: 'Confirmed Agreement' },
    { key: 'completed', label: 'Harvest & Settlement' },
  ];

  const getStepStatus = (index: number) => {
    if (status === 'rejected') return index === 0 ? 'complete' : 'error';
    if (status === 'completed') return 'complete';
    if (status === 'confirmed') return index <= 2 ? 'complete' : 'pending';
    if (status === 'negotiating') return index <= 1 ? 'active' : 'pending';
    return index === 0 ? 'active' : 'pending';
  };

  return (
    <div className="py-2">
      {/* Visual Step Indicator */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, idx) => {
          const s = getStepStatus(idx);
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              {idx > 0 && (
                <div
                  className={`absolute top-3 right-1/2 w-full h-0.5 -translate-y-1/2 -z-0 ${
                    s === 'complete' || s === 'active' ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'
                  }`}
                />
              )}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                  s === 'complete'
                    ? 'bg-emerald-600 text-white'
                    : s === 'active'
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950'
                    : s === 'error'
                    ? 'bg-rose-500 text-white'
                    : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                }`}
              >
                {s === 'complete' ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 mt-1 text-center">
                {translateUi(step.label)}
              </span>
            </div>
          );
        })}
      </div>

      {/* History Negotiation Events Log */}
      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2.5">
          <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {translateUi("Negotiation Audit Log")}
          </p>
          <div className="space-y-2">
            {history.map((item, i) => (
              <div
                key={item.id || i}
                className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs flex items-start justify-between gap-2 border border-zinc-100 dark:border-zinc-800"
              >
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.senderName}
                  </p>
                  <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                    {translateUi("Offered")} <span className="font-bold text-[#1E5E3A] dark:text-emerald-400">₹{item.pricePerQuintal}/q</span> for{' '}
                    <span className="font-bold">{item.quantityQuintals} quintals</span>
                  </p>
                  {item.note && (
                    <p className="text-zinc-500 italic text-[11px] mt-1">"{item.note}"</p>
                  )}
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealTimeline;
