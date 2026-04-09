import type {
  ISODateString,
  PlanningDayState,
  PlanningMap,
  PlanningSummary
} from '@/types/token-tracker';

const PLANNING_STATE_CYCLE: PlanningDayState[] = ['off', 'on'];

export function getNextPlanningState(state: PlanningDayState = 'off'): PlanningDayState {
  const currentIndex = PLANNING_STATE_CYCLE.indexOf(state);
  const nextIndex = (currentIndex + 1) % PLANNING_STATE_CYCLE.length;
  return PLANNING_STATE_CYCLE[nextIndex];
}

export function interpretFutureDayState(state: PlanningDayState): {
  countsAsUsage: boolean;
  countsAsOff: boolean;
  intensityWeight: number;
} {
  switch (state) {
    case 'on':
      return { countsAsUsage: true, countsAsOff: false, intensityWeight: 1 };
    case 'off':
      return { countsAsUsage: false, countsAsOff: true, intensityWeight: 0 };
  }
}

export function summarizePlanningStates(planning: PlanningMap, futureDates: ISODateString[]): PlanningSummary {
  const summary: PlanningSummary = {
    plannedUsageDays: 0,
    plannedOffDays: 0,
    totalFutureDays: futureDates.length
  };

  for (const date of futureDates) {
    const state = planning[date] ?? 'off';

    if (state === 'on') {
      summary.plannedUsageDays += 1;
      continue;
    }

    summary.plannedOffDays += 1;
  }

  return summary;
}
