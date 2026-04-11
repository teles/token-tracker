import { buildCalendarModel } from '@/use-cases/buildCalendarModel';

describe('buildCalendarModel', () => {
  it('keeps future planning relative to real today, not selected measurement day', () => {
    const calendar = buildCalendarModel({
      snapshot: {
        measurementDate: '2026-04-09',
        consumedPercent: 38
      },
      measurementDate: '2026-04-03',
      cycle: {
        cycleStart: '2026-04-01',
        resetDate: '2026-04-30',
        quotaPercent: 100
      },
      planning: {
        '2026-04-04': 'on',
        '2026-04-10': 'on'
      },
      dayNotes: {
        '2026-04-04': 'Launch day'
      },
      usageHistory: {
        '2026-04-03': 20,
        '2026-04-09': 38
      },
      today: '2026-04-09'
    });

    const day3 = calendar.find((day) => day.date === '2026-04-03');
    const day4 = calendar.find((day) => day.date === '2026-04-04');
    const day9 = calendar.find((day) => day.date === '2026-04-09');
    const day10 = calendar.find((day) => day.date === '2026-04-10');

    expect(day3).toBeDefined();
    expect(day4).toBeDefined();
    expect(day9).toBeDefined();
    expect(day10).toBeDefined();

    expect(day3?.isMeasurementDay).toBe(true);
    expect(day3?.isFuture).toBe(false);
    expect(day3?.hasEstimatedUsage).toBe(false);

    expect(day4?.isPast).toBe(true);
    expect(day4?.isFuture).toBe(false);
    expect(day4?.planningState).toBe('off');
    expect(day4?.hasNote).toBe(true);
    expect(day4?.hasEstimatedUsage).toBe(true);

    expect(day9?.isToday).toBe(true);
    expect(day9?.isFuture).toBe(false);
    expect(day9?.isMeasurementDay).toBe(false);
    expect(day9?.hasEstimatedUsage).toBe(false);

    expect(day10?.isFuture).toBe(true);
    expect(day10?.planningState).toBe('on');
    expect(day10?.hasNote).toBe(false);
    expect(day10?.hasEstimatedUsage).toBe(false);
  });

  it('renders only cycle week for weekly accounts', () => {
    const calendar = buildCalendarModel({
      snapshot: {
        measurementDate: '2026-04-09',
        consumedPercent: 38
      },
      measurementDate: '2026-04-09',
      cycle: {
        cycleStart: '2026-04-06',
        resetDate: '2026-04-12',
        quotaPercent: 100
      },
      planning: {
        '2026-04-10': 'on'
      },
      usageHistory: {
        '2026-04-09': 38
      },
      today: '2026-04-09'
    });

    expect(calendar).toHaveLength(7);
    expect(calendar[0]?.date).toBe('2026-04-06');
    expect(calendar[6]?.date).toBe('2026-04-12');
    expect(calendar.every((day) => day.isCurrentMonth)).toBe(true);
    expect(calendar.every((day) => day.isInCycle)).toBe(true);
  });
});
