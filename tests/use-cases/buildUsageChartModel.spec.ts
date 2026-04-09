import { buildUsageChartModel } from '@/use-cases/buildUsageChartModel';

describe('buildUsageChartModel', () => {
  it('builds historical and projected points across the cycle', () => {
    const result = buildUsageChartModel({
      cycle: {
        cycleStart: '2026-04-01',
        resetDate: '2026-04-05',
        quotaPercent: 100
      },
      referenceDate: '2026-04-03',
      measurementDate: '2026-04-02',
      usageHistory: {
        '2026-04-01': 10,
        '2026-04-03': 30
      },
      planning: {
        '2026-04-04': 'on'
      }
    });

    expect(result.points.map((point) => point.date)).toEqual([
      '2026-04-01',
      '2026-04-02',
      '2026-04-03',
      '2026-04-04',
      '2026-04-05'
    ]);

    expect(result.points.map((point) => point.cumulativePercent)).toEqual([10, 30, 30, 40, 50]);
    expect(result.points.map((point) => point.phase)).toEqual([
      'historical',
      'historical',
      'historical',
      'projected',
      'projected'
    ]);

    expect(result.points[1].isMeasurementDay).toBe(true);
    expect(result.points[2].isToday).toBe(true);
    expect(result.points[3].planningState).toBe('on');
    expect(result.points[4].planningState).toBe('off');
  });

  it('caps projected usage at quota percent', () => {
    const result = buildUsageChartModel({
      cycle: {
        cycleStart: '2026-04-01',
        resetDate: '2026-04-04',
        quotaPercent: 100
      },
      referenceDate: '2026-04-02',
      measurementDate: '2026-04-02',
      usageHistory: {
        '2026-04-02': 90
      },
      planning: {
        '2026-04-03': 'on',
        '2026-04-04': 'on'
      }
    });

    expect(result.points.map((point) => point.cumulativePercent)).toEqual([0, 90, 100, 100]);
    expect(result.points[2].phase).toBe('projected');
    expect(result.points[3].phase).toBe('projected');
  });
});
