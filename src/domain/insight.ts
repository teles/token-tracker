import type { DiagnosticSummary } from '@/types/token-tracker';
import { toShortDateLabel } from '@/utils/date';
import { formatPercent } from '@/utils/format';

export function buildPrimaryInsight(summary: Omit<DiagnosticSummary, 'insightMessage'>): string {
  if (summary.safetyStatus === 'risk' && summary.estimatedExhaustionDate) {
    return `At the current pace, your quota will run out on ${toShortDateLabel(summary.estimatedExhaustionDate)}.`;
  }

  if (summary.planningSummary.plannedUsageDays > 0 && summary.safeDailyBudgetPlannedDays > 0) {
    return `To reach reset safely, keep usage under ${formatPercent(summary.safeDailyBudgetPlannedDays)} on each planned day.`;
  }

  if (summary.planningSummary.plannedOffDays > 0) {
    return 'Planned off-days increase your safe budget for active days.';
  }

  return `You are ${summary.safetyStatus === 'safe' ? 'on track' : 'close to your limit'} to reach reset on ${toShortDateLabel(summary.resetDate)}.`;
}
