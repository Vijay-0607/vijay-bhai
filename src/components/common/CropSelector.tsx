import { translateUi } from '../../locales/translateUi';
import { KeyboardEvent, useMemo, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { Language } from '../../types';
import type { CropRecord } from '../../hooks/useCropCatalogue';
import { getInitialCropName, normalizeCropIdentifier } from '../../data/cropCatalog';

interface CropSelectorProps {
  value: string;
  onChange: (slug: string) => void;
  crops: CropRecord[];
  categories: string[];
  language: Language;
  label: string;
  loading?: boolean;
  error?: string | null;
  required?: boolean;
}

export function getCropDisplayName(crop: Pick<CropRecord, 'canonicalName' | 'localNameEnglish' | 'localNameHindi' | 'localNameKannada'>, language: Language) {
  if (language === 'hi' && crop.localNameHindi) return crop.localNameHindi;
  if (language === 'kn' && crop.localNameKannada) return crop.localNameKannada;
  return crop.localNameEnglish || crop.canonicalName;
}

export function getCropName(value: string, crops: CropRecord[], language: Language) {
  const crop = crops.find((item) => item.slug === normalizeCropIdentifier(value));
  return crop ? getCropDisplayName(crop, language) : getInitialCropName(value, language);
}

export function CropSelector({ value, onChange, crops, categories, language, label, loading = false, error = null, required = true }: CropSelectorProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const selected = crops.find((crop) => crop.slug === value);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return crops.filter((crop) => crop.isActive && (category === 'all' || crop.category === category) && (!term || [crop.canonicalName, crop.localNameEnglish, crop.localNameHindi ?? '', crop.localNameKannada ?? '', crop.slug, ...crop.aliases].some((name) => name.toLocaleLowerCase().includes(term))));
  }, [category, crops, query]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, filtered.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(0, index - 1)); }
    if (event.key === 'Enter' && open && filtered[activeIndex]) { event.preventDefault(); choose(filtered[activeIndex].slug); }
    if (event.key === 'Escape') setOpen(false);
  };

  const choose = (slug: string) => {
    onChange(slug);
    setQuery('');
    setOpen(false);
  };

  return <div className="relative space-y-2">
    <label className="block text-sm font-semibold" htmlFor={`crop-search-${label.replace(/\W+/g, '-')}`}>{label}</label>
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input id={`crop-search-${label.replace(/\W+/g, '-')}`} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`crop-options-${label.replace(/\W+/g, '-')}`} aria-activedescendant={open && filtered[activeIndex] ? `crop-option-${filtered[activeIndex].slug}` : undefined} aria-required={required} value={query} onFocus={() => setOpen(true)} onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); setOpen(true); }} onKeyDown={handleKeyDown} placeholder={selected ? getCropDisplayName(selected, language) : translateUi('Search crops by name or alias')} disabled={loading || Boolean(error)} className="block w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-3 font-normal dark:border-zinc-700 dark:bg-zinc-950" />
    </div>
    <label className="sr-only" htmlFor={`crop-category-${label.replace(/\W+/g, '-')}`}>{translateUi("Filter crop category")}</label>
    <div className="relative">
      <select id={`crop-category-${label.replace(/\W+/g, '-')}`} value={category} onChange={(event) => { setCategory(event.target.value); setActiveIndex(0); setOpen(true); }} disabled={loading || Boolean(error)} className="w-full appearance-none rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-9 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-950">
        <option value="all">{translateUi("All categories")}</option>
        {categories.map((item) => <option key={item} value={item}>{translateUi(item)}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
    </div>
    {loading && <p role="status" className="text-xs text-zinc-500">{translateUi("Loading crop catalogue…")}</p>}
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    {selected && !query && <p className="text-xs text-zinc-500">{translateUi('Selected:')} {getCropDisplayName(selected, language)}</p>}
    {open && !loading && !error && <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
      {filtered.length === 0 ? <p className="px-3 py-3 text-sm text-zinc-500">{translateUi("No crops found. Try another name or category.")}</p> : <ul id={`crop-options-${label.replace(/\W+/g, '-')}`} role="listbox" aria-label={`${label} options`}>
        {filtered.map((crop, index) => <li id={`crop-option-${crop.slug}`} key={crop.slug} role="option" aria-selected={crop.slug === value}>
          <button type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(crop.slug)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${index === activeIndex ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <span className="block font-medium">{getCropDisplayName(crop, language)}{crop.productForm ? ` · ${crop.productForm}` : ''}</span>
            <span className="block text-xs text-zinc-500">{translateUi(crop.category)}</span>
          </button>
        </li>)}
      </ul>}
    </div>}
  </div>;
}

export default CropSelector;
