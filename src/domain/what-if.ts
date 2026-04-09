import type { WhatIfScenario } from '@/types/token-tracker';
import { calculateBudgetPerPlannedDay } from '@/domain/quota';

interface BuildWhatIfScenariosInput {
  remainingPercent: number;
  plannedUsageDays: number;
  totalFutureDays: number;
}

function buildScenario(
  id: WhatIfScenario['id'],
  title: string,
  plannedUsageDays: number,
  remainingPercent: number,
  currentBudgetPerPlannedDay: number,
  description: string
): WhatIfScenario {
  const budgetPerPlannedDay = calculateBudgetPerPlannedDay(remainingPercent, plannedUsageDays);

  return {
    id,
    title,
    plannedUsageDays,
    budgetPerPlannedDay,
    deltaFromCurrentBudget: budgetPerPlannedDay - currentBudgetPerPlannedDay,
    description
  };
}

export function buildWhatIfScenarios(input: BuildWhatIfScenariosInput): WhatIfScenario[] {
  const { remainingPercent, plannedUsageDays, totalFutureDays } = input;
  const cappedCurrentPlannedDays = Math.min(Math.max(plannedUsageDays, 0), totalFutureDays);

  const currentBudgetPerPlannedDay = calculateBudgetPerPlannedDay(
    remainingPercent,
    cappedCurrentPlannedDays
  );

  const fewerDays = Math.max(0, cappedCurrentPlannedDays - 2);
  const moreDays = Math.min(totalFutureDays, cappedCurrentPlannedDays + 2);

  return [
    buildScenario(
      'fewer-days',
      'If 2 fewer ON days',
      fewerDays,
      remainingPercent,
      currentBudgetPerPlannedDay,
      'Concentrates quota into fewer active days.'
    ),
    buildScenario(
      'current-plan',
      'Current ON plan',
      cappedCurrentPlannedDays,
      remainingPercent,
      currentBudgetPerPlannedDay,
      'Baseline budget from your current schedule.'
    ),
    buildScenario(
      'more-days',
      'If 2 more ON days',
      moreDays,
      remainingPercent,
      currentBudgetPerPlannedDay,
      'Spreads quota across more active days.'
    )
  ];
}
