import { INITIAL_CROP_CATALOGUE, INITIAL_CROP_CATEGORIES } from '../data/cropCatalog';

export interface CropRecord {
  id: string;
  canonicalName: string;
  slug: string;
  category: string;
  productForm?: string | null;
  localNameEnglish: string;
  localNameHindi?: string | null;
  localNameKannada?: string | null;
  aliases: string[];
  supportedUnits: string[];
  isActive: boolean;
  translationReviewRequired: boolean;
}

interface CropCatalogueState {
  crops: CropRecord[];
  categories: string[];
  loading: boolean;
  error: string | null;
}

// The marketplace forms currently use Zustand/localStorage demo data. Use the
// same bundled data file that seeds the backend, rather than pretending that a
// failed live API request produced an authoritative catalogue.
const bundledDemoCrops: CropRecord[] = INITIAL_CROP_CATALOGUE.map((crop) => ({
  id: crop.slug,
  canonicalName: crop.canonicalName,
  slug: crop.slug,
  category: crop.category,
  productForm: crop.productForm ?? null,
  localNameEnglish: crop.canonicalName,
  localNameHindi: crop.localNameHindi ?? null,
  localNameKannada: crop.localNameKannada ?? null,
  aliases: crop.aliases,
  supportedUnits: crop.supportedUnits,
  isActive: true,
  translationReviewRequired: Boolean(crop.localNameHindi || crop.localNameKannada),
}));

export function useCropCatalogue(): CropCatalogueState {
  return { crops: bundledDemoCrops, categories: INITIAL_CROP_CATEGORIES, loading: false, error: null };
}
