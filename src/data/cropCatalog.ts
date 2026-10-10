import initialCatalogue from './crop-catalog.json';
import type { Language } from '../types';

export const INITIAL_CROP_CATALOGUE = initialCatalogue.crops;
export const INITIAL_CROP_CATEGORIES = [...new Set(INITIAL_CROP_CATALOGUE.map((crop) => crop.category))];

function normalize(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s_]+/g, ' ').replace(/\s+/g, ' ');
}

const cropAliases = new Map<string, string>();
for (const crop of INITIAL_CROP_CATALOGUE) {
  for (const label of [crop.slug, crop.canonicalName, crop.localNameHindi ?? '', crop.localNameKannada ?? '', ...crop.aliases]) {
    if (label) cropAliases.set(normalize(label), crop.slug);
  }
}
// Compatibility with the original enum values saved in old demo browsers.
cropAliases.set(normalize('Green_chilli'), 'green-chilli');
cropAliases.set(normalize('Green chilli'), 'green-chilli');

export function normalizeCropIdentifier(value: string): string {
  const normalized = normalize(value);
  return cropAliases.get(normalized) ?? normalized.replace(/\s+/g, '-');
}

export function getInitialCropName(value: string, language: Language = 'en'): string {
  const slug = normalizeCropIdentifier(value);
  const crop = INITIAL_CROP_CATALOGUE.find((item) => item.slug === slug);
  if (!crop) return value;
  if (language === 'hi' && crop.localNameHindi) return crop.localNameHindi;
  if (language === 'kn' && crop.localNameKannada) return crop.localNameKannada;
  return crop.canonicalName;
}
