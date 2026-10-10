import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { CreatePriceAlertInput, UpdatePriceAlertInput } from './prices.schema';
import { findActiveCrop, requireActiveCropSlug } from '../crops/crop.service';

// Baseline market data mirroring mandiPrices.ts
const BASELINE_MARKET_DATA: Record<string, any> = {
  tomato: {
    crop: 'tomato',
    currentSimulatedPrice: 2050,
    minPrice: 1350,
    maxPrice: 2950,
    bestMonth: 'November',
    trend: 'bullish',
    trendPercentage: 7.2,
    districtBenchmarks: [
      { district: 'Hubballi', price: 2000 },
      { district: 'Dharwad', price: 2150 },
      { district: 'Belagavi', price: 1980 },
      { district: 'Gadag', price: 1920 },
      { district: 'Haveri', price: 2050 },
    ],
    monthlyHistory: [
      { month: 'Jan', price: 1600, minPrice: 1350, maxPrice: 1850, volumeQuintals: 1200 },
      { month: 'Feb', price: 1750, minPrice: 1450, maxPrice: 2000, volumeQuintals: 1100 },
      { month: 'Mar', price: 1900, minPrice: 1600, maxPrice: 2100, volumeQuintals: 950 },
      { month: 'Apr', price: 2200, minPrice: 1850, maxPrice: 2450, volumeQuintals: 800 },
      { month: 'May', price: 2450, minPrice: 2100, maxPrice: 2700, volumeQuintals: 650 },
      { month: 'Jun', price: 2300, minPrice: 1950, maxPrice: 2600, volumeQuintals: 720 },
      { month: 'Jul', price: 2100, minPrice: 1800, maxPrice: 2400, volumeQuintals: 850 },
      { month: 'Aug', price: 1950, minPrice: 1650, maxPrice: 2200, volumeQuintals: 980 },
      { month: 'Sep', price: 1850, minPrice: 1550, maxPrice: 2100, volumeQuintals: 1050 },
      { month: 'Oct', price: 2050, minPrice: 1750, maxPrice: 2350, volumeQuintals: 1150 },
      { month: 'Nov', price: 2850, minPrice: 2400, maxPrice: 3200, volumeQuintals: 880 },
      { month: 'Dec', price: 2400, minPrice: 2000, maxPrice: 2750, volumeQuintals: 920 },
    ],
  },
  maize: {
    crop: 'maize',
    currentSimulatedPrice: 2250,
    minPrice: 1850,
    maxPrice: 2500,
    bestMonth: 'July',
    trend: 'stable',
    trendPercentage: 1.8,
    districtBenchmarks: [
      { district: 'Hubballi', price: 2280 },
      { district: 'Dharwad', price: 2240 },
      { district: 'Belagavi', price: 2190 },
      { district: 'Gadag', price: 2260 },
      { district: 'Haveri', price: 2300 },
    ],
    monthlyHistory: [
      { month: 'Jan', price: 2100, minPrice: 1850, maxPrice: 2250, volumeQuintals: 2100 },
      { month: 'Feb', price: 2120, minPrice: 1880, maxPrice: 2280, volumeQuintals: 2000 },
      { month: 'Mar', price: 2150, minPrice: 1900, maxPrice: 2300, volumeQuintals: 1800 },
      { month: 'Apr', price: 2180, minPrice: 1920, maxPrice: 2350, volumeQuintals: 1600 },
      { month: 'May', price: 2200, minPrice: 1950, maxPrice: 2380, volumeQuintals: 1500 },
      { month: 'Jun', price: 2240, minPrice: 1980, maxPrice: 2420, volumeQuintals: 1400 },
      { month: 'Jul', price: 2280, minPrice: 2000, maxPrice: 2500, volumeQuintals: 1350 },
      { month: 'Aug', price: 2270, minPrice: 1990, maxPrice: 2480, volumeQuintals: 1550 },
      { month: 'Sep', price: 2230, minPrice: 1960, maxPrice: 2420, volumeQuintals: 1900 },
      { month: 'Oct', price: 2210, minPrice: 1930, maxPrice: 2380, volumeQuintals: 2300 },
      { month: 'Nov', price: 2220, minPrice: 1940, maxPrice: 2400, volumeQuintals: 2200 },
      { month: 'Dec', price: 2250, minPrice: 1950, maxPrice: 2420, volumeQuintals: 2050 },
    ],
  },
  onion: {
    crop: 'onion',
    currentSimulatedPrice: 3200,
    minPrice: 1800,
    maxPrice: 4800,
    bestMonth: 'December',
    trend: 'bullish',
    trendPercentage: 12.4,
    districtBenchmarks: [
      { district: 'Hubballi', price: 3150 },
      { district: 'Dharwad', price: 3220 },
      { district: 'Belagavi', price: 3100 },
      { district: 'Gadag', price: 3350 },
      { district: 'Haveri', price: 3280 },
    ],
    monthlyHistory: [
      { month: 'Jan', price: 3600, minPrice: 2800, maxPrice: 4200, volumeQuintals: 1400 },
      { month: 'Feb', price: 3100, minPrice: 2400, maxPrice: 3800, volumeQuintals: 1600 },
      { month: 'Mar', price: 2600, minPrice: 2000, maxPrice: 3200, volumeQuintals: 1900 },
      { month: 'Apr', price: 2200, minPrice: 1800, maxPrice: 2800, volumeQuintals: 2200 },
      { month: 'May', price: 2100, minPrice: 1750, maxPrice: 2600, volumeQuintals: 2000 },
      { month: 'Jun', price: 2300, minPrice: 1900, maxPrice: 2800, volumeQuintals: 1750 },
      { month: 'Jul', price: 2500, minPrice: 2050, maxPrice: 3100, volumeQuintals: 1500 },
      { month: 'Aug', price: 2750, minPrice: 2200, maxPrice: 3400, volumeQuintals: 1350 },
      { month: 'Sep', price: 2950, minPrice: 2400, maxPrice: 3700, volumeQuintals: 1250 },
      { month: 'Oct', price: 3200, minPrice: 2600, maxPrice: 4000, volumeQuintals: 1100 },
      { month: 'Nov', price: 3800, minPrice: 3000, maxPrice: 4600, volumeQuintals: 950 },
      { month: 'Dec', price: 4200, minPrice: 3400, maxPrice: 4800, volumeQuintals: 900 },
    ],
  },
  'green-chilli': {
    crop: 'green-chilli',
    currentSimulatedPrice: 4500,
    minPrice: 2800,
    maxPrice: 6200,
    bestMonth: 'October',
    trend: 'bearish',
    trendPercentage: -3.5,
    districtBenchmarks: [
      { district: 'Hubballi', price: 4450 },
      { district: 'Dharwad', price: 4520 },
      { district: 'Belagavi', price: 4600 },
      { district: 'Gadag', price: 4380 },
      { district: 'Haveri', price: 4550 },
    ],
    monthlyHistory: [
      { month: 'Jan', price: 3800, minPrice: 2800, maxPrice: 4600, volumeQuintals: 600 },
      { month: 'Feb', price: 4100, minPrice: 3100, maxPrice: 5000, volumeQuintals: 550 },
      { month: 'Mar', price: 4400, minPrice: 3300, maxPrice: 5300, volumeQuintals: 500 },
      { month: 'Apr', price: 4700, minPrice: 3600, maxPrice: 5700, volumeQuintals: 450 },
      { month: 'May', price: 5100, minPrice: 3900, maxPrice: 6100, volumeQuintals: 400 },
      { month: 'Jun', price: 4900, minPrice: 3750, maxPrice: 5900, volumeQuintals: 420 },
      { month: 'Jul', price: 4600, minPrice: 3500, maxPrice: 5500, volumeQuintals: 480 },
      { month: 'Aug', price: 4300, minPrice: 3300, maxPrice: 5200, volumeQuintals: 520 },
      { month: 'Sep', price: 4200, minPrice: 3200, maxPrice: 5000, volumeQuintals: 560 },
      { month: 'Oct', price: 4500, minPrice: 3400, maxPrice: 5400, volumeQuintals: 510 },
      { month: 'Nov', price: 5400, minPrice: 4100, maxPrice: 6200, volumeQuintals: 380 },
      { month: 'Dec', price: 4800, minPrice: 3700, maxPrice: 5800, volumeQuintals: 440 },
    ],
  },
};

