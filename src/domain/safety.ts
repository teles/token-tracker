import type { ISODateString, SafetyStatus } from '@/types/token-tracker';
import { isBefore } from '@/utils/date';

interface SafetyStatusInput {
  estimatedExhaustionDate: ISODateString | null;
  resetDate: ISODateString;
  currentPacePerDay: number;
  safeDailyBudgetAllDays: number;
}

export function classifySafetyStatus(input: SafetyStatusInput): SafetyStatus {
  const { estimatedExhaustionDate, resetDate, currentPacePerDay, safeDailyBudgetAllDays } = input;

  if (safeDailyBudgetAllDays <= 0) {
    return 'risk';
  }

  if (estimatedExhaustionDate && isBefore(estimatedExhaustionDate, resetDate)) {
    return 'risk';
  }

  const paceRatio = currentPacePerDay / safeDailyBudgetAllDays;

  if (paceRatio >= 1) {
    return 'risk';
  }

  if (paceRatio >= 0.8) {
    return 'attention';
  }

  return 'safe';
}
