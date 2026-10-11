import { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

interface CalendarDateFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
}

export function CalendarDateField({ label, value, onChange, min }: CalendarDateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openCalendar = () => {
    const input = inputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') input.showPicker();
    else input.focus();
  };

  return <label className="text-sm font-semibold">{label}<span className="mt-1 flex w-full items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-950"><input ref={inputRef} type="date" required value={value} min={min} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 font-normal outline-none" /><button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); openCalendar(); }} aria-label={`Open ${label.toLowerCase()} calendar`} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-zinc-800"><CalendarDays className="h-5 w-5" /></button></span></label>;
}
