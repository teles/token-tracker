import { buildPrimaryInsight } from '@/domain/insight';
import {
  calculateBudgetPerPlannedDay,
  calculateBudgetPerRemainingDay,
  calculateCurrentPace,
  calculateRemainingQuota,
  normalizeConsumedPercent
} from '@/domain/quota';
import { summarizePlanningStates } from '@/domain/planning';
import {
  projectExhaustionDate,
  projectionStrategies,
  type ProjectionStrategy
} from '@/domain/projection';
import { classifySafetyStatus } from '@/domain/safety';
import type {
  CycleInfo,
  DiagnosticSummary,
  PlanningMap,
  UsageSnapshot
} from '@/types/token-tracker';
import { addDays, diffDays, eachDayInclusive } from '@/utils/date';

interface BuildDiagnosticSummaryInput {
  snapshot: UsageSnapshot;
  cycle: CycleInfo;
  planning: PlanningMap;
  projectionStrategy?: ProjectionStrategy;
}

function getFutureDates(snapshot: UsageSnapshot, cycle: CycleInfo) {
  const start = addDays(snapshot.measurementDate, 1);
  return eachDayInclusive(start, cycle.resetDate);
}

function getRhythmLabel(currentPace: number, safeDailyBudget: number): string {
  if (safeDailyBudget <= 0) {
    return 'No runway';
  }

  const ratio = currentPace / safeDailyBudget;

  if (ratio < 0.6) {
    return 'Controlled';
  }

  if (ratio < 0.85) {
    return 'Stable';
  }

  if (ratio < 1) {
    return 'Near limit';
  }

  return 'Over budget';
}

export function buildDiagnosticSummary(input: BuildDiagnosticSummaryInput): DiagnosticSummary {
  const { snapshot, cycle, planning } = input;
  const projectionStrategy = input.projectionStrategy ?? projectionStrategies['seasonal-week-pattern'];

  const consumedPercent = normalizeConsumedPercent(snapshot.consumedPercent, cycle.quotaPercent);
  const remainingPercent = calculateRemainingQuota(consumedPercent, cycle.quotaPercent);

  const elapsedDays = Math.max(1, diffDays(cycle.cycleStart, snapshot.measurementDate) + 1);
  const daysRemaining = Math.max(0, diffDays(snapshot.measurementDate, cycle.resetDate));

  const currentPacePerDay = calculateCurrentPace(consumedPercent, elapsedDays);
  const safeDailyBudgetAllDays = calculateBudgetPerRemainingDay(remainingPercent, daysRemaining);

  const futureDates = getFutureDates(snapshot, cycle);
  const planningSummary = summarizePlanningStates(planning, futureDates);

  const safeDailyBudgetPlannedDays = calculateBudgetPerPlannedDay(
    remainingPercent,
    planningSummary.plannedUsageDays
  );

  const estimatedExhaustionDate = projectExhaustionDate(
    {
      measurementDate: snapshot.measurementDate,
      resetDate: cycle.resetDate,
      remainingPercent,
      currentPacePerDay
    },
    projectionStrategy
  );

  const safetyStatus = classifySafetyStatus({
    estimatedExhaustionDate,
    resetDate: cycle.resetDate,
    currentPacePerDay,
    safeDailyBudgetAllDays
  });

  const summaryWithoutInsight: Omit<DiagnosticSummary, 'insightMessage'> = {
    consumedPercent,
    remainingPercent,
    daysRemaining,
    plannedUsageDays: planningSummary.plannedUsageDays,
    safeDailyBudgetAllDays,
    safeDailyBudgetPlannedDays,
    currentPacePerDay,
    estimatedExhaustionDate,
    projectionStrategyId: projectionStrategy.id,
    safetyStatus,
    measurementDate: snapshot.measurementDate,
    resetDate: cycle.resetDate,
    rhythmLabel: getRhythmLabel(currentPacePerDay, safeDailyBudgetAllDays),
    planningSummary
  };

  return {
    ...summaryWithoutInsight,
    insightMessage: buildPrimaryInsight(summaryWithoutInsight)
  };
}
