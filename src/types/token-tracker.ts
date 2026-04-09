export type ISODateString = `${number}-${number}-${number}`;
export type TemporalViewMode = 'heatmap' | 'chart';

export type PlanningDayState = 'on' | 'off';

export type SafetyStatus = 'safe' | 'attention' | 'risk';
export type ProjectionStrategyId = 'linear' | 'seasonal-week-pattern';

export interface UsageSnapshot {
  measurementDate: ISODateString;
  consumedPercent: number;
}

export interface UsageMeasurement {
  date: ISODateString;
  consumedPercent: number;
}

export interface CycleInfo {
  cycleStart: ISODateString;
  resetDate: ISODateString;
  quotaPercent: number;
}

export interface PlanningSummary {
  plannedUsageDays: number;
  plannedOffDays: number;
  totalFutureDays: number;
}

export interface ProjectionResult {
  remainingPercent: number;
  daysRemaining: number;
  plannedUsageDays: number;
  safeDailyBudgetAllDays: number;
  safeDailyBudgetPlannedDays: number;
  currentPacePerDay: number;
  estimatedExhaustionDate: ISODateString | null;
  projectionStrategyId: ProjectionStrategyId;
  safetyStatus: SafetyStatus;
}

export interface DiagnosticSummary extends ProjectionResult {
  consumedPercent: number;
  measurementDate: ISODateString;
  resetDate: ISODateString;
  rhythmLabel: string;
  insightMessage: string;
  planningSummary: PlanningSummary;
}

export interface CalendarDayModel {
  date: ISODateString;
  dayNumber: number;
  weekdayIndex: number;
  isCurrentMonth: boolean;
  isInCycle: boolean;
  isPast: boolean;
  isFuture: boolean;
  isToday: boolean;
  isMeasurementDay: boolean;
  pastIntensity: 0 | 1 | 2 | 3 | 4;
  planningState: PlanningDayState;
}

export type UsageChartPointPhase = 'historical' | 'projected';

export interface UsageChartPointModel {
  date: ISODateString;
  dayNumber: number;
  cumulativePercent: number;
  phase: UsageChartPointPhase;
  isToday: boolean;
  isMeasurementDay: boolean;
  hasManualMeasurement: boolean;
  planningState: PlanningDayState;
}

export interface UsageChartModel {
  points: UsageChartPointModel[];
}

export type PlanningMap = Partial<Record<ISODateString, PlanningDayState>>;
export type UsageHistoryMap = Partial<Record<ISODateString, number>>;

export type PlanningShortcut = 'workdays' | 'weekendOff' | 'clear';

export interface WhatIfScenario {
  id: 'fewer-days' | 'current-plan' | 'more-days';
  title: string;
  plannedUsageDays: number;
  budgetPerPlannedDay: number;
  deltaFromCurrentBudget: number;
  description: string;
}

export interface InputValidationErrors {
  measurementDate: string;
  consumedPercent: string;
}
