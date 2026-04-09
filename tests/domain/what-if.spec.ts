import { buildWhatIfScenarios } from '@/domain/what-if';

describe('what-if scenario builder', () => {
  it('creates scenarios around the current ON-day plan', () => {
    const scenarios = buildWhatIfScenarios({
      remainingPercent: 40,
      plannedUsageDays: 8,
      totalFutureDays: 12
    });

    expect(scenarios).toHaveLength(3);
    expect(scenarios[0].plannedUsageDays).toBe(6);
    expect(scenarios[1].plannedUsageDays).toBe(8);
    expect(scenarios[2].plannedUsageDays).toBe(10);
  });

  it('handles cases with no planned ON days', () => {
    const scenarios = buildWhatIfScenarios({
      remainingPercent: 40,
      plannedUsageDays: 0,
      totalFutureDays: 5
    });

    expect(scenarios[1].budgetPerPlannedDay).toBe(0);
    expect(scenarios[2].plannedUsageDays).toBe(2);
  });
});
