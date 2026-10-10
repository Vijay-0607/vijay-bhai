import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { buildMeta, successResponse } from '../../utils/apiResponse';
import { normalizeCropText } from './crop.service';

function formatCrop(crop: Awaited<ReturnType<typeof prisma.cropCatalog.findMany>>[number]) {
  return {
    id: crop.id,
    canonicalName: crop.canonicalName,
    slug: crop.slug,
    category: crop.category,
    productForm: crop.productForm,
    localNameEnglish: crop.localNameEnglish || crop.canonicalName,
    localNameHindi: crop.localNameHindi,
    localNameKannada: crop.localNameKannada,
    aliases: crop.aliases,
    supportedUnits: crop.supportedUnits,
    isActive: crop.isActive,
    translationReviewRequired: crop.translationReviewRequired,
  };
}

export async function getCrops(req: Request, res: Response): Promise<void> {
  const category = typeof req.query.category === 'string' ? normalizeCropText(req.query.category) : '';
  const search = typeof req.query.search === 'string' ? normalizeCropText(req.query.search) : '';
  const all = await prisma.cropCatalog.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { canonicalName: 'asc' }],
  });
  let filtered = all.filter((crop) => !category || normalizeCropText(crop.category) === category);
  if (search) {
    filtered = filtered.filter((crop) => [crop.canonicalName, crop.localNameEnglish, crop.localNameHindi ?? '', crop.localNameKannada ?? '', crop.slug, ...crop.aliases]
      .some((name) => normalizeCropText(name).includes(search)));
  }

  const categories = [...new Set(all.map((crop) => crop.category))].sort((a, b) => a.localeCompare(b));
  const pageParam = Number(req.query.page);
  const pageSizeParam = Number(req.query.pageSize);
  if (Number.isInteger(pageParam) && pageParam > 0) {
    const pageSize = Number.isInteger(pageSizeParam) && pageSizeParam > 0 ? Math.min(pageSizeParam, 100) : 100;
    const start = (pageParam - 1) * pageSize;
    successResponse(res, { crops: filtered.slice(start, start + pageSize).map(formatCrop), categories, total: filtered.length }, 200, buildMeta(pageParam, pageSize, filtered.length));
    return;
  }
  successResponse(res, { crops: filtered.map(formatCrop), categories, total: filtered.length });
}

export async function getCropCategories(_req: Request, res: Response): Promise<void> {
  const rows = await prisma.cropCatalog.findMany({ where: { isActive: true }, select: { category: true } });
  const categories = [...new Set(rows.map((row) => row.category))].sort((a, b) => a.localeCompare(b));
  successResponse(res, categories);
}

export async function getCropByIdentifier(req: Request, res: Response): Promise<void> {
  const requested = decodeURIComponent(String(req.params.identifier));
  const normalized = normalizeCropText(requested);
  const crops = await prisma.cropCatalog.findMany({ where: { isActive: true } });
  const crop = crops.find((item) => [item.slug, item.canonicalName, item.localNameEnglish, item.localNameHindi ?? '', item.localNameKannada ?? '', ...item.aliases]
    .some((name) => normalizeCropText(name) === normalized));
  if (!crop) {
    res.status(404).json({ success: false, error: { code: 'CROP_NOT_FOUND', message: 'Active crop was not found.' } });
    return;
  }
  successResponse(res, { crop: formatCrop(crop) });
}
