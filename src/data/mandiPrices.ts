import { CropType, MonthlyPricePoint } from '../types';

export interface CropPriceInfo {
  crop: CropType;
  currentSimulatedPrice: number;
  minPrice: number;
  maxPrice: number;
  bestMonth: string;
  trend: 'bullish' | 'bearish' | 'stable';
  trendPercentage: number;
  monthlyHistory: MonthlyPricePoint[];
  districtBenchmarks: { district: string; price: number }[];
}

export const CROP_PRICE_DATA: Partial<Record<string, CropPriceInfo>> = {
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
      { month: 'Jan', price: 2100, minPrice: 1900, maxPrice: 2250, volumeQuintals: 3400 },
      { month: 'Feb', price: 2150, minPrice: 1950, maxPrice: 2300, volumeQuintals: 3200 },
      { month: 'Mar', price: 2200, minPrice: 2000, maxPrice: 2380, volumeQuintals: 3000 },
      { month: 'Apr', price: 2250, minPrice: 2050, maxPrice: 2420, volumeQuintals: 2800 },
      { month: 'May', price: 2320, minPrice: 2100, maxPrice: 2480, volumeQuintals: 2500 },
      { month: 'Jun', price: 2420, minPrice: 2200, maxPrice: 2580, volumeQuintals: 2200 },
      { month: 'Jul', price: 2480, minPrice: 2250, maxPrice: 2650, volumeQuintals: 1900 },
      { month: 'Aug', price: 2400, minPrice: 2180, maxPrice: 2550, volumeQuintals: 2100 },
      { month: 'Sep', price: 2300, minPrice: 2080, maxPrice: 2450, volumeQuintals: 2600 },
      { month: 'Oct', price: 2250, minPrice: 2020, maxPrice: 2400, volumeQuintals: 3500 },
      { month: 'Nov', price: 2180, minPrice: 1950, maxPrice: 2320, volumeQuintals: 3800 },
      { month: 'Dec', price: 2120, minPrice: 1900, maxPrice: 2280, volumeQuintals: 3600 },
    ],
  },
  onion: {
    crop: 'onion',
    currentSimulatedPrice: 1720,
    minPrice: 1200,
    maxPrice: 3100,
    bestMonth: 'December',
    trend: 'bearish',
    trendPercentage: -3.5,
    districtBenchmarks: [
      { district: 'Hubballi', price: 1750 },
      { district: 'Dharwad', price: 1700 },
      { district: 'Belagavi', price: 1780 },
      { district: 'Gadag', price: 1680 },
      { district: 'Haveri', price: 1710 },
    ],
    monthlyHistory: [
      { month: 'Jan', price: 2200, minPrice: 1800, maxPrice: 2600, volumeQuintals: 2100 },
      { month: 'Feb', price: 1950, minPrice: 1600, maxPrice: 2300, volumeQuintals: 2400 },
      { month: 'Mar', price: 1700, minPrice: 1400, maxPrice: 2050, volumeQuintals: 2800 },
      { month: 'Apr', price: 1550, minPrice: 1250, maxPrice: 1850, volumeQuintals: 3100 },
      { month: 'May', price: 1450, minPrice: 1150, maxPrice: 1750, volumeQuintals: 3300 },
      { month: 'Jun', price: 1500, minPrice: 1200, maxPrice: 1800, volumeQuintals: 2900 },
      { month: 'Jul', price: 1650, minPrice: 1350, maxPrice: 1950, volumeQuintals: 2600 },
      { month: 'Aug', price: 1800, minPrice: 1500, maxPrice: 2150, volumeQuintals: 2300 },
      { month: 'Sep', price: 1750, minPrice: 1450, maxPrice: 2100, volumeQuintals: 2400 },
      { month: 'Oct', price: 1720, minPrice: 1400, maxPrice: 2080, volumeQuintals: 2500 },
      { month: 'Nov', price: 2350, minPrice: 1900, maxPrice: 2800, volumeQuintals: 1800 },
      { month: 'Dec', price: 2950, minPrice: 2400, maxPrice: 3450, volumeQuintals: 1500 },
    ],
  },
  'green-chilli': {
    crop: 'green-chilli',
    currentSimulatedPrice: 4200,
    minPrice: 2800,
    maxPrice: 5600,
    bestMonth: 'August',
    trend: 'bullish',
    trendPercentage: 9.1,
    districtBenchmarks: [
      { district: 'Hubballi', price: 4250 },
      { district: 'Dharwad', price: 4180 },
      { district: 'Belagavi', price: 4300 },
      { district: 'Gadag', price: 4100 },
      { district: 'Haveri', price: 4350 },
    ],
    monthlyHistory: [
      { month: 'Jan', price: 3400, minPrice: 2800, maxPrice: 4000, volumeQuintals: 650 },
      { month: 'Feb', price: 3600, minPrice: 3000, maxPrice: 4200, volumeQuintals: 620 },
      { month: 'Mar', price: 3900, minPrice: 3200, maxPrice: 4500, volumeQuintals: 580 },
      { month: 'Apr', price: 4100, minPrice: 3400, maxPrice: 4800, volumeQuintals: 540 },
      { month: 'May', price: 4300, minPrice: 3600, maxPrice: 5000, volumeQuintals: 490 },
      { month: 'Jun', price: 4500, minPrice: 3800, maxPrice: 5200, volumeQuintals: 440 },
      { month: 'Jul', price: 4800, minPrice: 4100, maxPrice: 5500, volumeQuintals: 390 },
      { month: 'Aug', price: 5200, minPrice: 4400, maxPrice: 5900, volumeQuintals: 340 },
      { month: 'Sep', price: 4600, minPrice: 3900, maxPrice: 5300, volumeQuintals: 420 },
      { month: 'Oct', price: 4200, minPrice: 3500, maxPrice: 4900, volumeQuintals: 510 },
      { month: 'Nov', price: 3800, minPrice: 3200, maxPrice: 4400, volumeQuintals: 570 },
      { month: 'Dec', price: 3500, minPrice: 2900, maxPrice: 4100, volumeQuintals: 610 },
    ],
  },
};

export const SAMPLE_DISTRICTS = [
  'Hubballi',
  'Dharwad',
  'Belagavi',
  'Gadag',
  'Haveri',
  'Bagalkot',
  'Vijayapura',
  'Uttara Kannada',
];
