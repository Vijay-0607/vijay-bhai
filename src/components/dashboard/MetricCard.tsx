import { translateUi } from '../../locales/translateUi';
import React from 'react';
import { Link } from 'react-router-dom';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  accentColor?: string;
  to?: string;
  actionLabel?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon,
  accentColor = 'emerald',
  to,
  actionLabel,
}) => {
  const card = (
    <div className={`relative h-full overflow-hidden p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm transition-shadow ${to ? 'hover:shadow-md hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600' : 'hover:shadow-md'}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
          {translateUi(title)}
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
              {translateUi(subtitle)}
            </span>
          )}
        </div>
        {actionLabel && <span className="mt-2 inline-flex text-xs font-semibold text-emerald-700 dark:text-emerald-400">{translateUi(actionLabel)} →</span>}
      </div>
    </div>
  );

  return to ? <Link to={to} aria-label={`${translateUi(title)}: ${value}. ${translateUi(actionLabel ?? 'Open details')}`} className="block rounded-2xl">{card}</Link> : card;
};

export default MetricCard;
