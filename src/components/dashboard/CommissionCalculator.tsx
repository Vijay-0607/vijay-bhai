import { translateUi } from '../../locales/translateUi';
import React, { useState } from 'react';
import { calculateDealValue, calculateCommission } from '../../utils/commission';
import { Calculator, CheckCircle2, TrendingUp, IndianRupee } from 'lucide-react';

export const CommissionCalculator: React.FC = () => {
  const [quantity, setQuantity] = useState<number>(50);
  const [price, setPrice] = useState<number>(2100);

  const totalValue = calculateDealValue(price, quantity);
  const mandimatchCommission = calculateCommission(totalValue, 2.5);
  const traditionalMiddlemanFee = calculateCommission(totalValue, 7.0);
  const farmerSavings = Math.max(0, traditionalMiddlemanFee - mandimatchCommission);

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-white to-emerald-50/40 dark:from-zinc-900 dark:to-emerald-950/20 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-xl bg-[#1E5E3A] text-white">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {translateUi("Transparent Commission & Savings Calculator")}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {translateUi("Compare MandiMatch fair 2.5% rate vs traditional APMC middleman cuts (6-8%)")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            {translateUi("Produce Quantity (Quintals):")} <span className="text-[#1E5E3A] font-bold">{quantity} qtl</span>
          </label>
          <input
            type="range"
            min="5"
            max="500"
            step="5"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full accent-[#1E5E3A] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
            <span>{translateUi("5 qtl")}</span>
            <span>{translateUi("250 qtl")}</span>
            <span>{translateUi("500 qtl")}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            {translateUi("Price per Quintal:")} <span className="text-[#1E5E3A] font-bold">₹{price}</span>
          </label>
          <input
            type="range"
            min="1000"
            max="8000"
            step="50"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full accent-[#1E5E3A] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5">
            <span>₹1,000</span>
            <span>₹4,500</span>
            <span>₹8,000</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{translateUi("Total Trade Value")}</p>
          <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            ₹{totalValue.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
          <p className="text-[11px] text-rose-600 dark:text-rose-400">{translateUi("Middleman Cut (7%)")}</p>
          <p className="text-base font-bold text-rose-700 dark:text-rose-300">
            ₹{traditionalMiddlemanFee.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">{translateUi("MandiMatch Fee (2.5%)")}</p>
          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
            ₹{mandimatchCommission.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/20 border border-amber-500/30">
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-amber-600" />
            <span>{translateUi("Direct Savings")}</span>
          </p>
          <p className="text-base font-extrabold text-amber-700 dark:text-amber-300">
            +₹{farmerSavings.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommissionCalculator;
