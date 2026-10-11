import { translateUi } from '../../locales/translateUi';
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DealChartProps {
  data?: Array<{ month: string; deals: number; volumeQuintals: number; gmv: number }>;
}

const DEFAULT_DATA = [
  { month: 'Jun', deals: 12, volumeQuintals: 340, gmv: 680000 },
  { month: 'Jul', deals: 18, volumeQuintals: 520, gmv: 1040000 },
  { month: 'Aug', deals: 24, volumeQuintals: 710, gmv: 1420000 },
  { month: 'Sep', deals: 31, volumeQuintals: 950, gmv: 1950000 },
  { month: 'Oct', deals: 42, volumeQuintals: 1280, gmv: 2650000 },
  { month: 'Nov', deals: 55, volumeQuintals: 1650, gmv: 3450000 },
];

export const DealsChart: React.FC<DealChartProps> = ({ data = DEFAULT_DATA }) => {
  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {translateUi("Monthly Deals & Trade Volume")}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {translateUi("Direct farmer-to-buyer transactions completed across Hubballi-Dharwad cluster")}
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
          {translateUi("+38% MoM")}
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} opacity={0.6} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#71717a' }} />
            <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#71717a' }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#71717a' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                borderRadius: '0.75rem',
                border: 'none',
                color: '#fafafa',
                fontSize: '12px',
              }}
              formatter={(value: any, name: any) => {
                if (name === 'gmv') return [`₹${Number(value).toLocaleString('en-IN')}`, 'Gross Value'];
                if (name === 'volumeQuintals') return [`${value} qtl`, 'Volume'];
                return [value, 'Deals'];
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar yAxisId="left" dataKey="volumeQuintals" name="Volume (qtl)" fill="#1E5E3A" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="right" dataKey="deals" name="Completed Deals" fill="#E8A317" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DealsChart;
