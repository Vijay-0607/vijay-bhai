export function calculateDistrictFit(dist1: string, dist2: string): number {
  const d1 = dist1.split(',')[0].trim().toLowerCase();
  const d2 = dist2.split(',')[0].trim().toLowerCase();

  if (d1 === d2) {
    return 1.0;
  }

  // Hubballi & Dharwad are twin cities (within 20km)
  if (
    (d1 === 'hubballi' && d2 === 'dharwad') ||
    (d1 === 'dharwad' && d2 === 'hubballi')
  ) {
    return 0.95;
  }

  // Adjacent district pairs
  const adjacentDistricts: Record<string, string[]> = {
    hubballi: ['dharwad', 'gadag', 'haveri'],
    dharwad: ['hubballi', 'belagavi', 'gadag', 'uttara kannada'],
    gadag: ['hubballi', 'dharwad', 'haveri', 'bagalkot', 'koppal'],
    belagavi: ['dharwad', 'bagalkot', 'uttara kannada'],
    haveri: ['hubballi', 'gadag', 'shivamogga', 'davangere'],
    bagalkot: ['belagavi', 'gadag', 'vijayapura'],
    vijayapura: ['bagalkot'],
    'uttara kannada': ['dharwad', 'belagavi', 'haveri'],
  };

  const adjList1 = adjacentDistricts[d1] || [];
  if (adjList1.includes(d2)) {
    return 0.8;
  }

  return 0.55;
}
