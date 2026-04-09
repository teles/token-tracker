import { clamp } from '@/utils/format';

export function normalizeConsumedPercent(consumedPercent: number, quotaPercent = 100): number {
  return clamp(consumedPercent, 0, quotaPercent);
}

export function calculateRemainingQuota(consumedPercent: number, quotaPercent = 100): number {
  const normalizedConsumed = normalizeConsumedPercent(consumedPercent, quotaPercent);
  return clamp(quotaPercent - normalizedConsumed, 0, quotaPercent);
}

export function calculateBudgetPerRemainingDay(remainingPercent: number, remainingDays: number): number {
  if (remainingDays <= 0) {
    return 0;
  }

  return remainingPercent / remainingDays;
}

export function calculateBudgetPerPlannedDay(remainingPercent: number, plannedUsageDays: number): number {
  if (plannedUsageDays <= 0) {
    return 0;
  }

  return remainingPercent / plannedUsageDays;
}

export function calculateCurrentPace(consumedPercent: number, elapsedDays: number): number {
  if (elapsedDays <= 0) {
    return 0;
  }

  return consumedPercent / elapsedDays;
}
