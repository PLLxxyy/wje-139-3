import type { BinLocation } from '../types';

export function getBinUsagePercent(bin: Pick<BinLocation, 'capacity' | 'occupancy'>): number {
  return bin.capacity > 0 ? (bin.occupancy / bin.capacity) * 100 : 0;
}

export function getRemainingCapacity(bin: Pick<BinLocation, 'capacity' | 'occupancy'>): number {
  return bin.capacity - bin.occupancy;
}

export function isCapacitySufficient(
  bin: Pick<BinLocation, 'capacity' | 'occupancy'> | null | undefined,
  requiredQty: number
): boolean {
  if (!bin) return false;
  return getRemainingCapacity(bin) >= requiredQty;
}

export function isHighUsage(bin: Pick<BinLocation, 'capacity' | 'occupancy'>, threshold = 90): boolean {
  return getBinUsagePercent(bin) > threshold;
}

export function canShelf(
  binId: number | null,
  bin: Pick<BinLocation, 'capacity' | 'occupancy'> | null | undefined,
  requiredQty: number
): boolean {
  return binId !== null && isCapacitySufficient(bin, requiredQty);
}

export function getCapacityStatus(
  bin: Pick<BinLocation, 'capacity' | 'occupancy'>
): 'Available' | 'Occupied' | 'Full' {
  if (bin.occupancy >= bin.capacity) return 'Full';
  if (bin.occupancy > 0) return 'Occupied';
  return 'Available';
}
