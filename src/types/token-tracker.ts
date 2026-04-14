export type ISODateString = `${number}-${number}-${number}`;
export type TemporalViewMode = 'heatmap' | 'chart';
export const DAY_NOTE_MAX_LENGTH = 80;

export type PlanningDayState = 'on' | 'off';
export type TrackerCycleCadence = 'monthly' | 'weekly';
export type TrackerAccountProvider = 'copilot' | 'claude' | 'codex' | 'custom';
export type TrackerCycleStatus = 'active' | 'closed';

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

export interface TrackerAccount {
  id: string;
  name: string;
  provider: TrackerAccountProvider;
  cadence: TrackerCycleCadence;
  quotaPercent: number;
  activeCycleId: string;
  cycleIds: string[];
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerCycleState {
  activeMeasurementDate: ISODateString;
  usageHistory: UsageHistoryMap;
  estimatedHistory: UsageHistoryMap;
  planning: PlanningMap;
  dayNotes: DayNotesMap;
}

export interface TrackerCycleRecord {
  id: string;
  accountId: string;
  cadence: TrackerCycleCadence;
  cycleStart: ISODateString;
  resetDate: ISODateString;
  status: TrackerCycleStatus;
  state: TrackerCycleState;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerWorkspace {
  schemaVersion: 1;
  activeAccountId: string;
  accounts: Record<string, TrackerAccount>;
  cycles: Record<string, TrackerCycleRecord>;
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
  hasNote: boolean;
  hasEstimatedUsage: boolean;
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
export type DayNotesMap = Partial<Record<ISODateString, string>>;

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
  dayNote: string;
}
