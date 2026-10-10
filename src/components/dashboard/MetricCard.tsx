import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  accentColor?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon,
  accentColor = 'emerald',
}) => {
  return (
    <div className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {title}
        </p>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
          {value}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          {change && (
            <span
              className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                isPositive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {change}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricCard;
