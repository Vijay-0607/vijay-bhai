import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps {
  data?: Array<{ month: string; commissionEarned: number; farmerSavings: number }>;
}

const DEFAULT_DATA = [
  { month: 'Jun', commissionEarned: 17000, farmerSavings: 30600 },
  { month: 'Jul', commissionEarned: 43000, farmerSavings: 77400 },
  { month: 'Aug', commissionEarned: 78500, farmerSavings: 141300 },
  { month: 'Sep', commissionEarned: 127250, farmerSavings: 229050 },
  { month: 'Oct', commissionEarned: 193500, farmerSavings: 348300 },
  { month: 'Nov', commissionEarned: 279750, farmerSavings: 503550 },
];

export const CumulativeCommissionChart: React.FC<ChartProps> = ({ data = DEFAULT_DATA }) => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            Platform Commission & Farmer Net Savings
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Cumulative savings delivered to farmers by bypassing APMC middleman arbitrage
          </p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E5E3A" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#1E5E3A" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorComm" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E8A317" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#E8A317" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717a' }} />
            <YAxis
              tick={{ fontSize: 12, fill: '#71717a' }}
              tickFormatter={(v) => `₹${v / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderRadius: '0.75rem',
                border: 'none',
                color: '#fafafa',
                fontSize: '12px',
              }}
              formatter={(val: any, name: any) => [
                `₹${Number(val).toLocaleString('en-IN')}`,
                name === 'farmerSavings' ? 'Farmer Direct Savings' : 'Platform Commission',
              ]}
            />
            <Area
              type="monotone"
              dataKey="farmerSavings"
              name="farmerSavings"
              stroke="#1E5E3A"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorSavings)"
            />
            <Area
              type="monotone"
              dataKey="commissionEarned"
              name="commissionEarned"
              stroke="#E8A317"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorComm)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CumulativeCommissionChart;
