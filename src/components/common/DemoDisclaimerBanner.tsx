import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { useLanguageStore } from '../../stores/languageStore';

export const DemoDisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { t } = useLanguageStore();

  if (compact) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-[#E8A317] shrink-0" />
        <span>
          <strong className="font-semibold">{t('app.demoBadge')}:</strong> {t('app.demoDisclaimer')}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-amber-500/15 border-b border-amber-500/25 text-[#17261C] dark:text-gray-200 py-2 px-4 text-xs font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#E8A317] shrink-0" />
          <span>
            <strong className="text-[#1E5E3A] dark:text-emerald-400 font-bold uppercase tracking-wide">
              {t('app.demoBadge')}:
            </strong>{' '}
            {t('app.demoDisclaimer')}
          </span>
        </div>
        <span className="hidden sm:inline-block text-[11px] text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/30 px-2 py-0.5 rounded border border-gray-200/50 dark:border-gray-800">
          Simulated APMC Benchmarks
        </span>
      </div>
    </div>
  );
};
