import type { AppLanguage } from '@/types/app-settings';
import { translate } from '@/i18n/translate';
import type { DiagnosticSummary } from '@/types/token-tracker';
import { toShortDateLabel } from '@/utils/date';
import { formatPercent } from '@/utils/format';

export function buildPrimaryInsight(
  summary: Omit<DiagnosticSummary, 'insightMessage'>,
  language: AppLanguage = 'en-US'
): string {
  if (summary.safetyStatus === 'risk' && summary.estimatedExhaustionDate) {
    return translate(language, 'insight.risk', {
      date: toShortDateLabel(summary.estimatedExhaustionDate)
    });
  }

  if (summary.planningSummary.plannedUsageDays > 0 && summary.safeDailyBudgetPlannedDays > 0) {
    return translate(language, 'insight.safeOnDays', {
      budget: formatPercent(summary.safeDailyBudgetPlannedDays)
    });
  }

  if (summary.planningSummary.plannedOffDays > 0) {
    return translate(language, 'insight.offDaysHelp');
  }

  return translate(language, 'insight.default', {
    status: translate(
      language,
      summary.safetyStatus === 'safe'
        ? 'insight.status.safe'
        : 'insight.status.attention'
    ),
    date: toShortDateLabel(summary.resetDate)
  });
}