export async function getAllPrices(_req: Request, res: Response): Promise<void> {
  const [catalogue, recentRecords] = await Promise.all([
    prisma.cropCatalog.findMany({ where: { isActive: true }, orderBy: { canonicalName: 'asc' } }),
    prisma.priceRecord.findMany({ orderBy: { recordedAt: 'desc' }, take: 500 }),
  ]);
  const latestRecord = new Map<string, typeof recentRecords[number]>();
  for (const record of recentRecords) if (!latestRecord.has(record.crop)) latestRecord.set(record.crop, record);

  const responseData: Record<string, unknown> = {};
  for (const crop of catalogue) {
    const record = latestRecord.get(crop.slug);
    const simulated = BASELINE_MARKET_DATA[crop.slug];
    if (record) {
      responseData[crop.slug] = {
        ...simulated,
        crop: crop.slug,
        canonicalName: crop.canonicalName,
        priceDataAvailable: true,
        latestPricePerQtl: Number(record.pricePerQtl),
        minPrice: record.minPrice === null ? undefined : Number(record.minPrice),
        maxPrice: record.maxPrice === null ? undefined : Number(record.maxPrice),
        market: record.market,
        district: record.district,
        recordedAt: record.recordedAt,
        sourceType: record.sourceType,
      };
    } else if (simulated) {
      responseData[crop.slug] = { ...simulated, crop: crop.slug, canonicalName: crop.canonicalName, priceDataAvailable: true, sourceType: 'SIMULATED_DEMO' };
    } else {
      responseData[crop.slug] = { crop: crop.slug, canonicalName: crop.canonicalName, priceDataAvailable: false, message: 'Price data unavailable' };
    }
  }
  successResponse(res, responseData);
}

