import { buildDiagnosticSummary } from '@/use-cases/buildDiagnosticSummary';

describe('buildDiagnosticSummary', () => {
  it('computes projection metrics from snapshot, cycle and planning map', () => {
    const result = buildDiagnosticSummary({
      snapshot: {
        measurementDate: '2026-04-10',
        consumedPercent: 40
      },
      cycle: {
        cycleStart: '2026-04-01',
        resetDate: '2026-04-30',
        quotaPercent: 100
      },
      planning: {
        '2026-04-11': 'on',
        '2026-04-12': 'off',
        '2026-04-13': 'on',
        '2026-04-14': 'on',
        '2026-04-15': 'on'
      }
    });

    expect(result.remainingPercent).toBe(60);
    expect(result.daysRemaining).toBe(20);
    expect(result.safeDailyBudgetAllDays).toBe(3);
    expect(result.plannedUsageDays).toBe(4);
    expect(result.safeDailyBudgetPlannedDays).toBe(15);
    expect(result.currentPacePerDay).toBe(4);
    expect(result.estimatedExhaustionDate).toBe('2026-04-27');
    expect(result.projectionStrategyId).toBe('seasonal-week-pattern');
    expect(result.safetyStatus).toBe('risk');
  });

  it('handles reset date equal to measurement date', () => {
    const result = buildDiagnosticSummary({
      snapshot: {
        measurementDate: '2026-04-30',
        consumedPercent: 70
      },
      cycle: {
        cycleStart: '2026-04-01',
        resetDate: '2026-04-30',
        quotaPercent: 100
      },
      planning: {}
    });

    expect(result.daysRemaining).toBe(0);
    expect(result.safeDailyBudgetAllDays).toBe(0);
    expect(result.safetyStatus).toBe('risk');
  });

  it('handles full quota consumption at measurement time', () => {
    const result = buildDiagnosticSummary({
      snapshot: {
        measurementDate: '2026-04-12',
        consumedPercent: 100
      },
      cycle: {
        cycleStart: '2026-04-01',
        resetDate: '2026-04-30',
        quotaPercent: 100
      },
      planning: {
        '2026-04-13': 'on'
      }
    });

    expect(result.remainingPercent).toBe(0);
    expect(result.estimatedExhaustionDate).toBe('2026-04-12');
    expect(result.safetyStatus).toBe('risk');
  });

  it('handles no future ON days by returning planned-day budget as zero', () => {
    const result = buildDiagnosticSummary({
      snapshot: {
        measurementDate: '2026-04-20',
        consumedPercent: 45
      },
      cycle: {
        cycleStart: '2026-04-01',
        resetDate: '2026-04-30',
        quotaPercent: 100
      },
      planning: {}
    });

    expect(result.plannedUsageDays).toBe(0);
    expect(result.safeDailyBudgetPlannedDays).toBe(0);
    expect(result.planningSummary.plannedOffDays).toBe(result.planningSummary.totalFutureDays);
  });
});
