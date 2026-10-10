import { CropCatalog } from '@prisma/client';
import { prisma } from '../../lib/prisma';

export function normalizeCropText(value: string): string {
  return value.normalize('NFKC').trim().toLocaleLowerCase().replace(/[\s_]+/g, ' ').replace(/\s+/g, ' ');
}

export async function findActiveCrop(identifier: string): Promise<CropCatalog | null> {
  const normalized = normalizeCropText(identifier);
  if (!normalized) return null;
  const bySlug = await prisma.cropCatalog.findUnique({ where: { slug: normalized.replace(/\s+/g, '-') } });
  if (bySlug?.isActive) return bySlug;
  const crops = await prisma.cropCatalog.findMany({ where: { isActive: true } });
  return crops.find((crop) => [crop.canonicalName, crop.localNameEnglish, crop.localNameHindi ?? '', crop.localNameKannada ?? '', ...crop.aliases]
    .some((name) => normalizeCropText(name) === normalized)) ?? null;
}

export async function requireActiveCropSlug(identifier: string): Promise<string | null> {
  return (await findActiveCrop(identifier))?.slug ?? null;
}
