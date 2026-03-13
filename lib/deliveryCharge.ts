import { IDeliverySettings } from '@/models/DeliverySettings';

/**
 * Calculate delivery charge from admin settings and store distance.
 * 
 * Formula: baseFee + (perKmCharge × storeKm) + highDemandSurcharge + extraFee
 * Any un-set field is treated as 0. Returns 0 if settings is null or isActive is false.
 */
export function calculateDeliveryCharge(
  settings: IDeliverySettings | null,
  storeKm: number = 0
): number {
  if (!settings || !settings.isActive) return 0;

  const base = settings.baseFee ?? 0;
  const perKm = (settings.perKmCharge ?? 0) * storeKm;
  const surge = settings.highDemandSurcharge ?? 0;
  const extra = settings.extraFee ?? 0;

  return Math.round(base + perKm + surge + extra);
}

/**
 * Returns a breakdown object for UI display (only includes non-zero components).
 */
export function getDeliveryChargeBreakdown(
  settings: IDeliverySettings | null,
  storeKm: number = 0
): {
  baseFee: number;
  perKmAmount: number;
  highDemandSurcharge: number;
  extraFee: number;
  extraFeeLabel: string;
  total: number;
} {
  if (!settings || !settings.isActive) {
    return {
      baseFee: 0,
      perKmAmount: 0,
      highDemandSurcharge: 0,
      extraFee: 0,
      extraFeeLabel: '',
      total: 0,
    };
  }

  const baseFee = settings.baseFee ?? 0;
  const perKmAmount = (settings.perKmCharge ?? 0) * storeKm;
  const highDemandSurcharge = settings.highDemandSurcharge ?? 0;
  const extraFee = settings.extraFee ?? 0;
  const extraFeeLabel = settings.extraFeeLabel ?? 'Extra';

  return {
    baseFee,
    perKmAmount: Math.round(perKmAmount),
    highDemandSurcharge,
    extraFee,
    extraFeeLabel,
    total: Math.round(baseFee + perKmAmount + highDemandSurcharge + extraFee),
  };
}