export async function getPriceByCrop(req: Request, res: Response): Promise<void> {
  const crop = await findActiveCrop(String(req.params.crop));
  if (!crop) {
    errorResponse(res, 404, 'CROP_NOT_FOUND', 'Active crop was not found in the catalogue.');
    return;
  }
  const records = await prisma.priceRecord.findMany({ where: { crop: crop.slug }, orderBy: { recordedAt: 'desc' }, take: 12 });
  const simulated = BASELINE_MARKET_DATA[crop.slug];
  if (!records.length && !simulated) {
    successResponse(res, { crop: crop.slug, canonicalName: crop.canonicalName, priceDataAvailable: false, message: 'Price data unavailable for this crop.' });
    return;
  }
  const latest = records[0];
  successResponse(res, {
    ...(simulated ?? {}),
    crop: crop.slug,
    canonicalName: crop.canonicalName,
    priceDataAvailable: true,
    sourceType: latest?.sourceType ?? 'SIMULATED_DEMO',
    latestPricePerQtl: latest ? Number(latest.pricePerQtl) : simulated?.currentSimulatedPrice,
    records: records.map((record) => ({ market: record.market, district: record.district, pricePerQtl: Number(record.pricePerQtl), minPrice: record.minPrice === null ? null : Number(record.minPrice), maxPrice: record.maxPrice === null ? null : Number(record.maxPrice), recordedAt: record.recordedAt, sourceType: record.sourceType })),
  });
}

export async function getPriceAlerts(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;

  const alerts = await prisma.priceAlert.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const formatted = alerts.map((a) => ({
    id: a.id,
    userId: a.userId,
    crop: a.crop,
    targetPrice: parseFloat(String(a.targetPricePerQtl)),
    targetPricePerQtl: parseFloat(String(a.targetPricePerQtl)),
    condition: a.condition.toLowerCase(),
    district: a.district ?? 'All Districts',
    active: a.isActive,
    isActive: a.isActive,
    lastTriggeredAt: a.lastTriggeredAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
  }));

  successResponse(res, formatted);
}

export async function createPriceAlert(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const input = req.body as CreatePriceAlertInput;
  const crop = await requireActiveCropSlug(input.crop);
  if (!crop) { errorResponse(res, 400, 'UNSUPPORTED_CROP', 'Select an active crop from the catalogue.'); return; }

  const alert = await prisma.priceAlert.create({
    data: {
      userId,
      crop,
      targetPricePerQtl: input.targetPricePerQtl,
      condition: input.condition as any,
      district: input.district ?? null,
    },
  });

  successResponse(
    res,
    {
      id: alert.id,
      userId: alert.userId,
      crop: alert.crop,
      targetPrice: parseFloat(String(alert.targetPricePerQtl)),
      condition: alert.condition.toLowerCase(),
      district: alert.district ?? 'All Districts',
      active: alert.isActive,
      createdAt: alert.createdAt.toISOString(),
    },
    201
  );
}

export async function updatePriceAlert(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const input = req.body as UpdatePriceAlertInput;

  const alert = await prisma.priceAlert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    errorResponse(res, 404, 'NOT_FOUND', 'Price alert not found');
    return;
  }

  const updated = await prisma.priceAlert.update({
    where: { id },
    data: {
      ...(input.targetPricePerQtl !== undefined && { targetPricePerQtl: input.targetPricePerQtl }),
      ...(input.condition !== undefined && { condition: input.condition as any }),
      ...(input.district !== undefined && { district: input.district }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });

  successResponse(
    res,
    {
      id: updated.id,
      userId: updated.userId,
      crop: updated.crop,
      targetPrice: parseFloat(String(updated.targetPricePerQtl)),
      condition: updated.condition.toLowerCase(),
      district: updated.district ?? 'All Districts',
      active: updated.isActive,
      updatedAt: updated.updatedAt.toISOString(),
    }
  );
}

export async function deletePriceAlert(req: Request, res: Response): Promise<void> {
  const userId = req.user!.id;
  const id = req.params.id as string;

  const alert = await prisma.priceAlert.findUnique({ where: { id } });
  if (!alert || alert.userId !== userId) {
    errorResponse(res, 404, 'NOT_FOUND', 'Price alert not found');
    return;
  }

  await prisma.priceAlert.delete({ where: { id } });
  successResponse(res, { success: true });
}
