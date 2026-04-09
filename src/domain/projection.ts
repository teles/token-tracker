import type { ISODateString, ProjectionStrategyId } from '@/types/token-tracker';
import { addDays, isWeekend } from '@/utils/date';

export interface ProjectionInput {
  measurementDate: ISODateString;
  resetDate: ISODateString;
  remainingPercent: number;
  currentPacePerDay: number;
}

export interface ProjectionStrategy {
  id: ProjectionStrategyId;
  project: (input: ProjectionInput) => ISODateString | null;
}

function projectWithLinearPace(input: ProjectionInput): ISODateString | null {
  if (input.remainingPercent <= 0) {
    return input.measurementDate;
  }

  if (input.currentPacePerDay <= 0) {
    return null;
  }

  const daysUntilExhaustion = Math.ceil(input.remainingPercent / input.currentPacePerDay);
  return addDays(input.measurementDate, daysUntilExhaustion);
}

function projectWithSeasonalWeekPattern(
  input: ProjectionInput,
  workdayMultiplier: number,
  weekendMultiplier: number
): ISODateString | null {
  if (input.remainingPercent <= 0) {
    return input.measurementDate;
  }

  if (input.currentPacePerDay <= 0) {
    return null;
  }

  let remaining = input.remainingPercent;
  let cursor = input.measurementDate;

  for (let index = 0; index < 370; index += 1) {
    cursor = addDays(cursor, 1);

    const multiplier = isWeekend(cursor) ? weekendMultiplier : workdayMultiplier;
    const expectedDemand = input.currentPacePerDay * multiplier;

    if (expectedDemand <= 0) {
      continue;
    }

    remaining -= expectedDemand;

    if (remaining <= 0) {
      return cursor;
    }
  }

  return null;
}

export const linearProjectionStrategy: ProjectionStrategy = {
  id: 'linear',
  project: projectWithLinearPace
};

export const seasonalWeekPatternProjectionStrategy: ProjectionStrategy = {
  id: 'seasonal-week-pattern',
  project: (input) => projectWithSeasonalWeekPattern(input, 1.3, 0.25)
};

export const projectionStrategies: Record<ProjectionStrategyId, ProjectionStrategy> = {
  linear: linearProjectionStrategy,
  'seasonal-week-pattern': seasonalWeekPatternProjectionStrategy
};

export function projectExhaustionDate(
  input: ProjectionInput,
  strategy: ProjectionStrategy = seasonalWeekPatternProjectionStrategy
): ISODateString | null {
  return strategy.project(input);
}
